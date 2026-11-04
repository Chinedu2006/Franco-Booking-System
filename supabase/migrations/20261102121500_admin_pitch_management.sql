begin;

alter table public.pitches
  drop constraint pitches_code_format,
  add constraint pitches_code_format
    check (code ~ '^[A-Z][A-Z0-9-]*$');

grant insert (code, name, pitch_type, size_label)
  on table public.pitches to authenticated;
grant update (code, name, pitch_type, size_label, is_active)
  on table public.pitches to authenticated;

create policy pitches_insert_admin
  on public.pitches
  for insert
  to authenticated
  with check ((select public.is_admin()));

create policy pitches_update_admin
  on public.pitches
  for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

commit;
