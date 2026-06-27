// Mapea la magnitud de un sismo a un matiz de rojo y a DOS radios:
//  - zoneRadiusKm: zona de mayor afectación, cerca del epicentro.
//  - feltRadiusKm: hasta dónde aproximadamente se llega a sentir (más amplio).
// Los cinco matices van de coral claro (magnitud baja) a carmesí profundo (alta).

export type MagBand = {
  min: number;
  color: string; // matiz de rojo
  label: string;
  zoneRadiusKm: number; // afectación fuerte
  feltRadiusKm: number; // alcance percibido
};

// Escala alineada con las variables --r1..--r5 de styles.css
export const MAG_BANDS: MagBand[] = [
  { min: 7.0, color: "#6E0E0A", label: "Mayor", zoneRadiusKm: 162, feltRadiusKm: 468 },
  { min: 6.0, color: "#9E1B12", label: "Fuerte", zoneRadiusKm: 120, feltRadiusKm: 350 },
  { min: 5.0, color: "#CC2B1D", label: "Moderado", zoneRadiusKm: 70, feltRadiusKm: 200 },
  { min: 4.0, color: "#E5603A", label: "Ligero", zoneRadiusKm: 35, feltRadiusKm: 100 },
  { min: 2.5, color: "#F2A38B", label: "Menor", zoneRadiusKm: 15, feltRadiusKm: 45 },
];

const FAINT = { color: "#7A6F66", label: "Micro", zoneRadiusKm: 6, feltRadiusKm: 18 };

export function bandFor(mag: number): MagBand {
  for (const band of MAG_BANDS) {
    if (mag >= band.min) return band;
  }
  return { min: -Infinity, ...FAINT };
}

export function colorFor(mag: number): string {
  return bandFor(mag).color;
}

// Zona de mayor afectación (círculo interior, sólido).
export function zoneRadiusKm(mag: number): number {
  return bandFor(mag).zoneRadiusKm;
}

// Alcance percibido (círculo exterior, suave).
export function feltRadiusKm(mag: number): number {
  return bandFor(mag).feltRadiusKm;
}

// ¿Tiene este sismo una "zona afectada" que pintar? (descartamos los micro)
export function hasZone(mag: number): boolean {
  return mag >= 2.5;
}

// Radio ajustado por profundidad para la zona de mayor afectación.
// Los valores base se calibraron para foco superficial (≈10 km). La distancia
// hipocentrales la que determina el daño: R_surface = sqrt(R_hypo² - depth²).
// Sismos profundos concentran menos energía cerca de la superficie; muy
// superficiales la concentran más. Mínimo: 20 % del radio base.
export function depthAdjustedZoneRadiusKm(mag: number, depthKm: number): number {
  const base = zoneRadiusKm(mag);
  const REF_DEPTH = 10;
  const rHypo = Math.sqrt(base ** 2 + REF_DEPTH ** 2);
  const rSurface = Math.sqrt(Math.max(0, rHypo ** 2 - depthKm ** 2));
  return Math.max(rSurface, base * 0.2);
}

// Radio ajustado por profundidad para el alcance percibido.
// Los sismos profundos se perciben sobre un área mayor porque las ondas viajan
// por roca sólida con menos atenuación.
export function depthAdjustedFeltRadiusKm(mag: number, depthKm: number): number {
  const base = feltRadiusKm(mag);
  return base * Math.sqrt(1 + depthKm / 50);
}
