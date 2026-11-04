import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { getLagosDateTime, hasSlotEnded } from "../lib/lagosTime";

export function findAvailabilityConflict(
  availability,
  { pitchId, bookingDate, startTime, endTime },
) {
  if (!pitchId || !bookingDate || !startTime || !endTime) return null;
  const lagosNow = getLagosDateTime();

  return availability.find((slot) => {
    if (slot.pitch_id !== pitchId || slot.booking_date !== bookingDate) {
      return false;
    }

    // Ignore slots whose end time has already passed in Africa/Lagos
    if (hasSlotEnded(slot.booking_date, slot.end_time, lagosNow)) {
      return false;
    }

    // If slot has a status, ignore rejected or cancelled slots
    const status = (slot.status || "").toLowerCase();
    if (status === "rejected" || status === "cancelled") {
      return false;
    }

    return (
      startTime.slice(0, 5) < slot.end_time.slice(0, 5) &&
      endTime.slice(0, 5) > slot.start_time.slice(0, 5)
    );
  });
}

export function useAvailability() {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestId = useRef(0);
  const authGeneration = useRef(0);
  const mounted = useRef(false);
  const authenticated = useRef(false);
  const authEventReceived = useRef(false);
  const inFlightRequest = useRef(null);

  const refreshAvailability = useCallback(async () => {
    if (!authenticated.current) return false;
    if (inFlightRequest.current?.generation === authGeneration.current) {
      return inFlightRequest.current.promise;
    }

    const currentRequestId = ++requestId.current;
    const currentAuthGeneration = authGeneration.current;
    if (mounted.current) {
      setLoading(true);
      setError("");
    }

    const request = (async () => {
      try {
        const { data, error: fetchError } = await supabase.rpc(
          "get_booking_availability",
        );
        if (fetchError) throw fetchError;
        if (!Array.isArray(data)) {
          throw new Error("Availability response was not a list.");
        }

        if (
          mounted.current &&
          currentRequestId === requestId.current &&
          currentAuthGeneration === authGeneration.current
        ) {
          const lagosNow = getLagosDateTime();
          const activeSlots = data.filter(
            (slot) => !hasSlotEnded(slot.booking_date, slot.end_time, lagosNow),
          );
          setAvailability(activeSlots);
          setError("");
        }
        return true;
      } catch (fetchError) {
        if (
          mounted.current &&
          currentRequestId === requestId.current &&
          currentAuthGeneration === authGeneration.current
        ) {
          setError(fetchError.message);
        }
        return false;
      } finally {
        if (
          mounted.current &&
          currentRequestId === requestId.current &&
          currentAuthGeneration === authGeneration.current
        ) {
          setLoading(false);
        }
      }
    })();

    const requestEntry = {
      generation: currentAuthGeneration,
      promise: request,
    };
    inFlightRequest.current = requestEntry;
    try {
      return await request;
    } finally {
      if (inFlightRequest.current === requestEntry) {
        inFlightRequest.current = null;
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    authEventReceived.current = false;

    const clearAvailability = () => {
      authenticated.current = false;
      authGeneration.current += 1;
      requestId.current += 1;
      inFlightRequest.current = null;
      setAvailability([]);
      setError("");
      setLoading(false);
    };

    const applySession = (session) => {
      authenticated.current = Boolean(session);
      if (authenticated.current) {
        void Promise.resolve().then(refreshAvailability);
      } else {
        clearAvailability();
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") {
        if (!authEventReceived.current) {
          authEventReceived.current = true;
          applySession(session);
        }
        return;
      }

      authEventReceived.current = true;
      if (event === "SIGNED_OUT") {
        clearAvailability();
        return;
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (event === "SIGNED_IN") {
          authGeneration.current += 1;
          requestId.current += 1;
          inFlightRequest.current = null;
        }
        applySession(session);
      }
    });

    let active = true;
    supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
      if (!active || authEventReceived.current) return;

      authEventReceived.current = true;
      if (sessionError) {
        authenticated.current = false;
        setAvailability([]);
        setError(sessionError.message);
        setLoading(false);
        return;
      }

      applySession(session);
    }).catch((sessionError) => {
      if (!active || authEventReceived.current) return;
      authEventReceived.current = true;
      authenticated.current = false;
      setAvailability([]);
      setError(sessionError.message);
      setLoading(false);
    });

    const refreshIfVisible = () => {
      if (
        authenticated.current &&
        document.visibilityState === "visible"
      ) {
        void refreshAvailability();
      }
    };
    const intervalId = window.setInterval(refreshIfVisible, 30_000);
    document.addEventListener("visibilitychange", refreshIfVisible);

    // Realtime subscription for immediate availability updates on booking changes
    const realtimeChannel = supabase
      .channel("public:bookings:useAvailability")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
        },
        () => {
          void refreshAvailability();
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.warn(
            "Supabase Realtime channel error on availability. Falling back to polling.",
          );
        }
      });

    return () => {
      active = false;
      mounted.current = false;
      authenticated.current = false;
      requestId.current += 1;
      inFlightRequest.current = null;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshIfVisible);
      subscription.unsubscribe();
      void supabase.removeChannel(realtimeChannel);
    };
  }, [refreshAvailability]);

  return { availability, loading, error, refreshAvailability };
}
