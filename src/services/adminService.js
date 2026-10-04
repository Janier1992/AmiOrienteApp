
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Operaciones exclusivas del panel de super-administrador de la
 * plataforma. Todo aquí depende de que profiles.role = 'admin' para el
 * usuario autenticado (ver database_updates/20261003_platform_admin.sql).
 */
export const adminService = {
    async esAdmin(userId) {
        if (!userId) return false;
        const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('[adminService] Error verificando rol de admin:', error);
            return false;
        }
        return data?.role === 'admin';
    },

    async obtenerTodasLasTiendas() {
        const { data, error } = await supabase
            .from('stores')
            .select(`
                id,
                name,
                category,
                status,
                created_at,
                owner_id,
                disabled_modules,
                service_categories ( name ),
                profiles:owner_id ( full_name, email, phone )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[adminService] Error obteniendo tiendas:', error);
            return [];
        }
        return data || [];
    },

    async actualizarEstadoTienda(storeId, status) {
        const { data, error } = await supabase
            .from('stores')
            .update({ status })
            .eq('id', storeId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Oculta/muestra módulos del dashboard de una tienda (ver Panel de
     * Administración > Módulos). disabledModules es la lista completa de
     * claves ocultas (reemplaza la anterior, no la mezcla).
     */
    async actualizarModulosTienda(storeId, disabledModules) {
        const { data, error } = await supabase
            .from('stores')
            .update({ disabled_modules: disabledModules })
            .eq('id', storeId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },
};

export default adminService;
