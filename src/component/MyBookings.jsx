import { Link } from "react-router-dom";
import topBackground from "../assets/top-background.jpg";

import {
  Calendar,
  Clock,
  UserRound,
  Users,
  ChevronRight,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock3,
} from "lucide-react";
import Navbar from "./Navbar";
import { useBookings } from "../hooks/useBookings";
import { getEffectiveStatus, getLagosDateTime } from "../lib/lagosTime";

export default function MyBookings() {
  const { bookings, loading, error, nowTick } = useBookings();
  const lagosNow = getLagosDateTime(new Date(nowTick));

  // STATUS STYLES
  const getStatusStyles = (status) => {
    if (status === "Approved") {
      return "bg-green-100 text-green-700";
    }

    if (status === "Completed") {
      return "bg-blue-100 text-blue-700";
    }

    if (status === "Rejected") {
      return "bg-red-100 text-red-700";
    }

    if (status === "Expired") {
      return "bg-slate-100 text-slate-600";
    }

    if (status === "Cancelled") {
      return "bg-gray-100 text-gray-500";
    }

    return "bg-orange-100 text-orange-700";
  };

  // STATUS ICON
  const getStatusIcon = (status) => {
    if (status === "Approved" || status === "Completed") {
      return <CheckCircle size={16} />;
    }

    if (status === "Rejected" || status === "Cancelled") {
      return <XCircle size={16} />;
    }

    return <Clock3 size={16} />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* =========================
          HERO
      ========================== */}

      <section
        className="relative bg-cover bg-center"
        style={{
          backgroundImage: `url(${topBackground})`,
        }}
      >
        <div className="mx-auto max-w-[1500px] px-8 py-16">

          <Link
            to="/"
            className="mb-3 flex items-center gap-2 text-sm font-bold text-green-400 hover:text-green-300"
          >
            <ArrowLeft size={17} />
            Back to Home
          </Link>

          <h2 className="my-[10px] text-4xl font-black text-white md:text-5xl">
            My Bookings
          </h2>

          <p className="mt-3 max-w-2xl text-white">
            View your pitch booking requests and check their current status.
          </p>

        </div>
      </section>

      {/* =========================
          MAIN CONTENT
      ========================== */}

      <main className="mx-auto max-w-[1200px] px-6 py-10">

        {/* PAGE TITLE */}

        <div className="mb-7">
          <h2 className="text-2xl font-bold text-gray-900">
            Your Booking Requests
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Track your submitted pitch bookings.
          </p>
        </div>

        {/* =========================
            BOOKING CARDS
        ========================== */}

        <div className="space-y-5">

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-4 text-sm text-red-800"
            >
              Could not load bookings: {error}
            </p>
          )}

          {loading && bookings.length === 0 && (
            <p role="status" className="text-sm text-gray-500">
              Loading bookings...
            </p>
          )}

          {bookings.map((booking) => {
            const effectiveStatus = getEffectiveStatus(booking, lagosNow);

            return (
              <article
                key={booking.id}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >

                {/* TOP SECTION */}

                <div className="flex flex-col justify-between gap-4 border-b border-gray-100 pb-5 md:flex-row md:items-start">

                  <div>

                    <div className="flex items-center gap-3">

                      <h3 className="text-xl font-bold text-gray-900">
                        {booking.pitchName}
                      </h3>

                      <span
                        className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${getStatusStyles(
                          effectiveStatus
                        )}`}
                      >
                        {getStatusIcon(effectiveStatus)}
                        {effectiveStatus}
                      </span>

                    </div>

                    <p className="mt-1 text-sm text-gray-500">
                      {booking.pitchType}
                    </p>

                  </div>

                <span className="text-xs font-semibold text-gray-400">
                  Booking ID: {booking.id}
                </span>

              </div>

              {/* BOOKING INFORMATION */}

              <div className="grid gap-5 py-5 sm:grid-cols-2 lg:grid-cols-4">

                {/* DATE */}

                <div className="flex gap-3">

                  <Calendar
                    size={20}
                    className="flex-shrink-0 text-green-600"
                  />

                  <div>
                    <p className="text-xs text-gray-500">
                      Date
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-800">
                      {new Date(`${booking.bookingDate}T00:00:00`).toLocaleDateString()}
                    </p>
                  </div>

                </div>

                {/* TIME */}

                <div className="flex gap-3">

                  <Clock
                    size={20}
                    className="flex-shrink-0 text-green-600"
                  />

                  <div>
                    <p className="text-xs text-gray-500">
                      Time
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-800">
                      {booking.startTime} - {booking.endTime}
                    </p>
                  </div>

                </div>

                {/* EVENT */}

                <div className="flex gap-3">

                  <Users
                    size={20}
                    className="flex-shrink-0 text-green-600"
                  />

                  <div>
                    <p className="text-xs text-gray-500">
                      Event / Team
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-800">
                      {booking.eventDescription}
                    </p>
                  </div>

                </div>

                {/* CONTACT */}

                <div className="flex gap-3">

                  <UserRound
                    size={20}
                    className="flex-shrink-0 text-green-600"
                  />

                  <div>
                    <p className="text-xs text-gray-500">
                      Contact
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-800">
                      {booking.userName}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">{booking.userEmail}</p>
                  </div>

                </div>

              </div>

              {/* BOTTOM */}

              <div className="flex flex-col justify-between gap-4 border-t border-gray-100 pt-4 sm:flex-row sm:items-center">

                <div>
                  <p className="mb-2 text-xs text-gray-500">
                    Submitted {new Date(booking.submittedAt).toLocaleString()}
                  </p>

                  {effectiveStatus === "Approved" && (
                    <p className="text-xs font-medium text-green-600">
                      Your booking has been approved by the Franco Committee.
                    </p>
                  )}

                  {effectiveStatus === "Completed" && (
                    <p className="text-xs font-medium text-blue-600">
                      This booking has concluded.
                    </p>
                  )}

                  {effectiveStatus === "Pending" && (
                    <p className="text-xs font-medium text-orange-600">
                      Your booking is waiting for committee approval.
                    </p>
                  )}

                  {effectiveStatus === "Expired" && (
                    <p className="text-xs font-medium text-slate-500">
                      This booking request was not reviewed before its scheduled time and has expired.
                    </p>
                  )}

                  {effectiveStatus === "Rejected" && (
                    <p className="text-xs font-medium text-red-600">
                      This booking request was rejected.
                    </p>
                  )}

                  {effectiveStatus === "Cancelled" && (
                    <p className="text-xs font-medium text-gray-500">
                      This booking was cancelled.
                    </p>
                  )}

                </div>

                <button
                  className="flex items-center justify-center gap-2 rounded-lg border-2 border-green-600 px-5 py-2 text-sm font-bold text-green-600 transition hover:bg-green-50"
                  onClick={() =>
                    alert(
                      `Booking ID: ${booking.id}\n${booking.pitchName}\n${booking.bookingDate}\n${booking.startTime} - ${booking.endTime}\nStatus: ${effectiveStatus}`
                    )
                  }
                >
                  View Details
                  <ChevronRight size={17} />
                </button>

              </div>

            </article>
          );
        })}

        </div>

        {/* =========================
            NO BOOKINGS
        ========================== */}

        {!loading && !error && bookings.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">

            <Calendar
              size={45}
              className="mx-auto mb-4 text-gray-300"
            />

            <h3 className="text-lg font-bold text-gray-700">
              No bookings yet
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              You have not submitted any pitch booking requests.
            </p>

            <Link
              to="/book"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-500"
            >
              Book a Pitch
              <ChevronRight size={17} />
            </Link>

          </div>
        )}

        {/* =========================
            BOOK NEW PITCH
        ========================== */}

        <div className="mt-8 rounded-xl bg-green-700 p-6 text-white">

          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

            <div>
              <h3 className="text-xl font-bold">
                Need another pitch?
              </h3>

              <p className="mt-1 text-sm text-green-100">
                Submit another booking request for your next match or event.
              </p>
            </div>

            <Link
              to="/book"
              className="flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-bold text-green-700 transition hover:bg-green-50"
            >
              Book a Pitch
              <ChevronRight size={17} />
            </Link>

          </div>

        </div>

      </main>

      {/* =========================
          FOOTER
      ========================== */}

      <footer className="bg-green-950 px-6 py-7">

        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-3 md:flex-row">

          <div>
            <h3 className="font-bold text-white">
              Franco Pitch Booking
            </h3>

            <p className="text-xs text-green-400">
              Book • Play • Enjoy.
            </p>
          </div>

          <div className="text-center md:text-right">
            <p className="text-xs text-gray-400">
              © 2026 Franco Pitch Booking System. All rights reserved.
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Designed &amp; Developed by Chinedu Gabriel Ebubechukwu
            </p>
          </div>

        </div>

      </footer>

    </div>
  );
}