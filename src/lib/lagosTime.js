/**
 * Africa/Lagos timezone utilities (UTC+1, West Africa Time).
 * Handles authoritative date/time comparisons and dynamic status calculation.
 */

export function getLagosDateTime(dateObj = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(dateObj);
  const get = (type) => parts.find((p) => p.type === type)?.value ?? "";

  const date = `${get("year")}-${get("month")}-${get("day")}`;
  const time = `${get("hour")}:${get("minute")}`;
  const timeWithSeconds = `${get("hour")}:${get("minute")}:${get("second")}`;

  return { date, time, timeWithSeconds, iso: `${date}T${time}` };
}

/**
 * Checks whether a booking slot has ended based on Africa/Lagos time.
 * A slot ending at 15:00 is considered ended at 15:00 sharp.
 */
export function hasSlotEnded(bookingDate, endTime, lagosNow = getLagosDateTime()) {
  if (!bookingDate || !endTime) return false;
  const cleanEndTime = endTime.slice(0, 5);
  const slotEndIso = `${bookingDate}T${cleanEndTime}`;
  const currentLagosIso = `${lagosNow.date}T${lagosNow.time}`;
  return slotEndIso <= currentLagosIso;
}

/**
 * Checks whether a booking slot is currently active (ongoing).
 */
export function isSlotActiveNow(bookingDate, startTime, endTime, lagosNow = getLagosDateTime()) {
  if (!bookingDate || !startTime || !endTime) return false;
  const cleanStart = startTime.slice(0, 5);
  const cleanEnd = endTime.slice(0, 5);
  const currentLagosIso = `${lagosNow.date}T${lagosNow.time}`;
  return (
    currentLagosIso >= `${bookingDate}T${cleanStart}` &&
    currentLagosIso < `${bookingDate}T${cleanEnd}`
  );
}

/**
 * Returns the effective user-facing status of a booking:
 * - Approved & ended -> "Completed"
 * - Pending & ended -> "Expired"
 * - Otherwise returns the canonical status ("Approved", "Pending", "Rejected", "Cancelled")
 */
export function getEffectiveStatus(booking, lagosNow = getLagosDateTime()) {
  if (!booking) return "";
  const rawStatus = (booking.status || "").trim();
  const normalized =
    rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase();

  const bookingDate = booking.bookingDate || booking.booking_date;
  const endTime = booking.endTime || booking.end_time;

  const isEnded = hasSlotEnded(bookingDate, endTime, lagosNow);

  if (normalized === "Approved" && isEnded) {
    return "Completed";
  }

  if (normalized === "Pending" && isEnded) {
    return "Expired";
  }

  return normalized;
}

