import { describe, it, expect } from 'vitest';
import { resolverConfigMapa, OSM_TILE_URL, OSM_ATTRIBUTION, NOMINATIM_URL } from '../map';

describe('resolverConfigMapa', () => {
  it('usa OpenStreetMap cuando no hay configuración', () => {
    expect(resolverConfigMapa({})).toEqual({ tileUrl: OSM_TILE_URL, attribution: OSM_ATTRIBUTION, geocoderUrl: NOMINATIM_URL });
  });

  it('permite cambiar teselas, atribución y geocodificador desde el entorno', () => {
    const config = resolverConfigMapa({
      VITE_MAP_TILE_URL: ' https://tiles.ejemplo.com/{z}/{x}/{y}.png ',
      VITE_MAP_TILE_ATTRIBUTION: '&copy; Ejemplo',
      VITE_GEOCODER_URL: 'https://geo.ejemplo.com///',
    });
    expect(config).toEqual({ tileUrl: 'https://tiles.ejemplo.com/{z}/{x}/{y}.png', attribution: '&copy; Ejemplo', geocoderUrl: 'https://geo.ejemplo.com' });
  });

  it('ignora valores vacíos y conserva la atribución de OpenStreetMap si falta la nueva', () => {
    const config = resolverConfigMapa({ VITE_MAP_TILE_URL: '   ', VITE_MAP_TILE_ATTRIBUTION: '', VITE_GEOCODER_URL: '' });
    expect(config.tileUrl).toBe(OSM_TILE_URL);
    expect(config.attribution).toBe(OSM_ATTRIBUTION);
    expect(config.geocoderUrl).toBe(NOMINATIM_URL);
  });
});
