import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

async function fetchPitches(includeInactive) {
  let query = supabase
    .from("pitches")
    .select("id, code, name, pitch_type, size_label, is_active")
    .order("code");

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((pitch) => ({
    id: pitch.code,
    uuid: pitch.id,
    name: pitch.name,
    type: pitch.pitch_type,
    size: pitch.size_label,
    isActive: pitch.is_active,
  }));
}

export function usePitches({ includeInactive = false } = {}) {
  const [pitches, setPitches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshPitches = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setPitches(await fetchPitches(includeInactive));
    } catch (fetchError) {
      setPitches([]);
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    let active = true;

    fetchPitches(includeInactive)
      .then((result) => {
        if (active) setPitches(result);
      })
      .catch((fetchError) => {
        if (active) {
          setPitches([]);
          setError(fetchError.message);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [includeInactive]);

  return { pitches, loading, error, refreshPitches };
}
