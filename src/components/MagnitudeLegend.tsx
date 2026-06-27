import { MAG_BANDS } from "../lib/magnitude";

export default function MagnitudeLegend() {
  return (
    <div className="legend" aria-label="Escala de magnitud">
      <span className="legend__title">Magnitud</span>
      <div className="legend__scale">
        {[...MAG_BANDS].reverse().map((b) => (
          <span key={b.min} className="legend__step" title={`${b.label} · M ${b.min}+`}>
            <span className="legend__swatch" style={{ background: b.color }} />
            <span className="legend__num">{b.min}</span>
          </span>
        ))}
      </div>
      <div className="legend__zones">
        <span className="legend__zone">
          <span className="legend__ring legend__ring--core" />
          Zona afectada
        </span>
        <span className="legend__zone">
          <span className="legend__ring legend__ring--felt" />
          Hasta dónde se sintió
        </span>
      </div>
    </div>
  );
}
