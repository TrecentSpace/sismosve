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

type Filter = "all" | "active";

export default function App() {
  const { quakes, status, lastUpdated, newIds, refresh } = useEarthquakes();
  const now = Date.now();
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  const selectQuake = (id: string) =>
    setSelectedId((prev) => (prev === id ? null : id));

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
      <header className="head">
        <div className="head__brand">
          <span className="head__eyebrow">Monitor sísmico · Venezuela</span>
          <h1 className="head__title">SISMO·VE</h1>
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
                : "🔔 Avisos on"
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
          />
          <MagnitudeLegend />
          {mapQuakes.length === 0 && status !== "loading" && (
            <div className="maphint">
              {filter === "active"
                ? `Sin sismos en los últimos ${ACTIVE_WINDOW_LABEL}. Cambia a “Todos” y selecciona un sismo para ver cómo afectó.`
                : "Selecciona un sismo de la lista para verlo en el mapa."}
            </div>
          )}
        </section>

        <aside className="panel">
          <div className="panel__head">
            <div className="panel__headrow">
              <h2 className="panel__title">Registro de eventos</h2>
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
                    filter === "active" ? `activos (${ACTIVE_WINDOW_LABEL})` : "en 7 días"
                  } · USGS ${lastStr}`}
            </span>
          </div>
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
        </aside>
      </main>
    </div>
  );
}
