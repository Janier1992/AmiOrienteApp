import { supabase } from '@/lib/customSupabaseClient';

/**
 * SERVICIO ESPECÍFICO PARA RESTAURANTES
 */
export const restaurantService = {
    async getTables(storeId) {
        const { data, error } = await supabase
            .from('restaurant_tables')
            .select('*')
            .eq('store_id', storeId)
            .order('number');
        if (error) throw error;
        return data;
    },

    async createTable(tableData) {
        const { data, error } = await supabase
            .from('restaurant_tables')
            .insert(tableData)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateTableStatus(tableId, status) {
        const { error } = await supabase
            .from('restaurant_tables')
            .update({ status })
            .eq('id', tableId);
        if (error) throw error;
    }
};
