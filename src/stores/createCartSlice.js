import { posService } from '@/services/posService';

/**
 * Shared cart + checkout logic for every POS-enabled store vertical.
 * Spread this into a zustand store's creator alongside any
 * vertical-specific state/actions (products, crops, rooms, tables, etc).
 *
 * options:
 *   - defaultStatus: order status to set on checkout (default 'Entregado')
 *   - onCheckoutComplete(get, storeId): optional hook run after a
 *     successful sale (e.g. refresh products/crops in the same store)
 */
export const createCartSlice = (set, get, { defaultStatus = 'Entregado', onCheckoutComplete } = {}) => ({
    cart: [],
    isLoadingCheckout: false,

    addToCart: (product) => {
        const currentCart = get().cart;
        const existing = currentCart.find(p => p.id === product.id);

        if (existing) {
            if (product.stock !== undefined && existing.qty >= product.stock) return false;
            set({
                cart: currentCart.map(p => p.id === product.id ? { ...p, qty: p.qty + 1 } : p),
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
                    if (delta > 0 && item.stock !== undefined && newQty > item.stock) return item;
                    return { ...item, qty: newQty };
                }
                return item;
            }),
        }));
    },

    clearCart: () => set({ cart: [] }),

    processCheckout: async (storeId, customerData, paymentMethod, total) => {
        const cart = get().cart;
        if (cart.length === 0) return;

        const guestInfo = typeof customerData === 'object' ? {
            name: customerData.name,
            doc_id: customerData.docId,
            phone: customerData.phone,
            email: customerData.email,
            method: paymentMethod,
            type: 'POS',
        } : {
            name: customerData,
            method: paymentMethod,
            type: 'POS',
        };

        set({ isLoadingCheckout: true });
        try {
            await posService.createPOSSale({ storeId, cart, guestInfo, total, status: defaultStatus });
            get().clearCart();
            if (onCheckoutComplete) await onCheckoutComplete(get, storeId);
            return true;
        } catch (error) {
            throw error;
        } finally {
            set({ isLoadingCheckout: false });
        }
    },
});
