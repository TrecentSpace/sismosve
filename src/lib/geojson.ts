// Construye las FeatureCollections de GeoJSON que consumen las capas de MapLibre:
// ciudades (siempre visibles, resaltadas si están afectadas), zonas afectadas
// (polígonos circulares por magnitud) y epicentros exactos.

import type { FeatureCollection, Feature, Point, Polygon } from "geojson";
import type { City } from "../data/venezuelaCities";
import type { Quake } from "./usgs";
import type { CityImpact } from "./geo";
import {
  colorFor,
  depthAdjustedFeltRadiusKm,
  depthAdjustedZoneRadiusKm,
  hasZone,
} from "./magnitude";

// Polígono que aproxima un círculo geográfico de `radiusKm` alrededor de un
// punto (corrige la longitud por la latitud).
function circleCoords(
  lat: number,
  lon: number,
  radiusKm: number,
  steps = 48,
): number[][] {
  const ring: number[][] = [];
  const dLat = radiusKm / 110.574; // km por grado de latitud
  const dLon = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));
  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * 2 * Math.PI;
    ring.push([lon + dLon * Math.cos(theta), lat + dLat * Math.sin(theta)]);
  }
  return ring;
}

export function citiesFC(
  cities: City[],
  impacts: Map<string, CityImpact>,
): FeatureCollection<Point> {
  const features: Feature<Point>[] = cities.map((c) => {
    const impact = impacts.get(c.name);
    return {
      type: "Feature",
      geometry: { type: "Point", coordinates: [c.lon, c.lat] },
      properties: {
        name: c.name,
        state: c.state,
        capital: c.capital ? 1 : 0,
        affected: impact ? 1 : 0,
        color: impact ? colorFor(impact.quake.mag) : "#C7BCA9",
        mag: impact ? impact.quake.mag : 0,
      },
    };
  });
  return { type: "FeatureCollection", features };
}

// Zona de mayor afectación (círculo interior). Radio ajustado por profundidad:
// sismos superficiales dañan un área mayor; profundos la concentran menos.
// Se excluyen sismos que ya tienen ShakeMap (skipIds) para evitar duplicar.
export function zonesFC(
  activeQuakes: Quake[],
  skipIds: Set<string> = new Set(),
): FeatureCollection<Polygon> {
  const features: Feature<Polygon>[] = activeQuakes
    .filter((q) => hasZone(q.mag) && !skipIds.has(q.id))
    .map((q) => ({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          circleCoords(
            q.lat,
            q.lon,
            depthAdjustedZoneRadiusKm(q.mag, q.depthKm),
          ),
        ],
      },
      properties: { color: colorFor(q.mag), mag: q.mag },
    }));
  return { type: "FeatureCollection", features };
}

// Alcance percibido (círculo exterior). Los sismos profundos se sienten sobre
// un área mayor porque las ondas viajan con menos atenuación por roca sólida.
export function feltFC(
  activeQuakes: Quake[],
  skipIds: Set<string> = new Set(),
): FeatureCollection<Polygon> {
  const features: Feature<Polygon>[] = activeQuakes
    .filter((q) => hasZone(q.mag) && !skipIds.has(q.id))
    .map((q) => ({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          circleCoords(
            q.lat,
            q.lon,
            depthAdjustedFeltRadiusKm(q.mag, q.depthKm),
            64,
          ),
        ],
      },
      properties: { color: colorFor(q.mag), mag: q.mag },
    }));
  return { type: "FeatureCollection", features };
}


export function epicentersFC(activeQuakes: Quake[]): FeatureCollection<Point> {
  const features: Feature<Point>[] = activeQuakes.map((q) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: [q.lon, q.lat] },
    properties: {
      id: q.id,
      mag: q.mag,
      place: q.place,
      color: colorFor(q.mag),
      depthKm: q.depthKm,
      time: q.time,
    },
  }));
  return { type: "FeatureCollection", features };
}
