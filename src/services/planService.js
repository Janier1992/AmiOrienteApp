import { supabase } from '@/lib/customSupabaseClient';
import { FALLBACK_PLANS } from '@/config/plans';

/**
 * Planes y comisiones. La tabla `plans` es la fuente de verdad; si no se puede
 * leer (sin red, migración pendiente) se muestran los valores de respaldo para
 * que la página de precios nunca quede vacía.
 */
export const planService = {
  async listarPlanes() {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('id, name, description, price_cop, commission_percent, max_team_members, features, sort_order')
        .order('sort_order', { ascending: true });
      if (error || !data || data.length === 0) return FALLBACK_PLANS;
      return data;
    } catch {
      return FALLBACK_PLANS;
    }
  },

  /** Plan vigente del negocio, su comisión y cuántas personas hay en el equipo. */
  async obtenerPlanDelNegocio(storeId) {
    const { data, error } = await supabase.rpc('get_store_plan_info', { p_store_id: storeId });
    if (error) throw new Error(error.message || 'No se pudo cargar el plan del negocio.');
    return Array.isArray(data) ? data[0] || null : data;
  },

  /** Solo administrador de la plataforma. */
  async cambiarPlanDelNegocio(storeId, planId) {
    const { error } = await supabase.rpc('admin_set_store_plan', { p_store_id: storeId, p_plan_id: planId });
    if (error) throw new Error(error.message || 'No se pudo cambiar el plan.');
  },
};
