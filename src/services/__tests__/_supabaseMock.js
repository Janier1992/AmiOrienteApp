// Ayuda de pruebas: cliente de Supabase simulado con cadena encadenable.
// Cada llamada encadenada se registra en `calls` y el resultado final es `result`.
import { vi } from 'vitest';

export function crearSupabaseMock() {
  const estado = { result: { data: [], error: null }, calls: [], rpc: vi.fn(), user: { id: 'u1' } };
  const metodos = ['select', 'insert', 'update', 'delete', 'eq', 'order', 'single'];
  const cadena = () => {
    const c = { then: (res, rej) => Promise.resolve(estado.result).then(res, rej) };
    metodos.forEach((m) => { c[m] = (...a) => { estado.calls.push([m, ...a]); return c; }; });
    return c;
  };
  const supabase = {
    from: (tabla) => { estado.calls.push(['from', tabla]); return cadena(); },
    rpc: (...a) => estado.rpc(...a),
    auth: { getUser: () => Promise.resolve({ data: { user: estado.user } }) },
  };
  return { supabase, estado };
}

// Instancia compartida entre la prueba y el módulo simulado.
export const mock = crearSupabaseMock();
