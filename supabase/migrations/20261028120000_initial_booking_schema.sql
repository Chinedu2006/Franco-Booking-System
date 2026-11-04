-- Franco Pitch Booking: initial Supabase schema and access controls.
-- Admin roles are assigned through trusted SQL only; auth user metadata is never
-- consulted for privileges.

begin;

create schema if not exists extensions;
create extension if not exists btree_gist with schema extensions;
set local search_path = public, extensions;

do $$
declare
  btree_gist_schema text;
begin
  select extension_schema.nspname
  into btree_gist_schema
  from pg_catalog.pg_extension as installed_ext
  join pg_catalog.pg_namespace as extension_schema
    on extension_schema.oid = installed_ext.extnamespace
  where installed_ext.extname = 'btree_gist';

  if btree_gist_schema is null then
    raise exception 'Required PostgreSQL extension btree_gist is unavailable';
  end if;

  perform pg_catalog.set_config(
    'search_path',
    pg_catalog.format('public, %I', btree_gist_schema),
    true
  );
end;
$$;

create type public.booking_status as enum ('pending', 'approved', 'rejected');

create table public.pitches (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  pitch_type text not null,
  size_label text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint pitches_code_format check (code ~ '^[A-H]$')
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  full_name text not null default '',
  created_at timestamptz not null default now()
);

-- This table is intentionally not writable or readable by API roles.
-- Administrators are assigned by a trusted database operator.
create table public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('admin')),
  assigned_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references public.profiles (id) on delete restrict,
  pitch_id uuid not null references public.pitches (id) on delete restrict,
  contact_name text not null check (length(btrim(contact_name)) > 0),
  event_description text not null check (length(btrim(event_description)) > 0),
  booking_date date not null,
  start_time time without time zone not null,
  end_time time without time zone not null,
  submitted_at timestamptz not null default now(),
  status public.booking_status not null default 'pending',
  constraint bookings_time_order check (end_time > start_time),
  constraint bookings_no_overlapping_approved_slots
    exclude using gist (
      pitch_id with =,
      tsrange(booking_date + start_time, booking_date + end_time, '[)') with &&
    )
    where (status = 'approved')
);

insert into public.pitches (code, name, pitch_type, size_label)
values
  ('A', 'Pitch A', 'Main Pitch', 'Large size'),
  ('B', 'Pitch B', 'Standard Pitch', 'Medium size'),
  ('C', 'Pitch C', 'Turf Pitch', 'Medium size'),
  ('D', 'Pitch D', 'Futsal Court', 'Small size'),
  ('E', 'Pitch E', 'Multipurpose Court', 'Medium size'),
  ('F', 'Pitch F', 'Training Ground', 'Large size'),
  ('G', 'Pitch G', 'Standard Pitch', 'Medium size'),
  ('H', 'Pitch H', 'Turf Pitch', 'Medium size')
on conflict (code) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles as roles
    where roles.user_id = (select auth.uid())
      and roles.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do update
    set email = excluded.email;

  return new;
end;
$$;

create or replace function public.sync_auth_user_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set email = new.email
  where id = new.id;

  return new;
end;
$$;

revoke all on function public.handle_auth_user_created() from public, anon, authenticated;
revoke all on function public.sync_auth_user_email() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_auth_user_created();

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.sync_auth_user_email();

alter table public.pitches enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.bookings enable row level security;

-- Remove any project-wide default API grants on these new tables, then grant
-- only the operations required by the policies below.
revoke all on table public.pitches, public.profiles, public.user_roles, public.bookings
  from public, anon, authenticated;

grant usage on schema public to anon, authenticated;
grant select on table public.pitches to anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (full_name) on table public.profiles to authenticated;
grant select on table public.bookings to authenticated;
grant insert (
  pitch_id,
  contact_name,
  event_description,
  booking_date,
  start_time,
  end_time
) on table public.bookings to authenticated;

create policy pitches_read_active_or_admin
  on public.pitches
  for select
  to authenticated
  using (is_active or (select public.is_admin()));

create policy pitches_read_active_anon
  on public.pitches
  for select
  to anon
  using (is_active);

create policy profiles_read_owner_or_admin
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy profiles_update_own_name
  on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy bookings_read_owner_or_admin
  on public.bookings
  for select
  to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy bookings_insert_own_pending
  on public.bookings
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'pending'
    and exists (
      select 1
      from public.pitches as pitch
      where pitch.id = pitch_id
        and pitch.is_active
    )
  );

-- Reviews are performed only through this admin-checked function. The GiST
-- exclusion constraint remains the concurrency-safe final overlap guard.
create or replace function public.review_booking(
  p_booking_id uuid,
  p_decision public.booking_status
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  reviewed_booking public.bookings;
begin
  if not public.is_admin() then
    raise insufficient_privilege using message = 'Administrator role required';
  end if;

  if p_decision not in ('approved', 'rejected') then
    raise check_violation using message = 'Decision must be approved or rejected';
  end if;

  update public.bookings as booking
  set status = p_decision
  where booking.id = p_booking_id
    and booking.status = 'pending'
  returning booking.* into reviewed_booking;

  if not found then
    raise no_data_found using message = 'Pending booking was not found';
  end if;

  return reviewed_booking;
end;
$$;

revoke all on function public.review_booking(uuid, public.booking_status) from public, anon;
grant execute on function public.review_booking(uuid, public.booking_status) to authenticated;

commit;
