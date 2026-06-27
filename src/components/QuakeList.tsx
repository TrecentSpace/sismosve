import type { Quake } from "../lib/usgs";
import { isActive } from "../lib/useEarthquakes";
import QuakeListItem from "./QuakeListItem";

type Props = {
  quakes: Quake[];
  newIds: Set<string>;
  emptyMessage?: string;
};

export default function QuakeList({ quakes, newIds, emptyMessage }: Props) {
  const now = Date.now();
  if (quakes.length === 0) {
    return (
      <p className="empty">
        {emptyMessage ??
          "Sin sismos registrados en los últimos 7 días en el área de Venezuela."}
      </p>
    );
  }
  return (
    <ol className="list" aria-label="Registro de sismos">
      {quakes.map((q) => (
        <QuakeListItem
          key={q.id}
          quake={q}
          active={isActive(q, now)}
          isNew={newIds.has(q.id)}
        />
      ))}
    </ol>
  );
}
