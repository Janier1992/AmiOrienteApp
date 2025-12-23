import { create } from 'zustand';
import { agroService } from '@/services/agroService';

export const useAgroStore = create((set, get) => ({
    crops: [],
    cart: [], // New Cart
    isLoadingCrops: false,
    isLoadingCheckout: false,
    error: null,

    fetchCrops: async (storeId) => {
        set({ isLoadingCrops: true, error: null });
        try {
            const crops = await agroService.getCrops(storeId);
            set({ crops });
        } catch (err) {
            set({ error: err.message });
        } finally {
            set({ isLoadingCrops: false });
        }
    },

    // Cart Actions
    addToCart: (product) => {
        const currentCart = get().cart;
        const existing = currentCart.find(p => p.id === product.id);

        if (existing) {
            if (product.stock !== undefined && existing.qty >= product.stock) return false;
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
                    if (delta > 0 && item.stock !== undefined && newQty > item.stock) return item;
                    return { ...item, qty: newQty };
                }
                return item;
            })
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
            type: 'POS'
        } : {
            name: customerData,
            method: paymentMethod,
            type: 'POS'
        };

        set({ isLoadingCheckout: true });
        try {
            const orderPayload = {
                store_id: storeId,
                customer_id: null,
                status: 'Confirmado', // Agro orders might need confirmation or "Entregado" if direct sale
                total: total,
                delivery_address: JSON.stringify({
                    guest: guestInfo,
                    items: cart.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price }))
                })
            };

            await agroService.createPOSTransaction({ orderPayload, items: cart });

            get().clearCart();
            // Refresh crops to update stock
            get().fetchCrops(storeId);
            return true;
        } catch (error) {
            throw error;
        } finally {
            set({ isLoadingCheckout: false });
        }
    },

    addCrop: async (cropData) => {
        try {
            const newCrop = await agroService.saveCrop(cropData);
            set(state => ({ crops: [newCrop, ...state.crops] }));
            return newCrop;
        } catch (err) {
            throw err;
        }
    },

    updateCrop: async (cropId, updates) => {
        try {
            const updated = await agroService.saveCrop({ id: cropId, ...updates });
            set(state => ({
                crops: state.crops.map(c => c.id === cropId ? updated : c)
            }));
            return updated;
        } catch (err) {
            throw err;
        }
    },

    deleteCrop: async (cropId) => {
        try {
            await agroService.deleteCrop(cropId);
            set(state => ({ crops: state.crops.filter(c => c.id !== cropId) }));
        } catch (err) {
            throw err;
        }
    }
}));
