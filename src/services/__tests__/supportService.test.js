import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mock as m } from './_supabaseMock';
import { supportService } from '../supportService';

vi.mock('@/lib/customSupabaseClient', async () => ({ supabase: (await import('./_supabaseMock')).mock.supabase }));

beforeEach(() => { m.estado.calls.length = 0; m.estado.user = { id: 'u1' }; m.estado.result = { data: [], error: null }; vi.spyOn(console, 'error').mockImplementation(() => {}); });

describe('supportService', () => {
  it('crearTicket exige sesión', async () => {
    m.estado.user = null;
    await expect(supportService.crearTicket({ subject: 'a', message: 'b' })).rejects.toThrow('iniciar sesión');
  });
  it('crearTicket guarda al autor y tienda nula si no se indica', async () => {
    m.estado.result = { data: { id: 't1' }, error: null };
    await supportService.crearTicket({ subject: 'Hola', message: 'Ayuda' });
    expect(m.estado.calls).toContainEqual(['insert', { created_by: 'u1', store_id: null, subject: 'Hola', message: 'Ayuda' }]);
  });
  it('crearTicket propaga el error de la base de datos', async () => {
    m.estado.result = { data: null, error: new Error('rls') };
    await expect(supportService.crearTicket({ subject: 'a', message: 'b' })).rejects.toThrow('rls');
  });
  it('obtenerMisTickets filtra por autor y devuelve [] si falla', async () => {
    m.estado.result = { data: [{ id: 't1' }], error: null };
    expect(await supportService.obtenerMisTickets('u1')).toEqual([{ id: 't1' }]);
    expect(m.estado.calls).toContainEqual(['eq', 'created_by', 'u1']);
    m.estado.result = { data: null, error: { message: 'x' } };
    expect(await supportService.obtenerMisTickets('u1')).toEqual([]);
  });
  it('obtenerTodosLosTickets devuelve [] ante error', async () => {
    m.estado.result = { data: null, error: { message: 'x' } };
    expect(await supportService.obtenerTodosLosTickets()).toEqual([]);
  });
  it('actualizarTicket envía estado, respuesta y fecha de actualización', async () => {
    m.estado.result = { data: { id: 't1' }, error: null };
    await supportService.actualizarTicket('t1', { status: 'closed', admin_response: 'Listo' });
    const upd = m.estado.calls.find((c) => c[0] === 'update')[1];
    expect(upd.status).toBe('closed');
    expect(upd.admin_response).toBe('Listo');
    expect(new Date(upd.updated_at).getTime()).not.toBeNaN();
  });
});
