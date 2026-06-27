import { useMemo, useState } from "react";
import {
  useEarthquakes,
  isActive,
  ACTIVE_WINDOW_LABEL,
} from "./lib/useEarthquakes";
import { cityImpacts } from "./lib/geo";
import { VENEZUELA_CITIES } from "./data/venezuelaCities";
import SeismicGlobe from "./components/SeismicGlobe";
import QuakeList from "./components/QuakeList";
import MagnitudeLegend from "./components/MagnitudeLegend";
import LiveTicker from "./components/LiveTicker";
import QuakeTrend from "./components/QuakeTrend";
import InfoModal from "./components/InfoModal";
import AutoRefresh from "./components/AutoRefresh";
import Toasts from "./components/Toasts";
import { useQuakeAlerts } from "./lib/useQuakeAlerts";
import { useShakeMaps } from "./lib/useShakeMaps";

type Filter = "all" | "active";

export default function App() {
  const { quakes, status, lastUpdated, newIds, refresh } = useEarthquakes();
  const now = Date.now();
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // En teléfono arranca plegado (se ve el mapa); en escritorio, desplegado.
  const [viewMode, setViewMode] = useState<"area" | "shakemap">("shakemap");
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 820px)").matches,
  );

  const activeQuakes = useMemo(
    () => quakes.filter((q) => isActive(q, now)),
    [quakes, now],
  );

  // Lista visible según el toggle: solo activos o todos los ocurridos.
  const listed = filter === "active" ? activeQuakes : quakes;

  const selectedQuake = useMemo(
    () => quakes.find((q) => q.id === selectedId) ?? null,
    [quakes, selectedId],
  );

  // Qué se ve en el mapa:
  //  - Activos: todos los sismos en curso (últimos 30 min).
  //  - Todos: solo el sismo seleccionado (uno a la vez), o nada si no hay.
  const mapQuakes = useMemo(
    () =>
      filter === "active"
        ? activeQuakes
        : selectedQuake
          ? [selectedQuake]
          : [],
    [filter, activeQuakes, selectedQuake],
  );

  const isMobile = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 820px)").matches;

  const selectQuake = (id: string) => {
    const next = selectedId === id ? null : id;
    setSelectedId(next);
    // En teléfono, al seleccionar un sismo se pliega el panel y se sube al mapa.
    if (next && isMobile()) {
      setCollapsed(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // ShakeMaps del USGS para sismos M5+ visibles en el mapa.
  const shakemaps = useShakeMaps(mapQuakes);

  // Avisos de "sismo reportado" (posteriores, no predicción).
  const alerts = useQuakeAlerts(quakes, newIds);
  const impacts = useMemo(
    () => cityImpacts(VENEZUELA_CITIES, mapQuakes),
    [mapQuakes],
  );

  // Magnitud del sismo nuevo más fuerte para alimentar el spike del ticker.
  const spikeMag = useMemo(() => {
    let m = 0;
    for (const q of quakes) if (newIds.has(q.id) && q.mag > m) m = q.mag;
    return m;
  }, [quakes, newIds]);

  const lastStr = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString("es-VE", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "—";

  return (
    <div className="app">
      <AutoRefresh />
      <InfoModal />
      <header className={`head${headerCollapsed ? " is-collapsed" : ""}`}>
        <div className="head__toprow">
          <div className="head__brand">
            <span className="head__eyebrow">Monitor sísmico · Venezuela</span>
            <h1 className="head__title">SISMO·VE</h1>
          </div>
          <button
            type="button"
            className="head__collapser"
            aria-expanded={!headerCollapsed}
            aria-label={headerCollapsed ? "Expandir cabecera" : "Contraer cabecera"}
            onClick={() => setHeaderCollapsed((c) => !c)}
          >
            {headerCollapsed ? "▴" : "▾"}
          </button>
        </div>
        <LiveTicker spikeKey={newIds.size} spikeMag={spikeMag} />
        <div className="head__stats">
          <div className="stat">
            <span className="stat__num">{activeQuakes.length}</span>
            <span className="stat__lbl">activos</span>
          </div>
          <div className="stat">
            <span className="stat__num">{quakes.length}</span>
            <span className="stat__lbl">en 7 días</span>
          </div>
          <button className="refresh" onClick={refresh} title="Actualizar ahora">
            <span
              className={`dot dot--${status}`}
              aria-hidden
            />
            {status === "error" ? "Reintentar" : "Actualizar"}
          </button>
          <button
            className={`refresh${alerts.enabled ? " refresh--on" : ""}`}
            onClick={alerts.enabled ? alerts.disable : alerts.enable}
            aria-pressed={alerts.enabled}
            title={
              alerts.enabled && alerts.permission === "denied"
                ? "Avisos en pantalla activos. Las notificaciones del navegador están bloqueadas; habilítalas en los ajustes del sitio para recibirlas con la pestaña cerrada."
                : "Aviso cuando se reporta un sismo nuevo (posterior al evento, no es predicción)"
            }
          >
            {alerts.enabled
              ? alerts.permission === "denied"
                ? "🔔 Avisos (solo en pantalla)"
                : "🔔 Avisos"
              : "🔔 Avisos"}
          </button>
        </div>
      </header>
      <Toasts toasts={alerts.toasts} onDismiss={alerts.dismissToast} />

      <main className="grid">
        <section className="map">
          <SeismicGlobe
            quakes={mapQuakes}
            impacts={impacts}
            focusQuake={selectedQuake}
            shakemaps={shakemaps}
            viewMode={viewMode}
          />
          {shakemaps.size > 0 && mapQuakes.length > 0 && (
            <div className="map-mode-toggle">
              <div className="toggle" role="group" aria-label="Modo de visualización">
                <button
                  type="button"
                  className={`toggle__btn${viewMode === "area" ? " is-on" : ""}`}
                  aria-pressed={viewMode === "area"}
                  onClick={() => setViewMode("area")}
                >
                  Área
                </button>
                <button
                  type="button"
                  className={`toggle__btn${viewMode === "shakemap" ? " is-on" : ""}`}
                  aria-pressed={viewMode === "shakemap"}
                  onClick={() => setViewMode("shakemap")}
                >
                  Detallado
                </button>
              </div>
            </div>
          )}
          <MagnitudeLegend />
          {mapQuakes.length === 0 && status !== "loading" && (
            <div className="maphint">
              {filter === "active"
                ? `Sin sismos reportados en los últimos ${ACTIVE_WINDOW_LABEL}. Cambia a “Todos” y selecciona un sismo para ver cómo afectó.`
                : "Selecciona un sismo de la lista para verlo en el mapa."}
            </div>
          )}
        </section>

        <aside className={`panel${collapsed ? " is-collapsed" : ""}`}>
          <div className="panel__head">
            <div className="panel__headrow">
              <button
                type="button"
                className="panel__toggle"
                aria-expanded={!collapsed}
                aria-controls="panel-body"
                onClick={() => setCollapsed((c) => !c)}
              >
                <h2 className="panel__title">Registro de eventos</h2>
                <span className="panel__chevron" aria-hidden>
                  {collapsed ? "▸" : "▾"}
                </span>
              </button>
              <div className="toggle" role="group" aria-label="Filtrar eventos">
                <button
                  type="button"
                  className={`toggle__btn${filter === "active" ? " is-on" : ""}`}
                  aria-pressed={filter === "active"}
                  onClick={() => setFilter("active")}
                >
                  Activos
                </button>
                <button
                  type="button"
                  className={`toggle__btn${filter === "all" ? " is-on" : ""}`}
                  aria-pressed={filter === "all"}
                  onClick={() => setFilter("all")}
                >
                  Todos
                </button>
              </div>
            </div>
            <span className="panel__sub">
              {status === "error"
                ? "No se pudo contactar a USGS. Reintentando…"
                : `${listed.length} ${
                    filter === "active" ? `activos` : "en 7 días"
                  } · USGS ${lastStr}`}
            </span>
          </div>
          <div id="panel-body" className="panel__body">
            <div className="panel__scroll">
              {status === "loading" && quakes.length === 0 ? (
                <p className="empty">Cargando datos de USGS…</p>
              ) : (
                <QuakeList
                  quakes={listed}
                  newIds={newIds}
                  selectedId={selectedId}
                  onSelect={selectQuake}
                  emptyMessage={
                    filter === "active"
                      ? `Sin sismos activos en los últimos ${ACTIVE_WINDOW_LABEL}.`
                      : undefined
                  }
                />
              )}
            </div>
            <QuakeTrend quakes={quakes} />
          </div>
        </aside>
      </main>
    </div>
  );
}
