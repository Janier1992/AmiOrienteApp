import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generarCaddyfile, encabezadosParaVps } from '../../deploy/caddyfile.js';

const vercelJson = JSON.parse(readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf8'));
const generar = (extra = {}) => generarCaddyfile({ dominioApp: 'app.cliente.co', dominioApi: 'api.cliente.co', vercelJson, ...extra });

describe('Caddyfile del VPS', () => {
  it('reescribe la CSP para que apunte a la API propia y no a supabase.co', () => {
    const csp = encabezadosParaVps(vercelJson, 'api.cliente.co').find(([k]) => k === 'Content-Security-Policy')[1];
    expect(csp).toContain('connect-src');
    expect(csp).toContain('https://api.cliente.co wss://api.cliente.co');
    expect(csp).not.toContain('supabase.co');
  });

  it('conserva todos los demás encabezados de seguridad de vercel.json', () => {
    const claves = encabezadosParaVps(vercelJson, 'api.cliente.co').map(([k]) => k);
    expect(claves).toEqual(vercelJson.headers[0].headers.map((h) => h.key));
    const texto = generar();
    ['X-Frame-Options', 'Strict-Transport-Security', 'Permissions-Policy', 'X-Content-Type-Options'].forEach((k) => expect(texto).toContain(k));
  });

  it('sirve la app con respaldo a index.html (rutas con #) y la API detrás de Kong', () => {
    const texto = generar();
    expect(texto).toContain('app.cliente.co {');
    expect(texto).toContain('try_files {path} /index.html');
    expect(texto).toContain('api.cliente.co {');
    expect(texto).toContain('reverse_proxy kong:8000');
  });

  it('cachea los archivos con hash y nunca el service worker ni index.html', () => {
    const texto = generar();
    expect(texto).toMatch(/@estaticos path \/assets\/\*\n\theader @estaticos Cache-Control "public, max-age=31536000, immutable"/);
    expect(texto).toMatch(/@sinCache path \/index\.html \/sw\.js/);
  });

  it('falla de forma clara si faltan dominios o si cambió la CSP esperada', () => {
    expect(() => generarCaddyfile({ dominioApp: '', dominioApi: 'x', vercelJson })).toThrow(/dominioApp/);
    const sinSupabase = JSON.parse(JSON.stringify(vercelJson));
    sinSupabase.headers[0].headers = sinSupabase.headers[0].headers.map((h) => (h.key === 'Content-Security-Policy' ? { ...h, value: "default-src 'self'" } : h));
    expect(() => generar({ vercelJson: sinSupabase })).toThrow(/orígenes de Supabase/);
  });
});
