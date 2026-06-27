import { useMemo } from "react";
import type { Quake } from "../lib/usgs";
import { bucketCounts } from "../lib/trend";
import { useMeasure } from "../lib/useMeasure";

const HOUR = 3_600_000;
const WINDOW_MS = 7 * 24 * HOUR; // 7 días
const BUCKET_MS = 3 * HOUR; // agrupación cada 3 horas

const fmtDay = (ms: number) =>
  new Date(ms).toLocaleDateString("es-VE", { day: "2-digit", month: "short" });

type Props = { quakes: Quake[] };

export default function QuakeTrend({ quakes }: Props) {
  const [ref, measured] = useMeasure<HTMLDivElement>();

  const buckets = useMemo(
    () => bucketCounts(quakes, BUCKET_MS, WINDOW_MS),
    [quakes],
  );

  const total = buckets.reduce((s, b) => s + b.count, 0);
  const max = Math.max(1, ...buckets.map((b) => b.count));
  const n = buckets.length;

  const H = 124;
  const padL = 24;
  const padR = 10;
  const padT = 12;
  const padB = 22;
  const w = Math.max(220, measured || 320);
  const innerW = w - padL - padR;
  const innerH = H - padT - padB;

  const xAt = (i: number) => padL + (n <= 1 ? 0 : (i / (n - 1)) * innerW);
  const yAt = (c: number) => padT + innerH - (c / max) * innerH;

  const linePts = buckets.map((b, i) => `${xAt(i)},${yAt(b.count)}`).join(" ");
  const areaPath =
    `M ${xAt(0)},${padT + innerH} ` +
    buckets.map((b, i) => `L ${xAt(i)},${yAt(b.count)}`).join(" ") +
    ` L ${xAt(n - 1)},${padT + innerH} Z`;

  return (
    <section className="trend" aria-label="Tendencia de sismos">
      <div className="trend__head">
        <h3 className="trend__title">Tendencia de sismos</h3>
        <span className="trend__tag">cada 3 h</span>
      </div>
      <p className="trend__sub">últimos 7 días · {total} sismos</p>

      <div ref={ref} className="trend__chart">
        <svg
          width={w}
          height={H}
          role="img"
          aria-label={`Cantidad de sismos agrupados cada 3 horas. Máximo ${max} en un intervalo.`}
        >
          {/* gridline y etiqueta del máximo */}
          <line
            x1={padL}
            y1={padT}
            x2={w - padR}
            y2={padT}
            className="trend__grid"
          />
          <text x={4} y={padT + 4} className="trend__ytick">
            {max}
          </text>
          <line
            x1={padL}
            y1={padT + innerH}
            x2={w - padR}
            y2={padT + innerH}
            className="trend__axis"
          />
          <text x={4} y={padT + innerH} className="trend__ytick">
            0
          </text>

          <path d={areaPath} className="trend__area" />
          <polyline points={linePts} className="trend__line" />

          {/* etiquetas x: inicio y "ahora" */}
          <text x={padL} y={H - 6} className="trend__xtick">
            {fmtDay(buckets[0].start)}
          </text>
          <text x={w - padR} y={H - 6} className="trend__xtick trend__xtick--end">
            ahora
          </text>
        </svg>
      </div>
    </section>
  );
}
