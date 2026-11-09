import { MAP_CONFIG } from '@/config/map';

/**
 * Nombre legible del lugar (municipio, departamento) para unas coordenadas.
 *
 * Usa el servicio de geocodificación configurado (`src/config/map.js`). El servidor público de
 * Nominatim exige no repetir consultas, así que el resultado se guarda en el navegador por zona
 * (coordenadas redondeadas a 2 decimales, unos 1,1 km) durante un día.
 */
const VIGENCIA_MS = 24 * 60 * 60 * 1000;
const claveDe = (lat, lng) => `ami:geo:${lat.toFixed(2)},${lng.toFixed(2)}`;

const leerCache = (clave, ahora) => {
  try {
    const guardado = JSON.parse(localStorage.getItem(clave) || 'null');
    return guardado && ahora - guardado.en < VIGENCIA_MS ? guardado.nombre : null;
  } catch {
    return null;
  }
};

const guardarCache = (clave, nombre, ahora) => {
  try {
    localStorage.setItem(clave, JSON.stringify({ nombre, en: ahora }));
  } catch {
    /* sin almacenamiento: se consulta de nuevo la próxima vez */
  }
};

/** @returns {Promise<string|null>} «Marinilla, Antioquia», o null si no se pudo determinar. */
export const nombreDelLugar = async (lat, lng, { baseUrl = MAP_CONFIG.geocoderUrl, ahora = Date.now() } = {}) => {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const clave = claveDe(lat, lng);
  const enCache = leerCache(clave, ahora);
  if (enCache) return enCache;

  const respuesta = await fetch(
    `${baseUrl}/reverse?format=json&lat=${lat}&lon=${lng}&zoom=12&addressdetails=1`,
    { headers: { 'Accept-Language': 'es' } },
  );
  if (!respuesta.ok) throw new Error(`Geocodificación: HTTP ${respuesta.status}`);
  const direccion = (await respuesta.json())?.address || {};
  const lugar = direccion.city || direccion.town || direccion.village || direccion.municipality || direccion.county;
  if (!lugar) return null;
  const nombre = direccion.state ? `${lugar}, ${direccion.state}` : lugar;
  guardarCache(clave, nombre, ahora);
  return nombre;
};
