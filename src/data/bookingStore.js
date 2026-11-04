export const PITCHES = [
  {
    id: "A",
    name: "Pitch A",
    type: "Main Pitch",
    size: "Large size",
    time: "Next available: Today, 3:00 PM",
  },
  {
    id: "B",
    name: "Pitch B",
    type: "Standard Pitch",
    size: "Medium size",
    time: "Next available: Today, 4:00 PM",
  },
  {
    id: "C",
    name: "Pitch C",
    type: "Turf Pitch",
    size: "Medium size",
    time: "Available for a booking request",
  },
  {
    id: "D",
    name: "Pitch D",
    type: "Futsal Court",
    size: "Small size",
    time: "Next available: Today, 5:00 PM",
  },
  {
    id: "E",
    name: "Pitch E",
    type: "Multipurpose Court",
    size: "Medium size",
    time: "Available for a booking request",
  },
  {
    id: "F",
    name: "Pitch F",
    type: "Training Ground",
    size: "Large size",
    time: "Next available: Today, 6:00 PM",
  },
  {
    id: "G",
    name: "Pitch G",
    type: "Standard Pitch",
    size: "Medium size",
    time: "Available for a booking request",
  },
  {
    id: "H",
    name: "Pitch H",
    type: "Turf Pitch",
    size: "Medium size",
    time: "Next available: Today, 7:00 PM",
  },
];

const STORAGE_KEY = "franco-pitch-bookings-v1";
const CHANGE_EVENT = "franco-pitch-bookings-change";

export function readBookings() {
  try {
    const storedBookings = window.localStorage.getItem(STORAGE_KEY);
    const bookings = storedBookings ? JSON.parse(storedBookings) : [];
    return Array.isArray(bookings) ? bookings : [];
  } catch {
    return [];
  }
}

function saveBookings(bookings) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeToBookings(listener) {
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", listener);

  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

export function findApprovedConflict(bookings, booking, excludedId = null) {
  return bookings.find((existing) => {
    if (
      existing.id === excludedId ||
      existing.status !== "Approved" ||
      existing.pitchId !== booking.pitchId ||
      existing.bookingDate !== booking.bookingDate
    ) {
      return false;
    }

    return booking.startTime < existing.endTime && booking.endTime > existing.startTime;
  });
}

export function createBooking(details) {
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? `BK-${crypto.randomUUID()}`
      : `BK-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const booking = {
    id,
    userName: details.userName.trim(),
    userEmail: details.userEmail.trim(),
    pitchId: details.pitchId,
    pitchName: details.pitchName,
    pitchType: details.pitchType,
    eventDescription: details.eventDescription.trim(),
    bookingDate: details.bookingDate,
    startTime: details.startTime,
    endTime: details.endTime,
    submittedAt: new Date().toISOString(),
    status: "Pending",
  };

  saveBookings([...readBookings(), booking]);
  return booking;
}

export function updateBookingStatus(id, status) {
  if (status !== "Approved" && status !== "Rejected") {
    throw new Error("Booking status must be Approved or Rejected.");
  }

  const bookings = readBookings();
  const booking = bookings.find((item) => item.id === id);
  if (!booking) throw new Error("This booking request could not be found.");

  if (status === "Approved") {
    const conflict = findApprovedConflict(bookings, booking, id);
    if (conflict) {
      throw new Error(
        `${booking.pitchName} already has an approved booking from ${conflict.startTime} to ${conflict.endTime} on this date.`,
      );
    }
  }

  const updatedBooking = { ...booking, status };
  saveBookings(bookings.map((item) => (item.id === id ? updatedBooking : item)));
  return updatedBooking;
}