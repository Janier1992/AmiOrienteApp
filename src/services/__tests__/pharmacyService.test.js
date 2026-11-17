import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mock as m } from './_supabaseMock';
import { pharmacyService } from '../pharmacyService';

vi.mock('@/lib/customSupabaseClient', async () => ({ supabase: (await import('./_supabaseMock')).mock.supabase }));

beforeEach(() => { m.estado.calls.length = 0; m.estado.result = { data: [], error: null }; });

describe('pharmacyService', () => {
  it('_parseMetadata extrae la ficha del medicamento y limpia la descripción', () => {
    const p = pharmacyService._parseMetadata({ description: 'Analgésico\n\nPHARMA_META: {"batchNumber":"L1","requiresPrescription":true}' });
    expect(p.meta.batchNumber).toBe('L1');
    expect(p.meta.requiresPrescription).toBe(true);
    expect(p.meta.presentation).toBe('Caja');
    expect(p.description).toBe('Analgésico');
  });
  it('_parseMetadata tolera JSON dañado y producto vacío', () => {
    const p = pharmacyService._parseMetadata({ description: 'X\n\nPHARMA_META: {no-json}' });
    expect(p.meta.requiresPrescription).toBe(false);
    expect(pharmacyService._parseMetadata(null)).toBe(null);
  });
  it('savePharmacyProduct guarda la ficha dentro de la descripción', async () => {
    m.estado.result = { data: { id: 'p1', description: 'A\n\nPHARMA_META: {"laboratory":"Lab"}' }, error: null };
    const r = await pharmacyService.savePharmacyProduct({ name: 'A', description: 'A', meta: { laboratory: 'Lab' } });
    const ins = m.estado.calls.find((c) => c[0] === 'insert')[1];
    expect(ins.description).toContain('PHARMA_META: {"laboratory":"Lab"}');
    expect(ins.meta).toBeUndefined();
    expect(r.meta.laboratory).toBe('Lab');
  });
  it('savePharmacyProduct actualiza cuando hay id y propaga errores', async () => {
    m.estado.result = { data: { id: 'p1', description: '' }, error: null };
    await pharmacyService.savePharmacyProduct({ id: 'p1', meta: {} });
    expect(m.estado.calls.some((c) => c[0] === 'update')).toBe(true);
    m.estado.result = { data: null, error: new Error('x') };
    await expect(pharmacyService.savePharmacyProduct({ meta: {} })).rejects.toThrow('x');
  });
  it('getPharmacyProducts devuelve productos con su ficha; deletePharmacyProduct propaga errores', async () => {
    m.estado.result = { data: [{ description: 'A\n\nPHARMA_META: {"batchNumber":"L9"}' }], error: null };
    expect((await pharmacyService.getPharmacyProducts('s1'))[0].meta.batchNumber).toBe('L9');
    m.estado.result = { data: null, error: new Error('x') };
    await expect(pharmacyService.deletePharmacyProduct('p1')).rejects.toThrow('x');
  });
});
