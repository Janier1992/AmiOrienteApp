#!/usr/bin/env node
/**
 * Prueba de humo de extremo a extremo (navegador real, Chromium).
 *
 * Qué hace: sirve la compilación con los MISMOS encabezados de vercel.json
 * (incluida la política de contenido), abre las rutas principales y comprueba
 * que cargan, que no hay violaciones de CSP ni errores de consola y que las
 * rutas protegidas no muestran datos sin sesión.
 *
 * Seguridad: toda la red hacia Supabase se SIMULA con page.route; la prueba
 * nunca contacta un backend real ni usa datos reales.
 *
 * Uso (requiere Playwright y Chromium instalados):
 *   VITE_SUPABASE_URL=https://prueba.supabase.co VITE_SUPABASE_ANON_KEY=prueba \
 *     npx vite build --outDir dist-e2e
 *   node tools/e2e/humo.cjs            # usa dist-e2e
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const RAIZ = path.resolve(__dirname, '../..');
const DIST = path.join(RAIZ, process.env.E2E_DIST || 'dist-e2e');
const CABECERAS = Object.fromEntries(
  JSON.parse(fs.readFileSync(path.join(RAIZ, 'vercel.json'), 'utf8')).headers[0].headers.map((h) => [h.key, h.value]));
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon' };

function servir() {
  return new Promise((ok) => {
    const s = http.createServer((req, res) => {
      let p = path.join(DIST, decodeURIComponent(req.url.split('?')[0]));
      if (!p.startsWith(DIST) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) p = path.join(DIST, 'index.html');
      res.writeHead(200, { 'Content-Type': TIPOS[path.extname(p)] || 'application/octet-stream', ...CABECERAS });
      fs.createReadStream(p).pipe(res);
    }).listen(0, '127.0.0.1', () => ok(s));
  });
}

const PUBLICAS = ['/', '/productos', '/servicios', '/turismo', '/precios', '/terminos', '/privacidad', '/centro-de-ayuda', '/contacto', '/datos-personales',
  '/cliente/login', '/cliente/registro', '/tienda/login', '/tienda/registro', '/domiciliario/login', '/domiciliario/registro', '/recuperar-contrasena'];
const PROTEGIDAS = ['/tienda/dashboard', '/cliente/dashboard', '/domiciliario/dashboard', '/admin'];

(async () => {
  if (!fs.existsSync(path.join(DIST, 'index.html'))) { console.error(`No existe ${DIST}. Compila primero (ver encabezado).`); process.exit(2); }
  const server = await servir();
  const base = `http://127.0.0.1:${server.address().port}/#`;
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const resultados = [];
  const registrar = (id, desc, ok, detalle = '') => { resultados.push({ id, desc, ok, detalle }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${desc}${detalle ? '  → ' + detalle : ''}`); };

  async function nuevaPagina(viewport) {
    const ctx = await browser.newContext({ viewport: viewport || { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    const problemas = { csp: [], errores: [], externas: [] };
    await page.route('**/*.supabase.co/**', (r) => {
      const u = r.request().url();
      if (u.includes('/auth/v1/user') || u.includes('/auth/v1/session')) return r.fulfill({ status: 401, contentType: 'application/json', body: '{"msg":"sin sesión"}' });
      return r.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
    await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => {
      if (r.request().url().includes('supabase.co')) return r.fallback();
      problemas.externas.push(r.request().url());
      return r.abort();
    });
    page.on('console', (m) => {
      const t = m.text();
      if (/Content Security Policy|violates the following/i.test(t)) problemas.csp.push(t.slice(0, 200));
      else if (m.type() === 'error' && !/Failed to load resource|net::ERR|supabase|ERR_FAILED/i.test(t)) problemas.errores.push(t.slice(0, 200));
    });
    page.on('pageerror', (e) => problemas.errores.push(String(e).slice(0, 200)));
    return { page, ctx, problemas };
  }

  // TC-NFR-001 / TC-SEC-003: rutas públicas cargan, sin CSP ni errores de JavaScript
  for (const ruta of PUBLICAS) {
    const { page, ctx, problemas } = await nuevaPagina();
    try {
      await page.goto(base + ruta, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(500);
      const texto = (await page.locator('body').innerText()).trim();
      const ok = texto.length > 40 && !/Something went wrong|Algo salió mal/i.test(texto) && problemas.csp.length === 0 && problemas.errores.length === 0;
      registrar('TC-NFR-001', `Ruta pública ${ruta} carga`, ok, ok ? '' : `texto=${texto.length} csp=${problemas.csp.length} errores=${problemas.errores.join(' | ').slice(0, 160)}`);
    } catch (e) { registrar('TC-NFR-001', `Ruta pública ${ruta} carga`, false, String(e).slice(0, 160)); }
    await ctx.close();
  }

  // TC-AUTH-003: rutas protegidas sin sesión no muestran paneles
  for (const ruta of PROTEGIDAS) {
    const { page, ctx } = await nuevaPagina();
    try {
      await page.goto(base + ruta, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(800);
      const url = page.url();
      const texto = await page.locator('body').innerText();
      const muestraPanel = /Mis pedidos|Pedidos en curso|Panel de administración|Ganancias|Productos del negocio/i.test(texto) && !/iniciar sesión|ingresar|login/i.test(texto);
      registrar('TC-AUTH-003', `Sin sesión, ${ruta} no muestra el panel`, !muestraPanel, `url final=${url.split('#')[1]}`);
    } catch (e) { registrar('TC-AUTH-003', `Sin sesión, ${ruta} no muestra el panel`, false, String(e).slice(0, 160)); }
    await ctx.close();
  }

  // TC-NFR-004: móvil (390 px) sin desplazamiento horizontal en pantallas principales
  for (const ruta of ['/', '/productos', '/cliente/login', '/precios']) {
    const { page, ctx } = await nuevaPagina({ width: 390, height: 800 });
    try {
      await page.goto(base + ruta, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(400);
      const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
      registrar('TC-NFR-004', `Móvil 390 px: ${ruta} sin scroll horizontal`, sw <= cw + 1, `scrollWidth=${sw} ancho=${cw}`);
    } catch (e) { registrar('TC-NFR-004', `Móvil 390 px: ${ruta}`, false, String(e).slice(0, 160)); }
    await ctx.close();
  }

  // TC-LEG-001: textos legales visibles
  for (const [ruta, patron] of [['/terminos', /términos/i], ['/privacidad', /datos personales|privacidad/i]]) {
    const { page, ctx } = await nuevaPagina();
    await page.goto(base + ruta, { waitUntil: 'networkidle' });
    const texto = await page.locator('body').innerText();
    registrar('TC-LEG-001', `${ruta} muestra el texto legal`, patron.test(texto) && texto.length > 500, `caracteres=${texto.length}`);
    await ctx.close();
  }

  // TC-SEC-003: la aplicación no pide recursos a dominios no permitidos
  {
    const { page, ctx, problemas } = await nuevaPagina();
    await page.goto(base + '/', { waitUntil: 'networkidle' });
    const permitidas = /fonts\.googleapis\.com|fonts\.gstatic\.com|openstreetmap|basemaps|tile|unpkg|cartocdn|images\.unsplash|unsplash/i;
    const raras = problemas.externas.filter((u) => !permitidas.test(u));
    registrar('TC-SEC-003', 'La portada no solicita dominios fuera de la lista esperada', raras.length === 0, raras.slice(0, 3).join(', '));
    await ctx.close();
  }

  await browser.close(); server.close();
  const fallos = resultados.filter((r) => !r.ok);
  console.log(`\nResumen: ${resultados.length - fallos.length} pasan, ${fallos.length} fallan, ${resultados.length} en total`);
  fs.writeFileSync(path.join(RAIZ, 'dist-e2e', 'resultado-humo.json'), JSON.stringify(resultados, null, 2));
  process.exit(fallos.length ? 1 : 0);
})();
