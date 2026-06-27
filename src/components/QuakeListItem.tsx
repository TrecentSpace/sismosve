import type { Quake } from "../lib/usgs";
import { bandFor } from "../lib/magnitude";

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
}

type Props = {
  quake: Quake;
  active: boolean;
  isNew: boolean;
  selected: boolean;
  onSelect: (id: string) => void;
};

export default function QuakeListItem({
  quake,
  active,
  isNew,
  selected,
  onSelect,
}: Props) {
  const band = bandFor(quake.mag);
  const when = new Date(quake.time);
  const stateLabel = selected ? "en mapa" : active ? "en curso" : "ya pasó";
  return (
    <li className="row__item">
      <button
        type="button"
        className={`row${isNew ? " row--new" : ""}${selected ? " row--selected" : ""}`}
        aria-pressed={selected}
        onClick={() => onSelect(quake.id)}
        title={
          selected
            ? "Seleccionado: viéndose en el mapa. Clic para quitarlo."
            : "Clic para ver este sismo en el mapa"
        }
      >
        <span
          className="row__mag"
          style={{ background: band.color }}
          aria-label={`Magnitud ${quake.mag.toFixed(1)}`}
        >
          {quake.mag.toFixed(1)}
        </span>
        <span className="row__body">
          <span className="row__place">{quake.place}</span>
          <span className="row__meta">
            <time dateTime={when.toISOString()}>
              {when.toLocaleString("es-VE", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
            <span className="row__dot" aria-hidden>·</span>
            <span>{timeAgo(quake.time)}</span>
            <span className="row__dot" aria-hidden>·</span>
            <span>{quake.depthKm.toFixed(0)} km prof.</span>
          </span>
        </span>
        <span
          className={`row__state${selected ? " row__state--sel" : active ? " row__state--on" : ""}`}
        >
          {stateLabel}
        </span>
      </button>
    </li>
  );
}
