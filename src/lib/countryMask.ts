// Construye las capas que hacen resaltar a Venezuela: una "máscara" que oscurece
// todo lo que está fuera del país (el mundo como polígono con Venezuela recortada
// como hueco) y el contorno del país para un borde luminoso.

import type { FeatureCollection, Polygon, MultiPolygon } from "geojson";
import venezuela from "../data/venezuela.geo.json";

// Todos los anillos exteriores del país (soporta Polygon y MultiPolygon).
function venezuelaRings(): number[][][] {
  const geom = (venezuela as FeatureCollection).features[0].geometry as
    | Polygon
    | MultiPolygon;
  if (geom.type === "Polygon") {
    return [geom.coordinates[0]];
  }
  return geom.coordinates.map((poly) => poly[0]);
}

// Anillo que cubre el mundo entero (sentido horario).
const WORLD_RING: number[][] = [
  [-180, -85],
  [180, -85],
  [180, 85],
  [-180, 85],
  [-180, -85],
];

// Polígono = mundo con Venezuela como hueco -> al rellenarlo se oscurece todo
// menos Venezuela.
export function maskFC(): FeatureCollection<Polygon> {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: [WORLD_RING, ...venezuelaRings()],
        },
      },
    ],
  };
}

// Contorno del país (para el borde luminoso).
export function outlineFC(): FeatureCollection {
  return venezuela as FeatureCollection;
}
