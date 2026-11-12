/**
 * Genera el Caddyfile del servidor propio (VPS) a partir de `vercel.json`, para que los encabezados de
 * seguridad y la política de contenido (CSP) tengan UNA sola fuente y no se desfasen entre Vercel y el VPS.
 *
 * Con Supabase autoalojado, la app habla con `https://api.<dominio>` en lugar de `*.supabase.co`, así que la
 * CSP se reescribe con el dominio real de la API.
 */

const ORIGENES_SUPABASE_NUBE = 'https://*.supabase.co wss://*.supabase.co';

const comillas = (texto) => `"${texto.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

/** Encabezados de `vercel.json` listos para el VPS (la CSP apunta a la API propia). */
export const encabezadosParaVps = (vercelJson, dominioApi) => {
  const entradas = vercelJson.headers?.[0]?.headers ?? [];
  if (!entradas.length) throw new Error('vercel.json no define encabezados de seguridad.');
  return entradas.map(({ key, value }) => {
    if (key !== 'Content-Security-Policy') return [key, value];
    if (!value.includes(ORIGENES_SUPABASE_NUBE)) throw new Error('La CSP de vercel.json ya no incluye los orígenes de Supabase esperados.');
    return [key, value.replace(ORIGENES_SUPABASE_NUBE, `https://${dominioApi} wss://${dominioApi}`)];
  });
};

/**
 * @param {object} opciones
 * @param {string} opciones.dominioApp Dominio público de la app (p. ej. `app.cliente.co`); `:8080` sirve en HTTP para pruebas.
 * @param {string} opciones.dominioApi Dominio público de la API de Supabase (p. ej. `api.cliente.co`).
 * @param {object} opciones.vercelJson Contenido de `vercel.json`.
 * @param {string} [opciones.destinoApi] Servicio interno que atiende la API (por defecto el gateway Kong de Supabase).
 */
export const generarCaddyfile = ({ dominioApp, dominioApi, vercelJson, destinoApi = 'kong:8000' }) => {
  if (!dominioApp || !dominioApi) throw new Error('Se requieren dominioApp y dominioApi.');
  const encabezados = encabezadosParaVps(vercelJson, dominioApi);
  const lineasEncabezado = encabezados.map(([clave, valor]) => `\t\t${clave} ${comillas(valor)}`).join('\n');

  return `# Generado por deploy/generar-caddyfile.js a partir de vercel.json. No editar a mano: volver a generar.
{
\temail {$ACME_EMAIL}
}

${dominioApp} {
\troot * /srv/app
\tencode zstd gzip
\theader {
\t\t-Server
${lineasEncabezado}
\t}
\t@estaticos path /assets/*
\theader @estaticos Cache-Control "public, max-age=31536000, immutable"
\t@sinCache path /index.html /sw.js /registerSW.js /manifest.webmanifest
\theader @sinCache Cache-Control "no-cache"
\ttry_files {path} /index.html
\tfile_server
}

${dominioApi} {
\tencode zstd gzip
\theader {
\t\t-Server
\t\tStrict-Transport-Security "max-age=31536000; includeSubDomains"
\t\tX-Content-Type-Options "nosniff"
\t}
\treverse_proxy ${destinoApi}
}
`;
};
