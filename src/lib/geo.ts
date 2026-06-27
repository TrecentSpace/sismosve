// Utilidades geográficas. Distancia de círculo máximo (haversine) en km entre
// dos puntos lat/lon, y la relación entre ciudades y sismos activos.

import type { City } from "../data/venezuelaCities";
import type { Quake } from "./usgs";
import { depthAdjustedZoneRadiusKm } from "./magnitude";

const R_EARTH_KM = 6371;

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R_EARTH_KM * Math.asin(Math.sqrt(a));
}

export type CityImpact = {
  city: City;
  quake: Quake; // sismo de mayor magnitud que alcanza la ciudad
  distanceKm: number;
};

// Para cada ciudad, busca el sismo ACTIVO de mayor magnitud cuya zona afectada
// la alcanza. Devuelve un mapa nombre-ciudad -> impacto.
export function cityImpacts(
  cities: City[],
  activeQuakes: Quake[],
): Map<string, CityImpact> {
  const impacts = new Map<string, CityImpact>();
  for (const city of cities) {
    let best: CityImpact | null = null;
    for (const q of activeQuakes) {
      const d = haversineKm(city.lat, city.lon, q.lat, q.lon);
      if (d <= depthAdjustedZoneRadiusKm(q.mag, q.depthKm)) {
        if (!best || q.mag > best.quake.mag) {
          best = { city, quake: q, distanceKm: d };
        }
      }
    }
    if (best) impacts.set(city.name, best);
  }
  return impacts;
}
