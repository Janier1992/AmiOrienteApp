import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mock as m } from './_supabaseMock';
import { FALLBACK_PLANS } from '@/config/plans';
import { planService } from '../planService';

vi.mock('@/lib/customSupabaseClient', async () => ({ supabase: (await import('./_supabaseMock')).mock.supabase }));

beforeEach(() => { m.estado.calls.length = 0; m.estado.result = { data: [], error: null }; m.estado.rpc.mockReset(); });

describe('planService', () => {
  it('listarPlanes usa los planes de la base cuando existen', async () => {
    m.estado.result = { data: [{ id: 'basic' }], error: null };
    expect(await planService.listarPlanes()).toEqual([{ id: 'basic' }]);
  });
  it('listarPlanes cae a los planes de respaldo si hay error o no hay filas', async () => {
    m.estado.result = { data: null, error: { message: 'x' } };
    expect(await planService.listarPlanes()).toBe(FALLBACK_PLANS);
    m.estado.result = { data: [], error: null };
    expect(await planService.listarPlanes()).toBe(FALLBACK_PLANS);
  });
  it('obtenerPlanDelNegocio normaliza arreglo/objeto y lanza el mensaje del servidor', async () => {
    m.estado.rpc.mockResolvedValue({ data: [{ plan_id: 'pro' }], error: null });
    expect(await planService.obtenerPlanDelNegocio('s1')).toEqual({ plan_id: 'pro' });
    m.estado.rpc.mockResolvedValue({ data: [], error: null });
    expect(await planService.obtenerPlanDelNegocio('s1')).toBe(null);
    m.estado.rpc.mockResolvedValue({ data: null, error: { message: 'Sin permiso' } });
    await expect(planService.obtenerPlanDelNegocio('s1')).rejects.toThrow('Sin permiso');
  });
  it('cambiarPlanDelNegocio llama a la función de administrador y propaga errores', async () => {
    m.estado.rpc.mockResolvedValue({ error: null });
    await planService.cambiarPlanDelNegocio('s1', 'pro');
    expect(m.estado.rpc).toHaveBeenCalledWith('admin_set_store_plan', { p_store_id: 's1', p_plan_id: 'pro' });
    m.estado.rpc.mockResolvedValue({ error: {} });
    await expect(planService.cambiarPlanDelNegocio('s1', 'pro')).rejects.toThrow('No se pudo cambiar');
  });
});
