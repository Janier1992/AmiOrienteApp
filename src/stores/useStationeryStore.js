import { create } from 'zustand';
import { stationeryService } from '@/services/stationeryService';
import { useStoreDashboard } from './useStoreDashboard'; // Reusing generic fetchProducts for now as products are shared

export const useStationeryStore = create((set, get) => ({
    cart: [],
    isLoadingCheckout: false,

    // Cart Actions
    addToCart: (product) => {
        const currentCart = get().cart;
        const existing = currentCart.find(p => p.id === product.id);

        if (existing) {
            if (existing.qty >= product.stock) return false; // Stock limit reached
            set({
                cart: currentCart.map(p => p.id === product.id ? { ...p, qty: p.qty + 1 } : p)
            });
        } else {
            set({ cart: [...currentCart, { ...product, qty: 1 }] });
        }
        return true;
    },

    removeFromCart: (productId) => {
        set(state => ({ cart: state.cart.filter(p => p.id !== productId) }));
    },

    updateCartQty: (productId, delta) => {
        set(state => ({
            cart: state.cart.map(item => {
                if (item.id === productId) {
                    const newQty = Math.max(1, item.qty + delta);
                    if (delta > 0 && newQty > item.stock) return item;
                    return { ...item, qty: newQty };
                }
                return item;
            })
        }));
    },

    clearCart: () => set({ cart: [] }),

    // Checkout Action
    processCheckout: async (storeId, customerName, paymentMethod, total) => {
        const cart = get().cart;
        if (cart.length === 0) return;

        set({ isLoadingCheckout: true });
        try {
            // Get store owner ID to use as customer_id for POS sales
            const store = useStoreDashboard.getState().store;
            const ownerId = store?.owner_id;

            if (!ownerId) {
                throw new Error("No se pudo identificar el propietario de la tienda para asignar la venta.");
            }

            const orderPayload = {
                store_id: storeId,
                customer_id: ownerId, // Use owner ID as customer for POS sales
                status: 'Entregado',
                total: total,
                delivery_address: JSON.stringify({
                    guest: { name: customerName, method: paymentMethod, type: 'POS' },
                    items: cart.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price }))
                })
            };

            await stationeryService.createPOSTransaction({ orderPayload, items: cart });

            get().clearCart();
            // Refresh products in generic store to show updated stock
            useStoreDashboard.getState().fetchProducts(storeId, true);

            return true;
        } catch (error) {
            throw error;
        } finally {
            set({ isLoadingCheckout: false });
        }
    }
}));
