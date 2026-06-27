// Cliente del API FDSN de USGS (GeoJSON, sin clave, con CORS). Consulta acotada
// al territorio de Venezuela por bounding box y normaliza cada evento a Quake.

export type Quake = {
  id: string;
  mag: number;
  place: string;
  lon: number;
  lat: number;
  depthKm: number;
  time: number; // epoch ms (hora del sismo)
  url: string;
};

// Bounding box de Venezuela (incluye plataforma marina y fronteras).
const BBOX = {
  minlatitude: 0.5,
  maxlatitude: 12.7,
  minlongitude: -73.5,
  maxlongitude: -59.5,
};

const ENDPOINT = "https://earthquake.usgs.gov/fdsnws/event/1/query";

// Ventana de la lista histórica (días).
export const HISTORY_DAYS = 7;

export async function fetchVenezuelaQuakes(
  days = HISTORY_DAYS,
  signal?: AbortSignal,
): Promise<Quake[]> {
  const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    format: "geojson",
    orderby: "time",
    starttime: start.toISOString(),
    minlatitude: String(BBOX.minlatitude),
    maxlatitude: String(BBOX.maxlatitude),
    minlongitude: String(BBOX.minlongitude),
    maxlongitude: String(BBOX.maxlongitude),
  });

  const res = await fetch(`${ENDPOINT}?${params.toString()}`, { signal });
  if (!res.ok) throw new Error(`USGS respondió ${res.status}`);
  const json = (await res.json()) as UsgsResponse;

  return json.features
    .filter((f) => f.geometry && Array.isArray(f.geometry.coordinates))
    .map((f) => {
      const [lon, lat, depthKm] = f.geometry.coordinates;
      return {
        id: f.id,
        mag: f.properties.mag ?? 0,
        place: f.properties.place ?? "Ubicación desconocida",
        lon,
        lat,
        depthKm: depthKm ?? 0,
        time: f.properties.time,
        url: f.properties.url ?? "",
      };
    })
    .filter((q) => Number.isFinite(q.lat) && Number.isFinite(q.lon));
}

type UsgsResponse = {
  features: Array<{
    id: string;
    properties: {
      mag: number | null;
      place: string | null;
      time: number;
      url: string | null;
    };
    geometry: { coordinates: [number, number, number] };
  }>;
};
