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
    },

    async createPOSTransaction({ orderPayload, items }) {
        // 1. Create Order
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert(orderPayload)
            .select()
            .single();

        if (orderError) throw orderError;

        // 2. Create Order Items
        const orderItems = items.map(item => ({
            order_id: orderData.id,
            product_id: item.id,
            quantity: item.qty,
            price: item.price
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

        if (itemsError) {
            console.error("Error creating items", itemsError);
            throw itemsError;
        }

        // 3. Update Stock (Simulated)
        for (const item of items) {
            if (item.stock !== undefined) {
                const newStock = Math.max(0, item.stock - item.qty);
                await supabase.from('products').update({ stock: newStock }).eq('id', item.id);
            }
        }

        return orderData;
    }
};
