import { supabase } from '@/lib/customSupabaseClient';

/**
 * Single source of truth for POS sales across every store vertical.
 * Always creates the order and inserts order_items — stock is NOT
 * touched here on purpose: the existing DB trigger
 * on_order_item_created_update_stock already does
 * `products.stock = stock - NEW.quantity` for every order_items row,
 * unconditionally (confirmed via pg_get_functiondef). Decrementing it
 * again here was double-subtracting on every POS sale with a tracked
 * stock item.
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

        return order;
    },
};
