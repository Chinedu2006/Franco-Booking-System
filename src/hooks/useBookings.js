import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
// test
async function fetchBookings() {
  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id,
      user_id,
      pitch_id,
      contact_name,
      event_description,
      booking_date,
      start_time,
      end_time,
      submitted_at,
      status,
      pitches (
        code,
        name,
        pitch_type,
        size_label
      ),
      profiles (
        email
      )
    `)
    .order("submitted_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((item) => ({
    id: item.id,
    userId: item.user_id,
    pitchId: item.pitches?.code ?? "",
    pitchUuid: item.pitch_id,
    pitchName: item.pitches?.name ?? "Unknown pitch",
    pitchType: item.pitches
      ? `${item.pitches.pitch_type} • ${item.pitches.size_label}`
      : "",
    userName: item.contact_name,
    userEmail: item.profiles?.email ?? "",
    eventDescription: item.event_description,
    bookingDate: item.booking_date,
    startTime: item.start_time,
    endTime: item.end_time,
    submittedAt: item.submitted_at,
    status: item.status.charAt(0).toUpperCase() + item.status.slice(1),
  }));
}

export function useBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nowTick, setNowTick] = useState(() => Date.now());
  const isMounted = useRef(true);

  const refreshBookings = useCallback(async ({ silent = false } = {}) => {
    if (!silent && isMounted.current) {
      setLoading(true);
      setError("");
    }

    try {
      const data = await fetchBookings();
      if (isMounted.current) {
        setBookings(data);
        setError("");
      }
    } catch (fetchError) {
      if (isMounted.current) {
        if (!silent) {
          setBookings([]);
          setError(fetchError.message);
        } else {
          console.warn("Background bookings refresh error:", fetchError.message);
        }
      }
    } finally {
      if (!silent && isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;

    // 1. Initial load (async callback, avoiding synchronous setState in effect body)
    fetchBookings()
      .then((data) => {
        if (active) {
          setBookings(data);
          setError("");
        }
      })
      .catch((fetchError) => {
        if (active) {
          setBookings([]);
          setError(fetchError.message);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    // 2. Realtime subscription to the bookings table
    const channel = supabase
      .channel("public:bookings:useBookings")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
        },
        () => {
          if (active) {
            void refreshBookings({ silent: true });
          }
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.warn(
            "Supabase Realtime channel error on bookings. Falling back to polling.",
          );
        }
      });

    // 3. Fallback polling every 30 seconds when visible
    const pollInterval = window.setInterval(() => {
      if (document.visibilityState === "visible" && active) {
        void refreshBookings({ silent: true });
      }
    }, 30_000);

    // 4. Wall-clock tick every 30 seconds for automatic time-based status updates
    const tickInterval = window.setInterval(() => {
      if (active) {
        setNowTick(Date.now());
      }
    }, 30_000);

    // 5. Visibility change refresh
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && active) {
        void refreshBookings({ silent: true });
        setNowTick(Date.now());
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      active = false;
      window.clearInterval(pollInterval);
      window.clearInterval(tickInterval);
      document.removeEventListener("visibilitychange", handleVisibility);
      void supabase.removeChannel(channel);
    };
  }, [refreshBookings]);

  return {
    bookings: Array.isArray(bookings) ? bookings : [],
    loading,
    error,
    refreshBookings,
    nowTick,
  };
}
