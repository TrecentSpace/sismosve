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
  { min: 7.0, color: "#6E0E0A", label: "Mayor", zoneRadiusKm: 180, feltRadiusKm: 520 },
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
