// Agrupa los sismos en intervalos (buckets) de tamaño fijo a lo largo de una
// ventana de tiempo, para el gráfico de tendencia.

import type { Quake } from "./usgs";

export type Bucket = { start: number; count: number };

export function bucketCounts(
  quakes: Quake[],
  bucketMs: number,
  windowMs: number,
  now = Date.now(),
): Bucket[] {
  const start = now - windowMs;
  const n = Math.max(1, Math.ceil(windowMs / bucketMs));
  const buckets: Bucket[] = Array.from({ length: n }, (_, i) => ({
    start: start + i * bucketMs,
    count: 0,
  }));
  for (const q of quakes) {
    if (q.time < start || q.time > now) continue;
    const idx = Math.min(n - 1, Math.floor((q.time - start) / bucketMs));
    if (idx >= 0) buckets[idx].count++;
  }
  return buckets;
}
