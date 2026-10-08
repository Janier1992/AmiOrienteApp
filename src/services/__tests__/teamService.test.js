import { describe, it, expect, vi, beforeEach } from 'vitest';
import { teamService } from '../teamService';
import { planService } from '../planService';
import { FALLBACK_PLANS } from '@/config/plans';

const mockRpc = vi.fn();
let selectResult = { data: [], error: null };

vi.mock('@/lib/customSupabaseClient', () => ({
  supabase: {
    rpc: (...a) => mockRpc(...a),
    from: () => {
      const chain = {
        select: () => chain,
        eq: () => chain,
        order: () => Promise.resolve(selectResult),
        then: (res) => Promise.resolve(selectResult).then(res),
      };
      return chain;
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  selectResult = { data: [], error: null };
  mockRpc.mockResolvedValue({ data: null, error: null });
});

describe('teamService', () => {
  it('agrega un miembro llamando a la función del servidor', async () => {
    await teamService.agregarMiembro('s1', '  ana@correo.com ', 'admin');
    expect(mockRpc).toHaveBeenCalledWith('add_store_member', { p_store_id: 's1', p_email: 'ana@correo.com', p_role: 'admin' });
  });

  it('valida correo y rol antes de llamar al servidor', async () => {
    await expect(teamService.agregarMiembro('s1', 'no-es-correo')).rejects.toThrow('correo válido');
    await expect(teamService.agregarMiembro('s1', 'a@b.co', 'dueño')).rejects.toThrow('Rol inválido');
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('muestra el mensaje en español que devuelve la base de datos (p. ej. límite del plan)', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'Tu plan Básico permite hasta 2 personas en el equipo.' } });
    await expect(teamService.agregarMiembro('s1', 'a@b.co')).rejects.toThrow('permite hasta 2 personas');
  });

  it('cambia roles y quita miembros mediante las funciones del servidor', async () => {
    await teamService.cambiarRol('s1', 'u1', 'editor');
    expect(mockRpc).toHaveBeenCalledWith('update_store_member_role', { p_store_id: 's1', p_user_id: 'u1', p_role: 'editor' });
    await teamService.quitarMiembro('s1', 'u1');
    expect(mockRpc).toHaveBeenCalledWith('remove_store_member', { p_store_id: 's1', p_user_id: 'u1' });
  });

  it('obtenerMembresias excluye los negocios propios', async () => {
    selectResult = { data: [
      { role: 'admin', stores: { id: 'a', name: 'Mío', owner_id: 'yo' } },
      { role: 'editor', stores: { id: 'b', name: 'Ajeno', owner_id: 'otro' } },
    ], error: null };
    const list = await teamService.obtenerMembresias('yo');
    expect(list.map((m) => m.stores.id)).toEqual(['b']);
  });
});

describe('planService', () => {
  it('si la tabla de planes no responde usa los valores de respaldo', async () => {
    selectResult = { data: null, error: { message: 'relation "plans" does not exist' } };
    expect(await planService.listarPlanes()).toEqual(FALLBACK_PLANS);
  });

  it('usa los planes de la base cuando existen', async () => {
    selectResult = { data: [{ id: 'basic', name: 'Básico', commission_percent: 8 }], error: null };
    const plans = await planService.listarPlanes();
    expect(plans[0].commission_percent).toBe(8);
  });

  it('cambiarPlanDelNegocio llama a la función de administrador', async () => {
    await planService.cambiarPlanDelNegocio('s1', 'pro');
    expect(mockRpc).toHaveBeenCalledWith('admin_set_store_plan', { p_store_id: 's1', p_plan_id: 'pro' });
  });
});
