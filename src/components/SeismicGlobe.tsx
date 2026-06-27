import { useEffect, useRef } from "react";
import maplibregl, { type Map as MlMap, type GeoJSONSource, type ImageSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { VENEZUELA_CITIES } from "../data/venezuelaCities";
import type { Quake } from "../lib/usgs";
import type { CityImpact } from "../lib/geo";
import { citiesFC, epicentersFC, feltFC, zonesFC } from "../lib/geojson";
import { maskFC, outlineFC } from "../lib/countryMask";
import { EMPTY_IMAGE, type ShakeMapOverlay } from "../lib/shakemap";

const STYLE_URL =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

const reducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Coordenadas dummy para inicializar el source de imagen antes de tener datos.
const EMPTY_COORDS: [[number,number],[number,number],[number,number],[number,number]] =
  [[-180, 85], [180, 85], [180, -85], [-180, -85]];

type Props = {
  quakes: Quake[];
  impacts: Map<string, CityImpact>;
  focusQuake?: Quake | null;
  shakemaps?: Map<string, ShakeMapOverlay>;
  viewMode?: "area" | "shakemap";
};

export default function SeismicGlobe({ quakes, impacts, focusQuake, shakemaps = new Map(), viewMode = "shakemap" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const readyRef = useRef(false);

  const quakesRef = useRef(quakes);
  const impactsRef = useRef(impacts);
  const shakemapsRef = useRef(shakemaps);
  const viewModeRef = useRef(viewMode);
  quakesRef.current = quakes;
  impactsRef.current = impacts;
  shakemapsRef.current = shakemaps;
  viewModeRef.current = viewMode;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: [-66.5, 7.8],
      zoom: 4.4,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");

    map.on("style.load", () => {
      try {
        map.setProjection({ type: "globe" });
      } catch { /* fallback mercator */ }

      map.addSource("ven-mask", { type: "geojson", data: maskFC() });
      map.addSource("ven-outline", { type: "geojson", data: outlineFC() });
      map.addLayer({
        id: "ven-mask-fill",
        type: "fill",
        source: "ven-mask",
        paint: { "fill-color": "#05070A", "fill-opacity": 0.66 },
      });
      map.addLayer({
        id: "ven-outline-glow",
        type: "line",
        source: "ven-outline",
        paint: { "line-color": "#F2A38B", "line-width": 4, "line-blur": 4, "line-opacity": 0.45 },
      });
      map.addLayer({
        id: "ven-outline-line",
        type: "line",
        source: "ven-outline",
        paint: { "line-color": "#F4EFE4", "line-width": 1.1, "line-opacity": 0.8 },
      });

      // Overlay raster del ShakeMap (intensity_overlay.png del USGS, con transparencia).
      map.addSource("shakemap-overlay", {
        type: "image",
        url: EMPTY_IMAGE,
        coordinates: EMPTY_COORDS,
      });
      map.addLayer({
        id: "shakemap-raster",
        type: "raster",
        source: "shakemap-overlay",
        paint: {
          "raster-opacity": 0,
          "raster-fade-duration": 300,
        },
      });

      map.addSource("felt", { type: "geojson", data: feltFC([]) });
      map.addSource("zones", { type: "geojson", data: zonesFC([]) });
      map.addSource("epicenters", { type: "geojson", data: epicentersFC([]) });
      map.addSource("cities", {
        type: "geojson",
        data: citiesFC(VENEZUELA_CITIES, new Map()),
      });

      map.addLayer({
        id: "felt-fill",
        type: "fill",
        source: "felt",
        paint: { "fill-color": ["get", "color"], "fill-opacity": 0.15 },
      });
      map.addLayer({
        id: "felt-line",
        type: "line",
        source: "felt",
        paint: {
          "line-color": ["get", "color"],
          "line-width": 1.4,
          "line-opacity": 0.6,
          "line-dasharray": [2, 2],
        },
      });

      map.addLayer({
        id: "zones-fill",
        type: "fill",
        source: "zones",
        paint: { "fill-color": ["get", "color"], "fill-opacity": 0.22 },
      });
      map.addLayer({
        id: "zones-line",
        type: "line",
        source: "zones",
        paint: { "line-color": ["get", "color"], "line-width": 1.2, "line-opacity": 0.7 },
      });

      map.addLayer({
        id: "epicenters-pulse",
        type: "circle",
        source: "epicenters",
        filter: [">=", ["get", "mag"], 5],
        paint: {
          "circle-color": ["get", "color"],
          "circle-opacity": 0.35,
          "circle-radius": 8,
        },
      });

      map.addLayer({
        id: "epicenters-dot",
        type: "circle",
        source: "epicenters",
        paint: {
          "circle-color": ["get", "color"],
          "circle-radius": ["interpolate", ["linear"], ["get", "mag"], 2, 3, 5, 6, 7, 10],
          "circle-stroke-color": "#FFFFFF",
          "circle-stroke-width": 1,
        },
      });

      map.addLayer({
        id: "cities-dot",
        type: "circle",
        source: "cities",
        paint: {
          "circle-color": ["get", "color"],
          "circle-radius": [
            "case",
            ["==", ["get", "affected"], 1], 5,
            ["==", ["get", "capital"], 1], 3.2,
            2.2,
          ],
          "circle-stroke-color": "#0E1116",
          "circle-stroke-width": 1,
        },
      });
      map.addLayer({
        id: "cities-label",
        type: "symbol",
        source: "cities",
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Open Sans Regular", "Noto Sans Regular"],
          "text-size": ["case", ["==", ["get", "capital"], 1], 12, 10],
          "text-offset": [0, 1.1],
          "text-anchor": "top",
          "text-optional": true,
          "text-allow-overlap": false,
        },
        paint: {
          "text-color": ["case", ["==", ["get", "affected"], 1], "#F2A38B", "#C7BCA9"],
          "text-halo-color": "#0E1116",
          "text-halo-width": 1.4,
        },
      });

      map.on("click", "epicenters-dot", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const p = f.properties as Record<string, unknown>;
        const when = new Date(Number(p.time)).toLocaleString("es-VE");
        new maplibregl.Popup({ closeButton: true })
          .setLngLat((f.geometry as GeoJSON.Point).coordinates as [number, number])
          .setHTML(
            `<div class="popup"><strong>M ${Number(p.mag).toFixed(1)}</strong>` +
              `<span>${p.place ?? ""}</span>` +
              `<span>Prof. ${Number(p.depthKm).toFixed(0)} km</span>` +
              `<span>${when}</span></div>`,
          )
          .addTo(map);
      });
      map.on("mouseenter", "epicenters-dot", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "epicenters-dot", () => { map.getCanvas().style.cursor = ""; });

      readyRef.current = true;
      pushData();
      startPulse();
    });

    return () => {
      map.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pushData() {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const qs = quakesRef.current ?? [];
    const sm = shakemapsRef.current;

    // ShakeMap visible solo si el modo es "shakemap" y hay datos disponibles.
    const useShakeMap = viewModeRef.current === "shakemap" && sm.size > 0;
    const skipIds = useShakeMap ? new Set(sm.keys()) : new Set<string>();

    const overlay = useShakeMap ? (sm.values().next().value as ShakeMapOverlay) : null;
    const imgSrc = map.getSource("shakemap-overlay") as ImageSource | undefined;
    if (overlay) {
      imgSrc?.updateImage({ url: overlay.imageUrl, coordinates: overlay.coords });
      map.setPaintProperty("shakemap-raster", "raster-opacity", 0.75);
    } else {
      imgSrc?.updateImage({ url: EMPTY_IMAGE, coordinates: EMPTY_COORDS });
      map.setPaintProperty("shakemap-raster", "raster-opacity", 0);
    }

    (map.getSource("felt") as GeoJSONSource)?.setData(feltFC(qs, skipIds));
    (map.getSource("zones") as GeoJSONSource)?.setData(zonesFC(qs, skipIds));
    (map.getSource("epicenters") as GeoJSONSource)?.setData(epicentersFC(qs));
    (map.getSource("cities") as GeoJSONSource)?.setData(
      citiesFC(VENEZUELA_CITIES, impactsRef.current),
    );
  }

  useEffect(() => {
    pushData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quakes, impacts, shakemaps, viewMode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current || !focusQuake) return;
    map.flyTo({
      center: [focusQuake.lon, focusQuake.lat],
      zoom: Math.max(map.getZoom(), 6),
      duration: 1000,
      essential: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusQuake?.id]);

  function startPulse() {
    const map = mapRef.current;
    if (!map || reducedMotion) return;
    let raf = 0;
    const loop = () => {
      if (!mapRef.current || !map.getLayer("epicenters-pulse")) return;
      const t = (Date.now() % 1600) / 1600;
      map.setPaintProperty("epicenters-pulse", "circle-radius", 8 + t * 26);
      map.setPaintProperty("epicenters-pulse", "circle-opacity", 0.4 * (1 - t));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    pulseRafRef.current = () => cancelAnimationFrame(raf);
  }
  const pulseRafRef = useRef<() => void>();
  useEffect(() => () => pulseRafRef.current?.(), []);

  return <div ref={containerRef} className="globe" aria-label="Mapa 3D de sismos en Venezuela" />;
}
