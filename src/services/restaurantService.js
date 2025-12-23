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

        return orderData;
    }
};
