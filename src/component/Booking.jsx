import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";

import topBackground from "../assets/top-background.jpg";
import Navbar from "./Navbar";
import { useBookings } from "../hooks/useBookings";
import { usePitches } from "../hooks/usePitches";
import { useAvailability } from "../hooks/useAvailability";
import { getLagosDateTime, hasSlotEnded } from "../lib/lagosTime";

import {
  Clock,
  Search,
  LandPlot,
  Calendar,
  ShieldCheck,
  ChevronRight,
  Users,
  Info,
} from "lucide-react";

export default function Booking() {
  const { hash } = useLocation();
  const { bookings, nowTick } = useBookings();
  const {
    pitches: activePitches,
    loading: pitchesLoading,
    error: pitchesError,
  } = usePitches();
  const {
    availability,
    loading: availabilityLoading,
    error: availabilityError,
  } = useAvailability();
  // Evaluated on every render and refreshed automatically via nowTick & Realtime
  const lagosNow = getLagosDateTime(new Date(nowTick));
  const upcomingBookings = bookings
    .filter(
      (booking) =>
        booking.status === "Approved" &&
        !hasSlotEnded(booking.bookingDate, booking.endTime, lagosNow),
    )
    .sort((first, second) =>
      `${first.bookingDate}${first.startTime}`.localeCompare(
        `${second.bookingDate}${second.startTime}`,
      ),
    );

  useEffect(() => {
    const sectionId = hash.slice(1);
    if (!sectionId) return;

    requestAnimationFrame(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
    });
  }, [hash]);

  const pitches = activePitches.map((pitch) => {
    const nextOccupiedSlot = availability
      .filter(
        (slot) =>
          slot.pitch_id === pitch.uuid &&
          !hasSlotEnded(slot.booking_date, slot.end_time, lagosNow),
      )
      .sort((first, second) =>
        `${first.booking_date}${first.start_time}`.localeCompare(
          `${second.booking_date}${second.start_time}`,
        ),
      )[0];

    return {
      ...pitch,
      status: availabilityLoading
        ? "Checking availability"
        : availabilityError
          ? "Availability unavailable"
          : nextOccupiedSlot
            ? "Booked"
            : "Available",
      time: availabilityError
        ? "Unable to check availability"
        : nextOccupiedSlot
          ? `Occupied: ${nextOccupiedSlot.booking_date}, ${nextOccupiedSlot.start_time.slice(0, 5)} - ${nextOccupiedSlot.end_time.slice(0, 5)}`
          : "Available for a booking request",
    };
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Pitches");

  const filteredPitches = pitches.filter((pitch) => {
    const matchesSearch =
      pitch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pitch.type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "All Pitches" || pitch.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusStyles = (status) => {
    if (status === "Available") {
      return "bg-green-500 text-white";
    }

    if (status === "Availability unavailable") {
      return "bg-gray-500 text-white";
    }

    return "bg-orange-500 text-white";
  };

  const getTimeColor = (status) => {
    if (status === "Available") {
      return "text-green-600";
    }

    if (status === "Availability unavailable") {
      return "text-gray-600";
    }

    return "text-orange-500";
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-900">
      <Navbar />

      <section
        className="relative min-h-[380px] bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: ` url(${topBackground})`,
        }}
      >
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-10 px-8 py-20">
          {/* HERO TEXT */}
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-bold uppercase tracking-wide text-green-400 sm:text-base">
              Welcome to Franco Pitch Booking System
            </p>

            <h2 className="text-4xl font-black leading-tight text-white sm:text-6xl">
              Your Game, Our <span className="text-green-400">Pitch</span>
            </h2>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-gray-200 sm:text-lg my-[20px] ">
              Easily book football pitches for your matches, events and training
              sessions. Fast. Simple. Convenient.
            </p>

            <Link
              to="/book"
              className="bg-green-500 text-white font-bold text-[15px]  px-[28px] py-[14px] gap-3 max  hover:bg-green-400 rounded-lg items-center   shadow-lg shadow-green-900/40 transform transition-all hover:translate-x-1 "
            >
              Book a Pitch <span className="text-lg">→</span>
            </Link>
          </div>

          {/* HERO INFORMATION CARD */}
          <div className="hidden w-[340px] rounded-2xl border border-white/10 bg-green-950/75 p-6 shadow-xl backdrop-blur-md lg:block">
            {/* ITEM 1 */}
            <div className="flex gap-4">
              <div className="rounded-lg bg-green-500/20 p-3">
                <LandPlot size={28} className="text-green-400" />
              </div>

              <div>
                <h3 className="font-bold text-white">8+ Pitches Available</h3>

                <p className="mt-1 text-xs text-gray-300">
                  Various sizes & surfaces for your game.
                </p>
              </div>
            </div>

            {/* ITEM 2 */}
            <div className="mt-5 flex gap-4 border-t border-white/10 pt-5">
              <div className="rounded-lg bg-green-500/20 p-3">
                <Clock size={28} className="text-green-400" />
              </div>

              <div>
                <h3 className="font-bold text-white">Easy Booking</h3>

                <p className="mt-1 text-xs text-gray-300">
                  Book your preferred time in a few clicks.
                </p>
              </div>
            </div>

            {/* ITEM 3 */}
            <div className="mt-5 flex gap-4 border-t border-white/10 pt-5">
              <div className="rounded-lg bg-green-500/20 p-3">
                <ShieldCheck size={28} className="text-green-400" />
              </div>

              <div>
                <h3 className="font-bold text-white">Secure & Reliable</h3>

                <p className="mt-1 text-xs text-gray-300">
                  Designed for students, teams and events.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1500px] px-6 py-10">
        <div className="grid gap-8 xl:grid-cols-[1fr_330px]">
          <section>
            {/* TITLE + SEARCH */}
            <div className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <h2 className="text-3xl font-extrabold">Available Pitches</h2>

                <p className="mt-1 text-sm text-gray-500">
                  Check out our pitches and their current availability.
                </p>
              </div>

              {/* SEARCH + FILTER */}
              <div className="flex flex-col gap-3 sm:flex-row">
                {/* SEARCH */}
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="search"
                    placeholder="Search pitch..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-green-500 sm:w-[220px]"
                  />
                </div>

                {/* FILTER */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium outline-none focus:border-green-500"
                >
                  <option>All Pitches</option>

                  <option>Available</option>

                  <option>Booked</option>
                </select>
              </div>
            </div>

            {/* STATUS LEGEND */}
            <div className="mb-6 flex flex-wrap items-center gap-5 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-green-500"></span>
                <span>Available</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-orange-400"></span>
                <span>Booked</span>
              </div>
            </div>

            {/* PITCH GRID */}
            {pitchesError && (
              <p
                role="alert"
                className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-800"
              >
                Could not load pitches: {pitchesError}
              </p>
            )}
            {availabilityError && (
              <p
                role="alert"
                className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-800"
              >
                Could not load booking availability: {availabilityError}
              </p>
            )}

            <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-4">
              {filteredPitches.map((pitch) => (
                <article
                  key={pitch.id}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  {/* PITCH IMAGE */}
                  <div
                    className="relative h-40 bg-cover bg-center"
                    style={{
                      backgroundImage: `linear-gradient(
                        rgba(0, 60, 40, 0.15),
                        rgba(0, 40, 25, 0.35)
                      ), url(${topBackground})`,
                    }}
                  >
                    {/* STATUS */}
                    <span
                      className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold ${getStatusStyles(
                        pitch.status,
                      )}`}
                    >
                      {pitch.status}
                    </span>
                  </div>

                  {/* CARD CONTENT */}
                  <div className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-lg font-extrabold">{pitch.name}</h3>

                      <span className="text-xs font-bold text-gray-400">
                        {pitch.id}
                      </span>
                    </div>

                    {/* TYPE */}
                    <div className="mb-3 flex items-center gap-2 text-xs text-gray-500">
                      <LandPlot size={15} className="text-green-600" />

                      <span>{pitch.type}</span>

                      <span>•</span>

                      <span>{pitch.size}</span>
                    </div>

                    {/* TIME */}
                    <div
                      className={`mb-4 flex items-start gap-2 text-xs font-bold ${getTimeColor(
                        pitch.status,
                      )}`}
                    >
                      <Clock size={16} className="mt-0.5 flex-shrink-0" />

                      <div>
                        <p>{pitch.time}</p>

                        {pitch.event && (
                          <p className="mt-1 font-normal text-gray-400">
                            ({pitch.event})
                          </p>
                        )}
                      </div>
                    </div>

                    {/* BUTTON */}
                    <Link
                      to={`/book?pitch=${pitch.id}`}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 py-2.5 text-sm font-bold text-white transition hover:bg-green-500"
                    >
                      Choose a Time
                      <ChevronRight size={17} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {/* NO RESULTS */}
            {filteredPitches.length === 0 && (
              <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
                <Search size={40} className="mx-auto mb-3 text-gray-300" />

                <h3 className="font-bold text-gray-700">
                  {pitchesLoading ? "Loading pitches..." : "No pitches found"}
                </h3>

                <p className="mt-1 text-sm text-gray-400">
                  Try changing your search or filter.
                </p>
              </div>
            )}
          </section>

          {/* =================================================
              RIGHT SIDEBAR
          ================================================== */}

          <aside className="space-y-6">
            {/* PITCH STATUS */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-5 flex items-center gap-2 text-lg font-bold">
                <Info size={20} className="text-green-600" />
                Pitch Status
              </h3>

              {/* AVAILABLE */}
              <div className="mb-5 flex gap-3">
                <span className="mt-1 h-3 w-3 flex-shrink-0 rounded-full bg-green-500"></span>

                <div>
                  <h4 className="font-bold text-gray-800">Available</h4>

                  <p className="text-xs text-gray-500">
                    You can book this pitch
                  </p>
                </div>
              </div>

              {/* SCHEDULED */}
              <div className="mb-5 flex gap-3">
                <span className="mt-1 h-3 w-3 flex-shrink-0 rounded-full bg-orange-400"></span>

                <div>
                  <h4 className="font-bold text-gray-800">Booked</h4>

                  <p className="text-xs text-gray-500">Pending or approved time on this pitch</p>
                </div>
              </div>
            </div>

            {/* UPCOMING EVENTS */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-lg font-bold">
                  <Calendar size={20} className="text-green-600" />
                  Upcoming Events
                </h3>

                <button className="text-xs font-bold text-green-600 hover:text-green-700">
                  View All
                </button>
              </div>

              {upcomingBookings.slice(0, 3).map((booking) => (
                  <div
                    key={booking.id}
                    className="mb-4 flex gap-3 border-b border-gray-100 pb-4 last:mb-0 last:border-0 last:pb-0"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-green-100">
                      <Users size={20} className="text-green-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">{booking.eventDescription}</h4>
                      <p className="mt-1 text-xs text-gray-500">
                        {booking.pitchName} • {booking.startTime} - {booking.endTime}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-green-600">
                        {new Date(`${booking.bookingDate}T00:00:00`).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}

              {bookings.every((booking) => booking.status !== "Approved") && (
                <p className="text-sm text-gray-500">No approved bookings yet.</p>
              )}
            </div>

            {/* CALL TO ACTION */}
            <div className="overflow-hidden rounded-xl bg-green-700 p-6 text-white shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                <Calendar size={22} />
              </div>

              <h3 className="text-lg font-bold">
                Organising a Match or Event?
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-green-100">
                Book your preferred pitch now and make it happen.
              </p>

              <Link
                to="/book"
                className="mt-5 flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-green-700 transition hover:bg-green-50"
              >
                Book a Pitch
                <ChevronRight size={17} />
              </Link>
            </div>
          </aside>
        </div>
      </main>

      {/* FOOTER*/}

      <section id="contact" className="scroll-mt-6 bg-gray-100 px-6 py-12">
        <div className="mx-auto flex max-w-[1200px] flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-bold uppercase text-green-700">Contact</p>
            <h2 className="mt-2 text-2xl font-extrabold text-gray-900">Questions about a pitch?</h2>
            <p className="mt-2 text-gray-600">Get in touch with the Franco Pitch Booking team.</p>
          </div>
          <Link to="/book" className="font-semibold text-green-700 hover:underline">
            Go to the booking form
          </Link>
        </div>
      </section>

      <footer className="bg-green-950 px-6 py-8 text-white">
        <div className="mx-auto flex max-w-[1500px] flex-col justify-between gap-6 md:flex-row md:items-center">
          {/* LOGO */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500">
              <LandPlot size={23} />
            </div>

            <div>
              <h3 className="font-bold">Franco Pitch Booking</h3>

              <p className="text-xs text-green-400">Book • Play • Enjoy.</p>
            </div>
          </div>

          {/* COPYRIGHT */}
          <div className="text-center md:text-left">
            <p className="text-xs text-gray-400">
              © 2026 Franco Pitch Booking System. All rights reserved.
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Designed &amp; Developed by Chinedu Gabriel Ebubechukwu
            </p>
          </div>

          {/* FOOTER LINKS */}
          <div className="flex gap-5 text-xs text-gray-400">
            <a to="#" className="hover:text-white">
              Privacy Policy
            </a>

            <a to="#" className="hover:text-white">
              Terms of Use
            </a>

            <Link to="/#contact" className="hover:text-white">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
