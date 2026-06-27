import { useEffect, useMemo, useState } from "react";
import type { Quake } from "../lib/usgs";
import { bucketCounts } from "../lib/trend";
import { useMeasure } from "../lib/useMeasure";

const HOUR = 3_600_000;
const WINDOW_MS = 7 * 24 * HOUR; // 7 días
const BUCKET_MS = 1 * HOUR; // agrupación cada 1 hora

const EARTHQUAKE_DAY = 24; // día del terremoto principal (jun 2025)
const TICK_MS = 60_000; // desliza la ventana de tiempo cada minuto

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

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
  const now = useNow(TICK_MS);

  const buckets = useMemo(
    () => bucketCounts(quakes, BUCKET_MS, WINDOW_MS, now),
    [quakes, now],
  );

  const maxData = Math.max(1, ...buckets.map((b) => b.count));
  const { ticks, top } = yTicks(maxData);

  const H = 124;
  const padL = 24;
  const padR = 10;
  const padT = 12;
  const padB = 32;
  const w = Math.max(220, measured || 320);
  const innerW = w - padL - padR;
  const innerH = H - padT - padB;

  const windowStart = now - WINDOW_MS;
  const bucketTime = (b: (typeof buckets)[number]) =>
    Math.min(b.start + BUCKET_MS / 2, now);
  const xAtTime = (t: number) =>
    padL + Math.max(0, Math.min(1, (t - windowStart) / WINDOW_MS)) * innerW;
  const yAt = (c: number) => padT + innerH - (c / top) * innerH;

  const dayTicks: { x: number; day: number; highlight: boolean }[] = [];
  const d0 = new Date(windowStart);
  d0.setHours(0, 0, 0, 0);
  for (let i = 0; i <= 8; i++) {
    const ms = d0.getTime() + i * 24 * HOUR;
    if (ms < windowStart || ms > now) continue;
    const day = new Date(ms).getDate();
    dayTicks.push({ x: xAtTime(ms), day, highlight: day === EARTHQUAKE_DAY });
  }

  const visible = buckets.filter((b) => b.start < now);
  const linePts = visible
    .map((b) => `${xAtTime(bucketTime(b))},${yAt(b.count)}`)
    .join(" ");
  const areaPath =
    `M ${xAtTime(windowStart)},${padT + innerH} ` +
    visible.map((b) => `L ${xAtTime(bucketTime(b))},${yAt(b.count)}`).join(" ") +
    ` L ${xAtTime(now)},${padT + innerH} Z`;

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

          {dayTicks
            .filter((t) => t.highlight)
            .map((t) => (
              <line
                key={`mark-${t.day}`}
                x1={t.x}
                y1={padT}
                x2={t.x}
                y2={padT + innerH}
                className="trend__vmark"
              />
            ))}

          {dayTicks.map((t) =>
            t.highlight ? (
              <text
                key={t.day}
                x={t.x}
                y={H - 16}
                className="trend__xtick trend__xtick--mid trend__xtick--quake"
              >
                <tspan x={t.x} dy={0}>
                  {t.day}
                </tspan>
                <tspan x={t.x} dy={11} className="trend__xtick--quake-lbl">
                  terremoto
                </tspan>
              </text>
            ) : (
              <text
                key={t.day}
                x={t.x}
                y={H - 6}
                className="trend__xtick trend__xtick--mid"
              >
                {t.day}
              </text>
            ),
          )}
        </svg>
        <p className="trend__note">
          Tomando en cuenta sismos de magnitud 4 y más
        </p>
      </div>
    </section>
  );
}
