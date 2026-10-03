import { supabase } from '@/lib/customSupabaseClient';

/**
 * Single source of truth for POS sales across every store vertical.
 * Always creates the order, inserts order_items (so the commission
 * trigger on order_items fires consistently) and decrements stock for
 * any item that tracks it.
 */
export const posService = {
    async createPOSSale({ storeId, cart, guestInfo, total, status = 'Entregado' }) {
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                store_id: storeId,
                customer_id: null,
                status,
                total,
                delivery_address: JSON.stringify({
                    guest: guestInfo,
                    items: cart.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })),
                }),
            })
            .select()
            .single();

        if (orderError) throw orderError;

        const orderItems = cart.map(i => ({
            order_id: order.id,
            product_id: i.id,
            quantity: i.qty,
            price: i.price,
        }));
        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
        if (itemsError) throw itemsError;

        for (const item of cart) {
            if (item.stock !== undefined) {
                const { error: stockError } = await supabase
                    .from('products')
                    .update({ stock: Math.max(0, item.stock - item.qty) })
                    .eq('id', item.id);
                if (stockError) throw stockError;
            }
        }

        return order;
    },
};
