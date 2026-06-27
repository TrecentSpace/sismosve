import { useEffect, useRef, useState } from "react";
import type { Quake } from "./usgs";
import { fetchShakeMap, type ShakeMapOverlay } from "./shakemap";

const MIN_MAG_FOR_SHAKEMAP = 5.0;

export function useShakeMaps(quakes: Quake[]): Map<string, ShakeMapOverlay> {
  const [shakemaps, setShakemaps] = useState<Map<string, ShakeMapOverlay>>(
    new Map(),
  );
  const cacheRef = useRef<Map<string, ShakeMapOverlay | null>>(new Map());
  const fetchingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const eligible = quakes.filter((q) => q.mag >= MIN_MAG_FOR_SHAKEMAP);

    for (const q of eligible) {
      if (cacheRef.current.has(q.id) || fetchingRef.current.has(q.id)) continue;
      fetchingRef.current.add(q.id);

      fetchShakeMap(q.id)
        .then((data) => {
          fetchingRef.current.delete(q.id);
          cacheRef.current.set(q.id, data);
          if (data) {
            setShakemaps((prev) => {
              const next = new Map(prev);
              next.set(q.id, data);
              return next;
            });
          }
        })
        .catch(() => {
          fetchingRef.current.delete(q.id);
          cacheRef.current.set(q.id, null);
        });
    }
  }, [quakes]);

  // Solo devolver ShakeMaps para los quakes actualmente visibles.
  const currentIds = new Set(quakes.map((q) => q.id));
  const filtered = new Map<string, ShakeMapOverlay>();
  for (const [id, overlay] of shakemaps) {
    if (currentIds.has(id)) filtered.set(id, overlay);
  }
  return filtered;
}
