import { useMemo } from "react";
import type { Quake } from "../lib/usgs";
import { bucketCounts } from "../lib/trend";
import { useMeasure } from "../lib/useMeasure";

const HOUR = 3_600_000;
const WINDOW_MS = 7 * 24 * HOUR; // 7 días
const BUCKET_MS = 1 * HOUR; // agrupación cada 1 hora

const fmtDay = (ms: number) =>
  new Date(ms).toLocaleDateString("es-VE", { day: "2-digit", month: "short" });

// Genera una escala "bonita" de ticks enteros para el eje Y. Mantiene un mínimo
// de margen para que siempre haya varias líneas de referencia que medir.
function yTicks(maxData: number): { ticks: number[]; top: number } {
  const max = Math.max(maxData, 4); // margen mínimo -> al menos 5 líneas
  const target = 4; // ~4 intervalos
  const rawStep = max / target;
  const pow = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const step =
    [1, 2, 5, 10].map((c) => c * pow).find((c) => c >= rawStep) ?? 10 * pow;
  const istep = Math.max(1, Math.round(step)); // paso entero (son conteos)
  const top = Math.ceil(max / istep) * istep;
  const ticks: number[] = [];
  for (let v = 0; v <= top; v += istep) ticks.push(v);
  return { ticks, top };
}

type Props = { quakes: Quake[] };

export default function QuakeTrend({ quakes }: Props) {
  const [ref, measured] = useMeasure<HTMLDivElement>();

  const buckets = useMemo(
    () => bucketCounts(quakes, BUCKET_MS, WINDOW_MS),
    [quakes],
  );

  const maxData = Math.max(1, ...buckets.map((b) => b.count));
  const { ticks, top } = yTicks(maxData);
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
  const yAt = (c: number) => padT + innerH - (c / top) * innerH;

  const linePts = buckets.map((b, i) => `${xAt(i)},${yAt(b.count)}`).join(" ");
  const areaPath =
    `M ${xAt(0)},${padT + innerH} ` +
    buckets.map((b, i) => `L ${xAt(i)},${yAt(b.count)}`).join(" ") +
    ` L ${xAt(n - 1)},${padT + innerH} Z`;

  return (
    <section className="trend" aria-label="Tendencia de sismos">
      <div className="trend__head">
        <h3 className="trend__title">Tendencia de sismos</h3>
        <span className="trend__tag">Sismos por hora</span>
      </div>
      <p className="trend__sub">Sismos</p>

      <div ref={ref} className="trend__chart">
        <svg
          width={w}
          height={H}
          role="img"
          aria-label={`Cantidad de sismos agrupados cada 1 hora. Máximo ${maxData} en un intervalo.`}
        >
          {/* líneas de referencia + etiquetas del eje Y */}
          {ticks.map((t) => {
            const y = yAt(t);
            const isBase = t === 0;
            return (
              <g key={t}>
                <line
                  x1={padL}
                  y1={y}
                  x2={w - padR}
                  y2={y}
                  className={isBase ? "trend__axis" : "trend__grid"}
                />
                <text x={4} y={y + 3} className="trend__ytick">
                  {t}
                </text>
              </g>
            );
          })}

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
