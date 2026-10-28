import { describe, it, expect, vi, beforeEach } from 'vitest';
import { customerService } from '../customerService';

let resultado = { data: [], error: null, count: 0 };
const consola = vi.spyOn(console, 'error').mockImplementation(() => {});

vi.mock('@/lib/customSupabaseClient', () => {
  const cadena = {
    select: () => cadena,
    eq: () => cadena,
    ilike: () => cadena,
    order: () => cadena,
    range: () => Promise.resolve(resultado),
  };
  return { supabase: { from: () => cadena } };
});

beforeEach(() => { consola.mockClear(); });

describe('customerService.getStores', () => {
  it('devuelve los negocios y el total', async () => {
    resultado = { data: [{ id: 's1' }], error: null, count: 1 };
    expect(await customerService.getStores({})).toEqual({ data: [{ id: 's1' }], count: 1 });
  });

  it('una lista vacía es un resultado válido (todavía no hay negocios)', async () => {
    resultado = { data: [], error: null, count: 0 };
    expect(await customerService.getStores({})).toEqual({ data: [], count: 0 });
  });

  it('si la consulta falla lanza el error, para que la pantalla ofrezca «Reintentar»', async () => {
    resultado = { data: null, error: new Error('Failed to fetch'), count: null };
    await expect(customerService.getStores({})).rejects.toThrow('Failed to fetch');
    expect(consola).toHaveBeenCalled();
  });
});
