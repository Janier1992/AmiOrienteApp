import { supabase } from '@/lib/customSupabaseClient';

/** Roles de equipo: 'admin' gestiona el equipo; 'editor' solo opera el negocio. */
export const TEAM_ROLES = {
  admin: 'Administrador',
  editor: 'Colaborador',
};

const MENSAJE_POR_DEFECTO = 'No se pudo completar la acción sobre el equipo.';

/**
 * Las reglas (permisos, límite del plan, dueño intocable) las valida la base de
 * datos en funciones SECURITY DEFINER; aquí solo se llaman y se muestra su
 * mensaje, que ya viene en español.
 */
const llamar = async (fn, params) => {
  const { data, error } = await supabase.rpc(fn, params);
  if (error) throw new Error(error.message || MENSAJE_POR_DEFECTO);
  return data;
};

export const teamService = {
  async obtenerEquipo(storeId) {
    const data = await llamar('get_store_team', { p_store_id: storeId });
    return data || [];
  },

  async agregarMiembro(storeId, email, role = 'editor') {
    const correo = (email || '').trim();
    if (!/^\S+@\S+\.\S+$/.test(correo)) throw new Error('Escribe un correo válido.');
    if (!TEAM_ROLES[role]) throw new Error('Rol inválido.');
    await llamar('add_store_member', { p_store_id: storeId, p_email: correo, p_role: role });
  },

  async cambiarRol(storeId, userId, role) {
    if (!TEAM_ROLES[role]) throw new Error('Rol inválido.');
    await llamar('update_store_member_role', { p_store_id: storeId, p_user_id: userId, p_role: role });
  },

  async quitarMiembro(storeId, userId) {
    await llamar('remove_store_member', { p_store_id: storeId, p_user_id: userId });
  },

  /** Negocios de los que la persona es miembro (sin contar los que es dueña). */
  async obtenerMembresias(userId) {
    const { data, error } = await supabase
      .from('store_members')
      .select('role, stores ( id, name, owner_id )')
      .eq('user_id', userId);
    if (error) return [];
    return (data || []).filter((m) => m.stores && m.stores.owner_id !== userId);
  },
};
