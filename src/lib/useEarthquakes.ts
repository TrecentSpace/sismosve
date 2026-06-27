import { useCallback, useEffect, useRef, useState } from "react";
import { fetchVenezuelaQuakes, type Quake } from "./usgs";

const POLL_MS = 60_000; // refetch a USGS cada 60s
const TICK_MS = 15_000; // re-evaluar la regla de 1 hora cada 15s
const ACTIVE_WINDOW_MS = 60 * 60 * 1000; // 1 hora

// Etiqueta legible de la ventana de actividad (para la UI).
export const ACTIVE_WINDOW_LABEL = "1 hora";

export type FeedStatus = "loading" | "ok" | "error";

export type Feed = {
  quakes: Quake[]; // todos (ventana histórica), ordenados reciente -> antiguo
  status: FeedStatus;
  lastUpdated: number | null;
  newIds: Set<string>; // ids llegados en el último poll (para el ticker)
  refresh: () => void;
};

// Un sismo está "activo" (se dibuja en el mapa) si ocurrió hace menos de 30 min.
export function isActive(q: Quake, now: number): boolean {
  return now - q.time < ACTIVE_WINDOW_MS;
}

export function useEarthquakes(): Feed {
  const [quakes, setQuakes] = useState<Quake[]>([]);
  const [status, setStatus] = useState<FeedStatus>("loading");
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  // Tick para forzar re-render y que los sismos "expiren" a las 2h.
  const [, setTick] = useState(0);
  const knownIds = useRef<Set<string>>(new Set());

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await fetchVenezuelaQuakes(undefined, signal);
      const sorted = [...data].sort((a, b) => b.time - a.time);
      const fresh = new Set<string>();
      if (knownIds.current.size > 0) {
        for (const q of sorted) {
          if (!knownIds.current.has(q.id)) fresh.add(q.id);
        }
      }
      knownIds.current = new Set(sorted.map((q) => q.id));
      setQuakes(sorted);
      setNewIds(fresh);
      setStatus("ok");
      setLastUpdated(Date.now());
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      setStatus((prev) => (prev === "ok" ? "ok" : "error"));
    }
  }, []);

  const refresh = useCallback(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const ctrl = new AbortController();
    void load(ctrl.signal);
    const poll = setInterval(() => void load(), POLL_MS);
    const tick = setInterval(() => setTick((t) => t + 1), TICK_MS);
    return () => {
      ctrl.abort();
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [load]);

  return { quakes, status, lastUpdated, newIds, refresh };
}
