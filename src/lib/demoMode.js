/**
 * Modo demostración.
 *
 * Con VITE_DEMO_MODE=true la app completa listados vacíos con datos de ejemplo
 * (src/data/sample-data.js) para mostrarla en presentaciones sin negocios
 * reales. En producción NO debe activarse: un cliente real nunca debe ver
 * negocios ni lugares que no existen.
 */
export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
