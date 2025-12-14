import { supabase } from '@/lib/customSupabaseClient';

export const stationeryService = {
    // POS Transaction
    async createPOSTransaction(transactionData) {
        const { orderPayload, items } = transactionData;

        // 1. Create Order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert(orderPayload)
            .select()
            .single();

        if (orderError) throw orderError;

        // 2. Update Stock (Sequential for consistency)
        // In production, this should be a DB function/RPC
        for (const item of items) {
            const newStock = Math.max(0, item.stock - item.qty);
            await supabase.from('products').update({ stock: newStock }).eq('id', item.id);
        }

        return order;
    }
};
