#!/usr/bin/env node
/**
 * Uso:  node deploy/generar-caddyfile.js --app app.cliente.co --api api.cliente.co > deploy/Caddyfile
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generarCaddyfile } from './caddyfile.js';

const argumento = (nombre) => {
  const i = process.argv.indexOf(`--${nombre}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};

const raiz = resolve(import.meta.dirname, '..');
const vercelJson = JSON.parse(readFileSync(resolve(raiz, 'vercel.json'), 'utf8'));

try {
  process.stdout.write(generarCaddyfile({ dominioApp: argumento('app'), dominioApi: argumento('api'), vercelJson, destinoApi: argumento('destino-api') }));
} catch (error) {
  console.error(`Error: ${error.message}\nUso: node deploy/generar-caddyfile.js --app app.cliente.co --api api.cliente.co`);
  process.exit(1);
}
