import { describe, it, expect, vi, beforeEach } from 'vitest';
import { nombreDelLugar } from '../reverseGeocode';

const BASE = 'https://geo.ejemplo.com';
const respuesta = (direccion, ok = true, status = 200) => ({ ok, status, json: () => Promise.resolve({ address: direccion }) });

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn());
});

describe('nombreDelLugar', () => {
  it('devuelve «municipio, departamento» y consulta el servicio configurado en español', async () => {
    fetch.mockResolvedValue(respuesta({ town: 'Marinilla', state: 'Antioquia' }));
    expect(await nombreDelLugar(6.1743, -75.3355, { baseUrl: BASE })).toBe('Marinilla, Antioquia');
    const [url, opciones] = fetch.mock.calls[0];
    expect(url).toContain(`${BASE}/reverse?format=json&lat=6.1743&lon=-75.3355`);
    expect(opciones.headers['Accept-Language']).toBe('es');
  });

  it('no repite la consulta para la misma zona durante un día', async () => {
    fetch.mockResolvedValue(respuesta({ city: 'Rionegro', state: 'Antioquia' }));
    const ahora = 1_000_000;
    await nombreDelLugar(6.1500, -75.3700, { baseUrl: BASE, ahora });
    expect(await nombreDelLugar(6.1521, -75.3698, { baseUrl: BASE, ahora: ahora + 3_600_000 })).toBe('Rionegro, Antioquia');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('vuelve a consultar cuando el dato guardado ya venció', async () => {
    fetch.mockResolvedValue(respuesta({ city: 'Guarne' }));
    const ahora = 1_000_000;
    await nombreDelLugar(6.28, -75.44, { baseUrl: BASE, ahora });
    await nombreDelLugar(6.28, -75.44, { baseUrl: BASE, ahora: ahora + 25 * 3_600_000 });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('devuelve null si el servicio no reconoce el lugar o las coordenadas no son válidas, sin consultar', async () => {
    fetch.mockResolvedValue(respuesta({}));
    expect(await nombreDelLugar(0, 0, { baseUrl: BASE })).toBeNull();
    expect(await nombreDelLugar(NaN, 1, { baseUrl: BASE })).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('falla de forma explícita si el servicio responde con error', async () => {
    fetch.mockResolvedValue(respuesta({}, false, 429));
    await expect(nombreDelLugar(6.1, -75.3, { baseUrl: BASE })).rejects.toThrow('HTTP 429');
  });
});
