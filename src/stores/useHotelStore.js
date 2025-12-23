import { create } from 'zustand';
import { supabase } from '@/lib/customSupabaseClient';

/**
 * STORE ESPECÍFICO PARA MÓDULO HOTEL
 * Gestiona habitaciones, reservas y huéspedes.
 */
export const useHotelStore = create((set, get) => ({
    rooms: [],
    products: [], // Added for POS
    cart: [], // Added for POS
    reservations: [],
    guests: [],
    isLoadingRooms: false,
    isLoadingProducts: false,
    isLoadingCheckout: false,
    isLoadingReservations: false,
    error: null,

    // --- ACCIONES DE HABITACIONES ---
    fetchRooms: async (storeId) => {
        if (!storeId) return;
        set({ isLoadingRooms: true });
        try {
            const { data, error } = await supabase
                .from('hotel_rooms')
                .select('*')
                .eq('store_id', storeId)
                .order('number', { ascending: true });

            if (error) throw error;
            set({ rooms: data || [] });
        } catch (err) {
            console.error('Error fetching rooms:', err);
            set({ error: err.message });
        } finally {
            set({ isLoadingRooms: false });
        }
    },

    fetchProducts: async (storeId) => {
        set({ isLoadingProducts: true });
        try {
            // Hotels sell services/products
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('store_id', storeId)
                .order('name');
            if (error) throw error;
            set({ products: data || [] });
        } catch (e) {
            set({ error: e.message });
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
            // 1. Create Order
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

            // 2. Items
            const items = cart.map(i => ({ order_id: order.id, product_id: i.id, quantity: i.qty, price: i.price }));
            const { error: itemsError } = await supabase.from('order_items').insert(items);
            if (itemsError) throw itemsError;

            get().clearCart();
            return true;
        } catch (e) {
            throw e;
        } finally {
            set({ isLoadingCheckout: false });
        }
    },

    toggleRoomStatus: async (roomId, currentStatus) => {
        const states = ['available', 'occupied', 'cleaning', 'maintenance'];
        const nextIdx = (states.indexOf(currentStatus) + 1) % states.length;
        const nextStatus = states[nextIdx];

        try {
            const { error } = await supabase
                .from('hotel_rooms')
                .update({ status: nextStatus })
                .eq('id', roomId);

            if (error) throw error;

            // Optimistic update
            set(state => ({
                rooms: state.rooms.map(r => r.id === roomId ? { ...r, status: nextStatus } : r)
            }));
        } catch (err) {
            console.error('Error toggling room status:', err);
            // Revert or show toast (handled by UI usually)
        }
    },

    addRoom: async (roomData) => {
        try {
            const { data, error } = await supabase
                .from('hotel_rooms')
                .insert(roomData)
                .select()
                .single();

            if (error) throw error;

            set(state => ({ rooms: [...state.rooms, data] }));
            return data;
        } catch (err) {
            throw err;
        }
    },

    // --- ACCIONES DE RESERVAS ---
    // (Simplificado por ahora, se puede expandir)
    fetchReservations: async (storeId) => {
        // Implementación futura o migración de lógica existente
    }
}));
