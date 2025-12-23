
import { create } from 'zustand';
import { storeService } from '@/services/storeService';
import { supabase } from '@/lib/customSupabaseClient';

export const useGroceryStore = create((set, get) => ({
    // Store State
    products: [],
    cart: [],
    isLoadingProducts: false,
    isLoadingCheckout: false,
    error: null,

    // Actions
    fetchProducts: async (storeId) => {
        set({ isLoadingProducts: true });
        try {
            const products = await storeService.obtenerProductos(storeId);
            set({ products: products || [] });
        } catch (error) {
            set({ error: error.message });
        } finally {
            set({ isLoadingProducts: false });
        }
    },

    addToCart: (product) => {
        const currentCart = get().cart;
        const existing = currentCart.find(p => p.id === product.id);
        if (existing) {
            set({ cart: currentCart.map(p => p.id === product.id ? { ...p, qty: p.qty + 1 } : p) });
        } else {
            set({ cart: [...currentCart, { ...product, qty: 1 }] });
        }
        return true;
    },

    removeFromCart: (pid) => set(s => ({ cart: s.cart.filter(p => p.id !== pid) })),

    updateCartQty: (pid, delta) => set(s => ({
        cart: s.cart.map(i => i.id === pid ? { ...i, qty: Math.max(1, i.qty + delta) } : i)
    })),

    clearCart: () => set({ cart: [] }),

    processCheckout: async (storeId, customerData, paymentMethod, total) => {
        const cart = get().cart;
        if (cart.length === 0) return;

        const guestInfo = typeof customerData === 'object' ? { ...customerData, method: paymentMethod, type: 'POS' } : { name: customerData, method: paymentMethod, type: 'POS' };

        set({ isLoadingCheckout: true });
        try {
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    store_id: storeId,
                    customer_id: null,
                    status: 'Entregado',
                    total: total,
                    delivery_address: JSON.stringify({ guest: guestInfo, items: cart.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })) })
                })
                .select()
                .single();

            if (orderError) throw orderError;

            const items = cart.map(i => ({ order_id: order.id, product_id: i.id, quantity: i.qty, price: i.price }));
            const { error: itemsError } = await supabase.from('order_items').insert(items);
            if (itemsError) throw itemsError;

            // Update Stock
            for (const item of cart) {
                if (item.stock !== undefined) {
                    await storeService.actualizarProducto(item.id, { stock: Math.max(0, item.stock - item.qty) });
                }
            }

            get().clearCart();
            return true;
        } catch (e) {
            throw e;
        } finally {
            set({ isLoadingCheckout: false });
        }
    }
}));
