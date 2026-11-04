
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  LandPlot,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  LogOut,
  Menu,
  X,
  RefreshCw,
  Plus,
  Pencil,
  Power,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useBookings } from "../hooks/useBookings";
import { usePitches } from "../hooks/usePitches";
import { getEffectiveStatus, getLagosDateTime } from "../lib/lagosTime";

const statusStyles = {
  Pending: "bg-amber-100 text-amber-800",
  Approved: "bg-green-100 text-green-800",
  Completed: "bg-blue-100 text-blue-800",
  Expired: "bg-slate-100 text-slate-600",
  Rejected: "bg-red-100 text-red-800",
  Cancelled: "bg-gray-100 text-gray-600",
};

export default function AdminDashboard() {
  const {
    bookings,
    loading,
    error,
    refreshBookings,
    nowTick,
  } = useBookings();
  const {
    pitches,
    loading: pitchesLoading,
    error: pitchesError,
    refreshPitches,
  } = usePitches({ includeInactive: true });

  const [authorization, setAuthorization] = useState("checking");
  const [authorizationError, setAuthorizationError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [activePage, setActivePage] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [editingPitch, setEditingPitch] = useState(null);
  const [venueForm, setVenueForm] = useState({
    code: "",
    name: "",
    type: "",
    size: "",
  });
  const [savingVenue, setSavingVenue] = useState(false);
  const [venueMessage, setVenueMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function checkAdminAccess() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError?.name === "AuthSessionMissingError") {
          if (active) setAuthorization("denied");
          return;
        }
        if (userError) throw userError;

        if (!user) {
          if (active) setAuthorization("denied");
          return;
        }

        const { data: isAdmin, error: roleError } =
          await supabase.rpc("is_admin");
        if (roleError) throw roleError;

        if (active) setAuthorization(isAdmin ? "authorized" : "denied");
      } catch (error) {
        if (active) {
          setAuthorizationError(
            error instanceof Error ? error.message : "Could not verify administrator access.",
          );
          setAuthorization("error");
        }
      }
    }

    checkAdminAccess();

    return () => {
      active = false;
    };
  }, []);

  const lagosNow = getLagosDateTime(new Date(nowTick));

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const effectiveStatus = getEffectiveStatus(booking, lagosNow);
      const matchesSearch = [
        booking.id,
        booking.userName,
        booking.userEmail,
        booking.pitchName,
        booking.eventDescription,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesFilter =
        filter === "All" ||
        effectiveStatus.toLowerCase() === filter.toLowerCase() ||
        booking.status.toLowerCase() === filter.toLowerCase();

      return matchesSearch && matchesFilter;
    });
  }, [bookings, search, filter, lagosNow]);

  const counts = {
    total: bookings.length,
    pending: bookings.filter(
      (b) => getEffectiveStatus(b, lagosNow) === "Pending",
    ).length,
    approved: bookings.filter(
      (b) => getEffectiveStatus(b, lagosNow) === "Approved",
    ).length,
    completed: bookings.filter(
      (b) => getEffectiveStatus(b, lagosNow) === "Completed",
    ).length,
    rejected: bookings.filter(
      (b) => getEffectiveStatus(b, lagosNow) === "Rejected",
    ).length,
  };

  async function updateStatus(id, newStatus) {
    if (updatingId) return;

    setUpdatingId(id);
    setMessage("");

    try {
      const { error: reviewError } = await supabase.rpc(
        "review_booking",
        {
          p_booking_id: id,
          p_decision: newStatus.toLowerCase(),
        }
      );

      if (reviewError) {
        throw reviewError;
      }

      setMessage(`Booking ${id} marked ${newStatus}.`);
      await refreshBookings();
    } catch (error) {
      setMessage(
        error.message || "Could not update the booking status."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    setMessage("");

    const { error: logoutError } = await supabase.auth.signOut();

    if (logoutError) {
      setMessage(`Logout failed: ${logoutError.message}`);
      setLoggingOut(false);
      return;
    }

    window.location.assign("/login");
  }

  function resetVenueForm() {
    setEditingPitch(null);
    setVenueForm({ code: "", name: "", type: "", size: "" });
  }

  async function saveVenue(event) {
    event.preventDefault();
    if (authorization !== "authorized" || savingVenue) return;

    setSavingVenue(true);
    setVenueMessage("");

    try {
      const venueValues = {
        name: venueForm.name.trim(),
        pitch_type: venueForm.type.trim(),
        size_label: venueForm.size.trim(),
      };

      const { error: saveError } = editingPitch
        ? await supabase
            .from("pitches")
            .update(venueValues)
            .eq("id", editingPitch.uuid)
        : await supabase.from("pitches").insert({
            ...venueValues,
            code: venueForm.code.trim().toUpperCase(),
          });

      if (saveError) throw saveError;

      await refreshPitches();
      setVenueMessage(editingPitch ? "Venue updated." : "Venue added.");
      resetVenueForm();
    } catch (error) {
      setVenueMessage(
        error instanceof Error ? error.message : "Could not save this venue.",
      );
    } finally {
      setSavingVenue(false);
    }
  }

  async function toggleVenue(pitch) {
    if (authorization !== "authorized" || savingVenue) return;

    setSavingVenue(true);
    setVenueMessage("");

    try {
      const { error: updateError } = await supabase
        .from("pitches")
        .update({ is_active: !pitch.isActive })
        .eq("id", pitch.uuid);
      if (updateError) throw updateError;

      await refreshPitches();
      setVenueMessage(
        `${pitch.name} ${pitch.isActive ? "deactivated" : "activated"}.`,
      );
    } catch (error) {
      setVenueMessage(
        error instanceof Error ? error.message : "Could not update venue status.",
      );
    } finally {
      setSavingVenue(false);
    }
  }

  const navigation = [
    { name: "Overview", icon: LayoutDashboard },
    { name: "Bookings", icon: CalendarDays },
    { name: "Pitches", icon: LandPlot },
  ];

  if (authorization === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-slate-600">
        Checking administrator access...
      </main>
    );
  }

  if (authorization !== "authorized") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <section className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            Administrator access required
          </h1>
          <p role={authorizationError ? "alert" : "status"} className="mt-3 text-sm text-slate-600">
            {authorizationError ||
              "Your account is not authorized to access administration features."}
          </p>
          <Link
            to="/login"
            className="mt-6 inline-flex rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
          >
            Sign in
          </Link>
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <header className="flex items-center justify-between bg-slate-950 px-5 py-4 text-white">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-green-400">
            Franco Pitch Booking
          </p>
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
        </div>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-lg p-2 hover:bg-slate-800 md:hidden"
          aria-label="Toggle navigation"
        >
          {sidebarOpen ? <X /> : <Menu />}
        </button>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="hidden items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm disabled:opacity-50 md:flex"
        >
          <LogOut size={16} />
          {loggingOut ? "Logging out..." : "Log out"}
        </button>
      </header>

      <div className="md:flex">
        <aside
          className={`${
            sidebarOpen ? "block" : "hidden"
          } w-full border-r border-slate-200 bg-white p-4 md:block md:min-h-[calc(100vh-76px)] md:w-60`}
        >
          <p className="mb-3 px-3 text-xs font-semibold uppercase text-slate-400">
            Administration
          </p>

          <nav className="space-y-1">
            {navigation.map(({ name, icon: Icon }) => (
              <button
                key={name}
                onClick={() => {
                  setActivePage(name);
                  setSidebarOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium ${
                  activePage === name
                    ? "bg-green-50 text-green-800"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon size={19} />
                {name}
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 p-4 md:p-8">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">{activePage}</h2>
              <p className="mt-1 text-sm text-slate-500">
                Manage pitch bookings and review student requests.
              </p>
            </div>

            <button
              onClick={() => {
                refreshBookings();
                refreshPitches();
              }}
              disabled={loading || pitchesLoading}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading || pitchesLoading ? "animate-spin" : ""}
              />
              {loading || pitchesLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {message && (
            <div
              role="status"
              className="mb-5 flex items-start justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900"
            >
              <span>{message}</span>
              <button
                onClick={() => setMessage("")}
                aria-label="Dismiss message"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
            >
              Could not load bookings: {error}
            </div>
          )}

          {activePage === "Overview" && (
            <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Total Bookings",
                  value: counts.total,
                  icon: CalendarDays,
                  color: "text-blue-600",
                },
                {
                  label: "Pending Requests",
                  value: counts.pending,
                  icon: Clock,
                  color: "text-amber-600",
                },
                {
                  label: "Approved",
                  value: counts.approved,
                  icon: CheckCircle,
                  color: "text-green-600",
                },
                {
                  label: "Rejected",
                  value: counts.rejected,
                  icon: XCircle,
                  color: "text-red-600",
                },
              ].map(({ label, value, icon: Icon, color }) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">{label}</p>
                    <Icon className={color} size={21} />
                  </div>
                  <p className="mt-3 text-3xl font-bold">{value}</p>
                </div>
              ))}
            </div>
          )}

          {activePage === "Pitches" ? (
            <section className="space-y-5">
              <form
                onSubmit={saveVenue}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-4 flex items-center gap-2">
                  <LandPlot className="text-green-700" size={22} />
                  <h3 className="font-bold">
                    {editingPitch ? "Edit venue" : "Add venue"}
                  </h3>
                </div>

                {venueMessage && (
                  <p
                    role="status"
                    className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-900"
                  >
                    {venueMessage}
                  </p>
                )}

                {pitchesError && (
                  <p
                    role="alert"
                    className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800"
                  >
                    Could not load venues: {pitchesError}
                  </p>
                )}

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {!editingPitch && (
                    <label className="text-sm font-medium text-slate-700">
                      Venue code
                      <input
                        required
                        pattern="[A-Z][A-Z0-9-]*"
                        title="Use an uppercase letter followed by uppercase letters, digits, or hyphens."
                        value={venueForm.code}
                        onChange={(event) =>
                          setVenueForm((form) => ({
                            ...form,
                            code: event.target.value.toUpperCase(),
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        placeholder="e.g. I"
                      />
                    </label>
                  )}
                  <label className="text-sm font-medium text-slate-700">
                    Venue name
                    <input
                      required
                      value={venueForm.name}
                      onChange={(event) =>
                        setVenueForm((form) => ({
                          ...form,
                          name: event.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Venue type
                    <input
                      required
                      value={venueForm.type}
                      onChange={(event) =>
                        setVenueForm((form) => ({
                          ...form,
                          type: event.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Size
                    <input
                      required
                      value={venueForm.size}
                      onChange={(event) =>
                        setVenueForm((form) => ({
                          ...form,
                          size: event.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </label>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="submit"
                    disabled={savingVenue}
                    className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
                  >
                    <Plus size={16} />
                    {savingVenue
                      ? "Saving..."
                      : editingPitch
                        ? "Save changes"
                        : "Add venue"}
                  </button>
                  {editingPitch && (
                    <button
                      type="button"
                      onClick={resetVenueForm}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3">Venue</th>
                      <th className="px-4 py-3">Type / Size</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pitches.map((pitch) => (
                      <tr key={pitch.uuid}>
                        <td className="px-4 py-3 font-semibold">{pitch.id}</td>
                        <td className="px-4 py-3">{pitch.name}</td>
                        <td className="px-4 py-3">
                          {pitch.type} • {pitch.size}
                        </td>
                        <td className="px-4 py-3">
                          {pitch.isActive ? "Active" : "Inactive"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPitch(pitch);
                                setVenueForm({
                                  code: pitch.id,
                                  name: pitch.name,
                                  type: pitch.type,
                                  size: pitch.size,
                                });
                                setVenueMessage("");
                              }}
                              className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold"
                            >
                              <Pencil size={14} />
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={savingVenue}
                              onClick={() => toggleVenue(pitch)}
                              className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold disabled:opacity-50"
                            >
                              <Power size={14} />
                              {pitch.isActive ? "Deactivate" : "Activate"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!pitchesLoading && pitches.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                          No venues found.
                        </td>
                      </tr>
                    )}
                    {pitchesLoading && pitches.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                          Loading venues...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          ) : (
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-bold">Booking requests</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Search requests and review their status.
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="flex items-center gap-2 rounded-lg border border-slate-300 px-3">
                    <Search size={17} className="text-slate-400" />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search bookings..."
                      className="min-w-0 py-2 text-sm outline-none"
                    />
                  </div>

                  <select
                    value={filter}
                    onChange={(event) => setFilter(event.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    aria-label="Filter bookings by status"
                  >
                    <option>All</option>
                    <option>Pending</option>
                    <option>Approved</option>
                    <option>Completed</option>
                    <option>Expired</option>
                    <option>Rejected</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Booking / Student</th>
                      <th className="px-4 py-3">Pitch</th>
                      <th className="px-4 py-3">Date / Time</th>
                      <th className="px-4 py-3">Event</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredBookings.map((booking) => {
                      const effectiveStatus = getEffectiveStatus(
                        booking,
                        lagosNow,
                      );

                      return (
                        <tr key={booking.id} className="align-top">
                          <td className="px-4 py-4">
                            <p className="font-semibold">{booking.id}</p>
                            <p className="mt-1">{booking.userName}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {booking.userEmail}
                            </p>
                          </td>

                          <td className="px-4 py-4">
                            {booking.pitchName}
                            <p className="mt-1 text-xs text-slate-500">
                              {booking.pitchType}
                            </p>
                          </td>

                          <td className="px-4 py-4">
                            <p>
                              {new Date(
                                `${booking.bookingDate}T00:00:00`,
                              ).toLocaleDateString()}
                            </p>
                            <p className="mt-1 text-slate-500">
                              {booking.startTime} - {booking.endTime}
                            </p>
                          </td>

                          <td className="px-4 py-4">
                            {booking.eventDescription}
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                                statusStyles[effectiveStatus] ??
                                "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {effectiveStatus}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            {effectiveStatus === "Pending" ? (
                              <div className="flex flex-col gap-2">
                                <button
                                  disabled={updatingId !== null}
                                  onClick={() =>
                                    updateStatus(booking.id, "Approved")
                                  }
                                  className="rounded-md bg-green-700 px-3 py-2 text-xs font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {updatingId === booking.id
                                    ? "Updating..."
                                    : "Approve"}
                                </button>

                                <button
                                  disabled={updatingId !== null}
                                  onClick={() =>
                                    updateStatus(booking.id, "Rejected")
                                  }
                                  className="rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : effectiveStatus === "Expired" ? (
                              <span className="text-xs text-slate-400">
                                Expired
                              </span>
                            ) : effectiveStatus === "Completed" ? (
                              <span className="text-xs font-medium text-blue-600">
                                Completed
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">
                                Reviewed
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {!loading && filteredBookings.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-10 text-center text-slate-500"
                        >
                          {error
                            ? "Bookings could not be loaded."
                            : bookings.length === 0
                              ? "No booking requests have been submitted yet."
                              : "No matching bookings found."}
                        </td>
                      </tr>
                    )}

                    {loading && bookings.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-10 text-center text-slate-500"
                        >
                          Loading booking requests...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <p className="mt-5 text-xs text-slate-500">
            Booking requests are stored in Supabase. Only authorized
            administrators can approve or reject requests.
          </p>
        </main>
      </div>
    </div>
  );
}
