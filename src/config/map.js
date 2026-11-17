/**
 * Configuración de los mapas.
 *
 * Por defecto se usan los servidores públicos de OpenStreetMap, que sirven para el piloto pero
 * tienen una política de uso (sin tráfico intensivo ni comercial pesado, con atribución). Para
 * producción con volumen, apuntar a un proveedor de teselas comercial o a un servidor propio
 * con las variables de entorno de abajo, sin tocar el código. Si se cambia el origen de las
 * teselas o del geocodificador, hay que añadirlo a `img-src` / `connect-src` de `vercel.json`.
 *
 *   VITE_MAP_TILE_URL          Plantilla de teselas, p. ej. https://tiles.ejemplo.com/{z}/{x}/{y}.png?key=...
 *   VITE_MAP_TILE_ATTRIBUTION  Atribución exigida por el proveedor (HTML permitido).
 *   VITE_GEOCODER_URL          Servicio de geocodificación inversa compatible con Nominatim.
 */
export const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
export const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

const sinVacios = (valor) => (typeof valor === 'string' && valor.trim() ? valor.trim() : undefined);

/** Lee la configuración del entorno; `env` se inyecta para poder probarla. */
export const resolverConfigMapa = (env = import.meta.env) => {
  const tileUrl = sinVacios(env.VITE_MAP_TILE_URL);
  return {
    tileUrl: tileUrl || OSM_TILE_URL,
    // Con teselas propias se exige indicar la atribución; si falta, se conserva la de OpenStreetMap.
    attribution: sinVacios(env.VITE_MAP_TILE_ATTRIBUTION) || OSM_ATTRIBUTION,
    geocoderUrl: (sinVacios(env.VITE_GEOCODER_URL) || NOMINATIM_URL).replace(/\/+$/, ''),
  };
};

export const MAP_CONFIG = resolverConfigMapa();
