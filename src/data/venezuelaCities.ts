// Ciudades de Venezuela con coordenadas geográficas precisas (lat/lon en grados
// decimales, WGS84). Incluye las 23 capitales de estado + Distrito Capital y las
// principales ciudades por población. Fuente de coordenadas: registros
// geográficos públicos (GeoNames / INE). Orden: por población descendente.

export type City = {
  name: string;
  state: string;
  lat: number;
  lon: number;
  pop: number; // población aproximada
  capital?: boolean; // capital de estado / nacional
};

export const VENEZUELA_CITIES: City[] = [
  { name: "Caracas", state: "Distrito Capital", lat: 10.4806, lon: -66.9036, pop: 2245744, capital: true },
  { name: "Maracaibo", state: "Zulia", lat: 10.6545, lon: -71.6406, pop: 1599100, capital: true },
  { name: "Valencia", state: "Carabobo", lat: 10.1620, lon: -68.0077, pop: 1408530, capital: true },
  { name: "Barquisimeto", state: "Lara", lat: 10.0647, lon: -69.3475, pop: 1245823, capital: true },
  { name: "Maracay", state: "Aragua", lat: 10.2469, lon: -67.5958, pop: 1135082, capital: true },
  { name: "Ciudad Guayana", state: "Bolívar", lat: 8.3533, lon: -62.6452, pop: 821000, capital: false },
  { name: "Barcelona", state: "Anzoátegui", lat: 10.1340, lon: -64.6963, pop: 424795, capital: true },
  { name: "Maturín", state: "Monagas", lat: 9.7457, lon: -63.1832, pop: 542259, capital: true },
  { name: "Puerto La Cruz", state: "Anzoátegui", lat: 10.2139, lon: -64.6328, pop: 381762, capital: false },
  { name: "Petare", state: "Miranda", lat: 10.4767, lon: -66.8092, pop: 369000, capital: false },
  { name: "Turmero", state: "Aragua", lat: 10.2278, lon: -67.4733, pop: 363605, capital: false },
  { name: "Ciudad Bolívar", state: "Bolívar", lat: 8.1222, lon: -63.5497, pop: 338812, capital: true },
  { name: "Mérida", state: "Mérida", lat: 8.5897, lon: -71.1561, pop: 330531, capital: true },
  { name: "Cabimas", state: "Zulia", lat: 10.4019, lon: -71.4476, pop: 308000, capital: false },
  { name: "San Cristóbal", state: "Táchira", lat: 7.7669, lon: -72.225, pop: 263765, capital: true },
  { name: "Cumaná", state: "Sucre", lat: 10.4538, lon: -64.1814, pop: 358919, capital: true },
  { name: "Los Teques", state: "Miranda", lat: 10.3447, lon: -67.0428, pop: 252242, capital: true },
  { name: "Barinas", state: "Barinas", lat: 8.6226, lon: -70.2075, pop: 353851, capital: true },
  { name: "Baruta", state: "Miranda", lat: 10.4339, lon: -66.8753, pop: 240755, capital: false },
  { name: "Punto Fijo", state: "Falcón", lat: 11.7180, lon: -70.2017, pop: 277838, capital: false },
  { name: "Guarenas", state: "Miranda", lat: 10.4717, lon: -66.6111, pop: 220000, capital: false },
  { name: "Acarigua", state: "Portuguesa", lat: 9.5597, lon: -69.2019, pop: 210000, capital: false },
  { name: "Coro", state: "Falcón", lat: 11.4045, lon: -69.6734, pop: 195000, capital: true },
  { name: "Guacara", state: "Carabobo", lat: 10.2289, lon: -67.8775, pop: 180000, capital: false },
  { name: "Valera", state: "Trujillo", lat: 9.3169, lon: -70.6039, pop: 152000, capital: false },
  { name: "Guanare", state: "Portuguesa", lat: 9.0417, lon: -69.7486, pop: 192000, capital: true },
  { name: "El Tigre", state: "Anzoátegui", lat: 8.8853, lon: -64.2606, pop: 165000, capital: false },
  { name: "San Felipe", state: "Yaracuy", lat: 10.3403, lon: -68.7411, pop: 170000, capital: true },
  { name: "Carúpano", state: "Sucre", lat: 10.6678, lon: -63.2581, pop: 137000, capital: false },
  { name: "Ocumare del Tuy", state: "Miranda", lat: 10.1131, lon: -66.7789, pop: 130000, capital: false },
  { name: "Charallave", state: "Miranda", lat: 10.2453, lon: -66.8569, pop: 120000, capital: false },
  { name: "Cabudare", state: "Lara", lat: 10.0322, lon: -69.2628, pop: 140000, capital: false },
  { name: "Ejido", state: "Mérida", lat: 8.5450, lon: -71.2386, pop: 100000, capital: false },
  { name: "Trujillo", state: "Trujillo", lat: 9.3669, lon: -70.4356, pop: 53000, capital: true },
  { name: "La Asunción", state: "Nueva Esparta", lat: 11.0333, lon: -63.8628, pop: 38000, capital: true },
  { name: "Porlamar", state: "Nueva Esparta", lat: 10.9577, lon: -63.8489, pop: 130000, capital: false },
  { name: "San Fernando de Apure", state: "Apure", lat: 7.8939, lon: -67.4731, pop: 170000, capital: true },
  { name: "San Juan de los Morros", state: "Guárico", lat: 9.9097, lon: -67.3539, pop: 120000, capital: true },
  { name: "Calabozo", state: "Guárico", lat: 8.9242, lon: -67.4297, pop: 150000, capital: false },
  { name: "Tucupita", state: "Delta Amacuro", lat: 9.0608, lon: -62.0453, pop: 110000, capital: true },
  { name: "Puerto Ayacucho", state: "Amazonas", lat: 5.6639, lon: -67.6236, pop: 95000, capital: true },
  { name: "El Vigía", state: "Mérida", lat: 8.6133, lon: -71.6519, pop: 150000, capital: false },
  { name: "Anaco", state: "Anzoátegui", lat: 9.4308, lon: -64.4633, pop: 130000, capital: false },
  { name: "Upata", state: "Bolívar", lat: 8.0114, lon: -62.4061, pop: 130000, capital: false },
  { name: "Santa Bárbara del Zulia", state: "Zulia", lat: 8.9606, lon: -71.9181, pop: 75000, capital: false },
  { name: "Machiques", state: "Zulia", lat: 10.0664, lon: -72.5575, pop: 100000, capital: false },
  { name: "Carora", state: "Lara", lat: 10.1758, lon: -70.0817, pop: 110000, capital: false },
  { name: "La Guaira", state: "La Guaira", lat: 10.6019, lon: -66.9319, pop: 150000, capital: true },
  { name: "Güigüe", state: "Carabobo", lat: 10.0850, lon: -67.7783, pop: 80000, capital: false },
  { name: "Valle de la Pascua", state: "Guárico", lat: 9.2147, lon: -66.0103, pop: 120000, capital: false },
  { name: "Puerto Cabello", state: "Carabobo", lat: 10.4731, lon: -68.0125, pop: 200000, capital: false },
  { name: "El Limón", state: "Aragua", lat: 10.3050, lon: -67.6394, pop: 110000, capital: false },
];
