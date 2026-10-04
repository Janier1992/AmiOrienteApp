
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
            .eq('id', userId);

        if (error) {
            console.error('[adminService] Error verificando rol de admin:', error);
            return false;
        }
        return data?.[0]?.role === 'admin';
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
        // .select() (sin .single()) en vez de .select().single(): si RLS
        // bloquea el UPDATE, PostgREST devuelve 200 con data=[] en vez de
        // forzar un 406 "se esperaba exactamente 1 fila" que oculta la causa.
        const { data, error } = await supabase
            .from('stores')
            .update({ status })
            .eq('id', storeId)
            .select();

        if (error) throw error;
        if (!data || data.length === 0) {
            throw new Error('La actualización no tuvo efecto (sesión de administrador inválida o expirada). Cierra sesión y vuelve a entrar.');
        }
        return data[0];
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
            .select();

        if (error) throw error;
        if (!data || data.length === 0) {
            throw new Error('La actualización no tuvo efecto (sesión de administrador inválida o expirada). Cierra sesión y vuelve a entrar.');
        }
        return data[0];
    },
};

export default adminService;
