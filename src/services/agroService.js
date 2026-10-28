import { supabase } from '@/lib/customSupabaseClient';

/**
 * SERVICIO ESPECÍFICO PARA AGRO (CULTIVADORES)
 * Abstrae la lógica de almacenamiento de cultivos (actualmente en tabla products)
 */
export const agroService = {
    async getCrops(storeId) {
        // Fetches products but could filter by category or metadata in future
        // For now, it assumes all products of an Agro store are crops
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('store_id', storeId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform / Parse specific fields if needed
        return data.map(p => ({
            ...p,
            // Helper to extract batch info if stored in description or custom field
            // This abstraction allows moving to a real 'crops' table later without breaking UI
        }));
    },

    async saveCrop(cropData) {
        if (cropData.id) {
            const { data, error } = await supabase
                .from('products')
                .update(cropData)
                .eq('id', cropData.id)
                .select()
                .single();
            if (error) throw error;
            return data;
        } else {
            const { data, error } = await supabase
                .from('products')
                .insert(cropData)
                .select()
                .single();
            if (error) throw error;
            return data;
        }
    },

    async deleteCrop(cropId) {
        const { error } = await supabase.from('products').delete().eq('id', cropId);
        if (error) throw error;
    }
};
