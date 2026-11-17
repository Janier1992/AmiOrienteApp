import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mock as m } from './_supabaseMock';
import { agroService } from '../agroService';

vi.mock('@/lib/customSupabaseClient', async () => ({ supabase: (await import('./_supabaseMock')).mock.supabase }));

beforeEach(() => { m.estado.calls.length = 0; m.estado.result = { data: [], error: null }; });

describe('agroService', () => {
  it('getCrops filtra por tienda, ordena y devuelve los productos', async () => {
    m.estado.result = { data: [{ id: 'p1' }], error: null };
    expect(await agroService.getCrops('s1')).toEqual([{ id: 'p1' }]);
    expect(m.estado.calls).toContainEqual(['eq', 'store_id', 's1']);
  });
  it('getCrops propaga el error', async () => {
    m.estado.result = { data: null, error: new Error('x') };
    await expect(agroService.getCrops('s1')).rejects.toThrow('x');
  });
  it('saveCrop inserta si no hay id y actualiza si lo hay', async () => {
    m.estado.result = { data: { id: 'p1' }, error: null };
    await agroService.saveCrop({ name: 'Papa' });
    expect(m.estado.calls.some((c) => c[0] === 'insert')).toBe(true);
    m.estado.calls.length = 0;
    await agroService.saveCrop({ id: 'p1', name: 'Papa' });
    expect(m.estado.calls.some((c) => c[0] === 'update')).toBe(true);
    expect(m.estado.calls).toContainEqual(['eq', 'id', 'p1']);
  });
  it('deleteCrop borra por id y propaga el error', async () => {
    await agroService.deleteCrop('p1');
    expect(m.estado.calls).toContainEqual(['eq', 'id', 'p1']);
    m.estado.result = { data: null, error: new Error('x') };
    await expect(agroService.deleteCrop('p1')).rejects.toThrow('x');
  });
});
