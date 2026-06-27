// Obtiene el overlay de intensidad MMI del ShakeMap de USGS para un sismo.
// Devuelve la URL de intensity_overlay.png (PNG con transparencia, igual que
// la web del USGS) y las 4 esquinas geográficas para posicionarlo en MapLibre.

type EventProduct = {
  contents?: Record<string, { url: string }>;
};

type EventResponse = {
  properties?: {
    products?: {
      shakemap?: EventProduct[];
    };
  };
};

type InfoJson = {
  output?: {
    map_information?: {
      min: { longitude: string; latitude: string };
      max: { longitude: string; latitude: string };
    };
  };
};

export type ShakeMapOverlay = {
  imageUrl: string;
  // [top-left, top-right, bottom-right, bottom-left] en [lon, lat]
  coords: [[number, number], [number, number], [number, number], [number, number]];
};

const USGS_EVENT = "https://earthquake.usgs.gov/fdsnws/event/1/query";

// GIF 1×1 transparente para inicializar el source antes de tener datos.
export const EMPTY_IMAGE =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

export async function fetchShakeMap(
  quakeId: string,
  signal?: AbortSignal,
): Promise<ShakeMapOverlay | null> {
  try {
    const eventRes = await fetch(
      `${USGS_EVENT}?eventid=${quakeId}&format=geojson`,
      { signal },
    );
    if (!eventRes.ok) return null;

    const event: EventResponse = await eventRes.json();
    const shakemaps = event.properties?.products?.shakemap;
    if (!shakemaps?.length) return null;

    const contents = shakemaps[0]?.contents ?? {};

    const overlayKey = Object.keys(contents).find((k) =>
      k.endsWith("intensity_overlay.png"),
    );
    const infoKey = Object.keys(contents).find((k) => k.endsWith("info.json"));
    if (!overlayKey || !infoKey) return null;

    const infoRes = await fetch(contents[infoKey].url, { signal });
    if (!infoRes.ok) return null;

    const info: InfoJson = await infoRes.json();
    const mi = info.output?.map_information;
    if (!mi) return null;

    const west = parseFloat(mi.min.longitude);
    const east = parseFloat(mi.max.longitude);
    const south = parseFloat(mi.min.latitude);
    const north = parseFloat(mi.max.latitude);

    return {
      imageUrl: contents[overlayKey].url,
      coords: [
        [west, north],
        [east, north],
        [east, south],
        [west, south],
      ],
    };
  } catch {
    return null;
  }
}
