import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const config = JSON.parse(readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf8'));
const encabezados = Object.fromEntries(config.headers[0].headers.map((h) => [h.key, h.value]));
const csp = encabezados['Content-Security-Policy'] || '';
const directiva = (nombre) => csp.split(';').map((d) => d.trim()).find((d) => d.startsWith(`${nombre} `)) || '';

describe('encabezados de seguridad (vercel.json)', () => {
  it('la política de contenido se aplica (no solo se reporta)', () => {
    expect(csp).not.toBe('');
    expect(encabezados).not.toHaveProperty('Content-Security-Policy-Report-Only');
  });

  it('no permite scripts en línea, eval ni orígenes externos', () => {
    expect(directiva('script-src')).toBe("script-src 'self'");
    expect(csp).not.toMatch(/unsafe-eval/);
  });

  it('bloquea plugins, marcos externos y cambios de base o formularios', () => {
    expect(directiva('object-src')).toBe("object-src 'none'");
    expect(directiva('frame-ancestors')).toBe("frame-ancestors 'none'");
    expect(directiva('base-uri')).toBe("base-uri 'self'");
    expect(directiva('form-action')).toBe("form-action 'self'");
  });

  it('solo se conecta a la propia app, Supabase y el geocodificador', () => {
    const origenes = directiva('connect-src').split(' ').slice(1);
    expect(origenes).toEqual(["'self'", 'https://*.supabase.co', 'wss://*.supabase.co', 'https://nominatim.openstreetmap.org']);
  });
});
