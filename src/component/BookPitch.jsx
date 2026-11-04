import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import topBackground from "../assets/top-background.jpg";

import {
  Calendar,
  Clock,
  UserRound,
  Users,
} from "lucide-react";
import Navbar from "./Navbar";
import { usePitches } from "../hooks/usePitches";
import {
  findAvailabilityConflict,
  useAvailability,
} from "../hooks/useAvailability";
import { getLagosDateTime } from "../lib/lagosTime";
import { supabase } from "../lib/supabase";

export default function BookPitch() {
  const [searchParams] = useSearchParams();
  const [selectedPitch, setSelectedPitch] = useState(searchParams.get("pitch") ?? "");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [eventName, setEventName] = useState("");
  const [contactName, setContactName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const {
    pitches,
    loading: pitchesLoading,
    error: pitchesError,
  } = usePitches();
  const {
    availability,
    loading: availabilityLoading,
    error: availabilityError,
    refreshAvailability,
  } = useAvailability();
  const lagosNow = getLagosDateTime();
  const today = lagosNow.date;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    const pitch = pitches.find((item) => item.id === selectedPitch);
    if (!pitch) {
      setMessage({ type: "error", text: "Choose a pitch before submitting." });
      return;
    }

    if (!contactName.trim() || !userEmail.trim() || !eventName.trim()) {
      setMessage({
        type: "error",
        text: "Enter your name, a valid email address, and an event or match description.",
      });
      return;
    }

    const currentLagos = getLagosDateTime();
    if (date < currentLagos.date) {
      setMessage({ type: "error", text: "Choose today or a future date." });
      return;
    }

    if (date === currentLagos.date && startTime <= currentLagos.time) {
      setMessage({
        type: "error",
        text: "Choose a start time in the future.",
      });
      return;
    }

    if (endTime <= startTime) {
      setMessage({ type: "error", text: "End time must be later than start time." });
      return;
    }

    if (availabilityLoading) {
      setMessage({
        type: "error",
        text: "Availability is still loading. Please try again shortly.",
      });
      return;
    }

    const details = {
      pitchId: pitch.uuid,
      bookingDate: date,
      startTime,
      endTime,
    };
    const conflict = availabilityError
      ? null
      : findAvailabilityConflict(availability, details);
    if (conflict) {
      setMessage({
        type: "error",
        text: `This pitch is occupied from ${conflict.start_time.slice(0, 5)} to ${conflict.end_time.slice(0, 5)}. Choose another time.`,
      });
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) {
        setMessage({
          type: "error",
          text: "Sign in before submitting a booking request.",
        });
        return;
      }

      if (user.email?.trim().toLowerCase() !== userEmail.trim().toLowerCase()) {
        setMessage({
          type: "error",
          text: "Use the email address associated with your signed-in account.",
        });
        return;
      }

      const { data: pitchRecord, error: pitchError } = await supabase
        .from("pitches")
        .select("id")
        .eq("code", pitch.id)
        .single();
      if (pitchError) throw pitchError;

      const { error: insertError } = await supabase.from("bookings").insert({
      
        pitch_id: pitchRecord.id,
        contact_name: contactName.trim(),
        event_description: eventName.trim(),
        booking_date: date,
        start_time: startTime,
        end_time: endTime,
      });
      if (insertError) throw insertError;

      const availabilityRefreshed = await refreshAvailability();
      setMessage({
        type: "success",
        text: availabilityRefreshed
          ? "Your booking request was saved and is pending review."
          : "Your booking request was saved, but availability could not be refreshed. Please refresh the page.",
      });
      setSelectedPitch("");
      setDate("");
      setStartTime("");
      setEndTime("");
      setEventName("");
      setContactName("");
      setUserEmail("");
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? `The booking request could not be saved: ${error.message}`
            : "The booking request could not be saved. Check your connection and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/*HERO*/}

      <section
        className="relative bg-cover bg-center"
        style={{
          backgroundImage: ` url(${topBackground})`,
        }}
      >
        <div className="mx-auto max-w-[1500px] px-8 py-16">
          <Link
  to="/"
  className="mb-2 text-sm font-bold text-green-400"
>
  ← Back to Home
</Link>

          <h2 className="text-4xl font-black my-[10px] text-white md:text-5xl">
            Book a Pitch
          </h2>

          <p className="mt-3 text-white">
            Fill in the details below to book your preferred pitch, date and
            time.
          </p>
        </div>
      </section>

      {/*MAIN CONTENT*/}

      <main className="mx-auto max-w-[1200px] px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
          {/*BOOKING FORM*/}

          <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-2xl font-bold text-gray-900">
              Select Your Pitch
            </h2>

            <p className="mb-6 text-sm text-gray-500">
              Choose an available pitch for your match or event.
            </p>

            {message && (
              <p
                role={message.type === "error" ? "alert" : "status"}
                className={`mb-5 rounded-lg p-3 text-sm ${
                  message.type === "error"
                    ? "bg-red-50 text-red-800"
                    : "bg-green-50 text-green-800"
                }`}
              >
                {message.text}
              </p>
            )}

            {pitchesError && (
              <p
                role="alert"
                className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-800"
              >
                Could not load pitches: {pitchesError}
              </p>
            )}
            {availabilityError && (
              <p
                role="alert"
                className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-800"
              >
                Could not load booking availability: {availabilityError}
              </p>
            )}

            {/* PITCHES */}

            <div className="grid gap-4 sm:grid-cols-2">
              {pitches.map((pitch) => (
                <button
                  key={pitch.id}
                  type="button"
                  onClick={() => setSelectedPitch(pitch.id)}
                  className={`rounded-lg border-2 p-4 text-left transition

                    ${
                      selectedPitch === pitch.id
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 bg-white"
                    }
                    hover:border-green-400
                  `}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">{pitch.name}</h3>

                    <span
                      className={`rounded-full px-2 py-1 text-xs font-bold

                        ${
                          "bg-green-100 text-green-700"
                        }
                      `}
                    >
                      {availabilityLoading
                        ? "Checking availability..."
                        : availabilityError
                          ? "Availability unavailable"
                          : findAvailabilityConflict(availability, {
                        pitchId: pitch.uuid,
                        bookingDate: date,
                        startTime,
                        endTime,
                      })
                        ? "Booked at this time"
                        : "Available for request"}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-gray-500">
                    {pitch.type} • {pitch.size}
                  </p>
                </button>
              ))}
            </div>
            {pitchesLoading && (
              <p role="status" className="mt-4 text-sm text-gray-500">
                Loading pitches...
              </p>
            )}
            {!pitchesLoading && !pitchesError && pitches.length === 0 && (
              <p className="mt-4 text-sm text-gray-500">
                No active pitches are available for booking.
              </p>
            )}

            {/* DATE */}

            <div className="mt-7">
              <label className="mb-2 block text-sm font-bold text-gray-700">
                Date
              </label>

              <div className="relative">
                <Calendar
                  size={19}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600"
                />

                <input
                  type="date"
                  min={today}
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-3 outline-none focus:border-green-500"
                />
              </div>
            </div>

            {/* START TIME */}

            <div className="mt-5">
              <label htmlFor="booking-start-time" className="mb-2 block text-sm font-bold text-gray-700">
                Start Time
              </label>

              <div className="relative">
                <Clock
                  size={19}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600"
                />

                <input
                  type="time"
                  id="booking-start-time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-3 outline-none focus:border-green-500"
                />
              </div>
            </div>

            <div className="mt-5">
              <label htmlFor="booking-end-time" className="mb-2 block text-sm font-bold text-gray-700">
                End Time
              </label>

              <div className="relative">
                <Clock
                  size={19}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600"
                />

                <input
                  type="time"
                  id="booking-end-time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-3 outline-none focus:border-green-500"
                />
              </div>
            </div>

            {/* EVENT NAME */}

            <div className="mt-5">
              <label className="mb-2 block text-sm font-bold text-gray-700">
                Event / Team Name
              </label>

              <div className="relative">
                <Users
                  size={19}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600"
                />

                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Science FC"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 outline-none focus:border-green-500"
                />
              </div>
            </div>

            {/* CONTACT NAME */}

            <div className="mt-5">
              <label className="mb-2 block text-sm font-bold text-gray-700">
                Contact Name
              </label>

              <div className="relative">
                <UserRound
                  size={19}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600"
                />

                <input
                  type="text"
                  required
                  placeholder="Enter your name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 outline-none focus:border-green-500"
                />
              </div>
            </div>

            <div className="mt-5">
              <label htmlFor="booking-email" className="mb-2 block text-sm font-bold text-gray-700">
                Contact Email
              </label>
              <input
                id="booking-email"
                type="email"
                autoComplete="email"
                required
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-500"
              />
            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={submitting}
              className="mt-7 w-full rounded-lg bg-green-600 py-3 font-bold text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit Booking Request"}
            </button>
          </form>

          {/* =========================
              BOOKING SUMMARY
          ========================== */}

          <aside>
            <div className="sticky top-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 flex items-center gap-2 text-xl font-bold">
                <Calendar size={21} className="text-green-600" />
                Booking Summary
              </h2>

              {/* SELECTED PITCH */}

              <div className="mb-5 rounded-lg bg-green-50 p-4">
                <p className="text-xs text-gray-500">Selected Pitch</p>

                <h3 className="mt-1 text-lg font-bold text-green-700">
                  {pitches.find((pitch) => pitch.id === selectedPitch)?.name || "Not selected"}
                </h3>
              </div>

              {/* DATE */}

              <div className="mb-5 flex gap-3">
                <Calendar size={20} className="text-green-600" />

                <div>
                  <p className="text-xs text-gray-500">Date</p>

                  <p className="font-semibold">{date || "Not selected"}</p>
                </div>
              </div>

              {/* TIME */}

              <div className="mb-5 flex gap-3">
                <Clock size={20} className="text-green-600" />

                <div>
                  <p className="text-xs text-gray-500">Time</p>

                  <p className="font-semibold">
                    {startTime && endTime ? `${startTime} - ${endTime}` : "Not selected"}
                  </p>
                </div>
              </div>

              {/* EVENT */}

              <div className="mb-5 flex gap-3">
                <Users size={20} className="text-green-600" />

                <div>
                  <p className="text-xs text-gray-500">Event / Team</p>

                  <p className="font-semibold">
                    {eventName || "Not specified"}
                  </p>
                </div>
              </div>

              {/* CONTACT */}

              <div className="flex gap-3">
                <UserRound size={20} className="text-green-600" />

                <div>
                  <p className="text-xs text-gray-500">Contact Name</p>

                  <p className="font-semibold">
                    {contactName || "Not specified"}
                  </p>
                </div>
              </div>

              {/* INFORMATION */}

              <div className="mt-7 rounded-lg bg-gray-50 p-4">
                <p className="text-xs leading-relaxed text-gray-500">
                  Requests are stored securely in Supabase and start as pending. An administrator can approve or reject them.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* =========================
          FOOTER
      ========================== */}

      <footer className="bg-green-950 px-6 py-7">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-3 md:flex-row">
          <div>
            <h3 className="font-bold text-white">Franco Pitch Booking</h3>

            <p className="text-xs text-green-400">Book • Play • Enjoy.</p>
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
