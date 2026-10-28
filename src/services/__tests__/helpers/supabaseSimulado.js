import { vi } from 'vitest';

/**
 * Supabase simulado para pruebas de servicios.
 *
 * Imita la cadena de consulta (`from(...).select(...).eq(...)`) y registra cada paso para
 * poder comprobar QUÉ se pidió, además de lo que se devuelve. La respuesta se configura
 * por tabla con `responder(tabla, { data, error })`; `await` sobre cualquier punto de la
 * cadena la entrega, igual que el cliente real.
 */
export const crearSupabaseSimulado = () => {
  const consultas = [];
  const respuestas = {};

  const from = (tabla) => {
    const consulta = { tabla, pasos: [] };
    consultas.push(consulta);
    const cadena = new Proxy({}, {
      get: (_, nombre) => {
        if (nombre === 'then') {
          return (resolver, rechazar) =>
            Promise.resolve(respuestas[tabla] ?? { data: [], error: null }).then(resolver, rechazar);
        }
        return (...args) => {
          consulta.pasos.push([nombre, ...args]);
          return cadena;
        };
      },
    });
    return cadena;
  };

  return {
    supabase: { from, rpc: vi.fn() },
    consultas,
    responder: (tabla, respuesta) => { respuestas[tabla] = respuesta; },
    /** Argumentos del primer paso con ese nombre en la última consulta a la tabla. */
    paso: (tabla, nombre) => {
      const ultima = [...consultas].reverse().find((c) => c.tabla === tabla);
      return ultima?.pasos.find((p) => p[0] === nombre)?.slice(1);
    },
    reiniciar: () => { consultas.length = 0; Object.keys(respuestas).forEach((k) => delete respuestas[k]); },
  };
};
