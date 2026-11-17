import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mock as m } from './_supabaseMock';
import { adminService } from '../adminService';

vi.mock('@/lib/customSupabaseClient', async () => ({ supabase: (await import('./_supabaseMock')).mock.supabase }));

beforeEach(() => { m.estado.calls.length = 0; m.estado.result = { data: [], error: null }; vi.spyOn(console, 'error').mockImplementation(() => {}); });

describe('adminService', () => {
  it('esAdmin: sin usuario devuelve false sin consultar', async () => {
    expect(await adminService.esAdmin(null)).toBe(false);
    expect(m.estado.calls).toHaveLength(0);
  });
  it('esAdmin: true solo si el rol es admin', async () => {
    m.estado.result = { data: [{ role: 'admin' }], error: null };
    expect(await adminService.esAdmin('u1')).toBe(true);
    m.estado.result = { data: [{ role: 'customer' }], error: null };
    expect(await adminService.esAdmin('u1')).toBe(false);
  });
  it('esAdmin: un error de base de datos nunca concede permisos', async () => {
    m.estado.result = { data: null, error: { message: 'x' } };
    expect(await adminService.esAdmin('u1')).toBe(false);
  });
  it('obtenerTodasLasTiendas: devuelve [] ante error y la lista ante éxito', async () => {
    m.estado.result = { data: null, error: { message: 'x' } };
    expect(await adminService.obtenerTodasLasTiendas()).toEqual([]);
    m.estado.result = { data: [{ id: 's1' }], error: null };
    expect(await adminService.obtenerTodasLasTiendas()).toEqual([{ id: 's1' }]);
  });
  it('actualizarEstadoTienda: devuelve la fila actualizada', async () => {
    m.estado.result = { data: [{ id: 's1', status: 'approved' }], error: null };
    expect(await adminService.actualizarEstadoTienda('s1', 'approved')).toEqual({ id: 's1', status: 'approved' });
    expect(m.estado.calls).toContainEqual(['update', { status: 'approved' }]);
  });
  it('actualizarEstadoTienda: sin filas (RLS bloqueó) explica que la sesión no sirvió', async () => {
    m.estado.result = { data: [], error: null };
    await expect(adminService.actualizarEstadoTienda('s1', 'approved')).rejects.toThrow('no tuvo efecto');
  });
  it('actualizarModulosTienda: reemplaza la lista y propaga errores', async () => {
    m.estado.result = { data: [{ id: 's1' }], error: null };
    await adminService.actualizarModulosTienda('s1', ['pos']);
    expect(m.estado.calls).toContainEqual(['update', { disabled_modules: ['pos'] }]);
    m.estado.result = { data: null, error: new Error('boom') };
    await expect(adminService.actualizarModulosTienda('s1', [])).rejects.toThrow('boom');
  });
});
