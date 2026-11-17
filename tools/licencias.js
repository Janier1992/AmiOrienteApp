#!/usr/bin/env node
/**
 * Inventario de licencias de las dependencias de producción (las que viajan en el código que
 * descarga el navegador). Uso:  node tools/licencias.js
 *
 * Sale una tabla en Markdown con las dependencias directas, un resumen por licencia y la lista de
 * paquetes cuya licencia no es una de las permisivas habituales (esos hay que revisarlos a mano).
 * Requiere `npm ci` hecho antes.
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PERMISIVAS = /^(MIT|ISC|BSD-2-Clause|BSD-3-Clause|Apache-2\.0|0BSD|MIT-0|BlueOak-1\.0\.0|Unlicense|CC0-1\.0|Python-2\.0|MIT AND ISC)$/;
const raiz = resolve(import.meta.dirname, '..');
const proyecto = JSON.parse(readFileSync(resolve(raiz, 'package.json'), 'utf8'));

const licenciaDe = (paquete) => {
  const l = paquete.license ?? paquete.licenses;
  if (!l) return 'SIN DATO';
  if (typeof l === 'string') return l;
  if (Array.isArray(l)) return l.map((x) => x.type ?? x).join(' OR ');
  return l.type ?? 'SIN DATO';
};

const rutas = execSync('npm ls --omit=dev --all --parseable', { cwd: raiz, maxBuffer: 1e8, stdio: ['ignore', 'pipe', 'ignore'] })
  .toString().trim().split('\n');

const paquetes = new Map();
for (const ruta of rutas) {
  const archivo = resolve(ruta, 'package.json');
  if (!existsSync(archivo) || ruta === raiz) continue;
  const paquete = JSON.parse(readFileSync(archivo, 'utf8'));
  if (paquete.name) paquetes.set(`${paquete.name}@${paquete.version}`, licenciaDe(paquete));
}

const resumen = {};
for (const l of paquetes.values()) resumen[l] = (resumen[l] ?? 0) + 1;

console.log(`Paquetes de producción (directos y transitivos): ${paquetes.size}\n`);
console.log('| Licencia | Paquetes |\n|---|---|');
for (const [l, n] of Object.entries(resumen).sort((a, b) => b[1] - a[1])) console.log(`| ${l} | ${n} |`);

console.log('\n| Dependencia directa | Versión | Licencia |\n|---|---|---|');
for (const nombre of Object.keys(proyecto.dependencies)) {
  const clave = [...paquetes.keys()].find((k) => k.startsWith(`${nombre}@`));
  const [, version = '?'] = clave ? [nombre, clave.slice(nombre.length + 1)] : [];
  console.log(`| ${nombre} | ${version} | ${clave ? paquetes.get(clave) : '?'} |`);
}

const revisar = [...paquetes].filter(([, l]) => !PERMISIVAS.test(l));
console.log(`\nA revisar a mano (${revisar.length}):`);
for (const [nombre, l] of revisar) console.log(`- ${nombre}: ${l}`);
process.exitCode = 0;
