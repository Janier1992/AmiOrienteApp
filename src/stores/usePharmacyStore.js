import { create } from 'zustand';
import { pharmacyService } from '@/services/pharmacyService';

export const usePharmacyStore = create((set, get) => ({
    products: [],
    cart: [],
    isLoadingCheckout: false,

    // Cart Actions
    addToCart: (product) => {
        const currentCart = get().cart;
        const existing = currentCart.find(p => p.id === product.id);

        if (existing) {
            if (existing.qty >= product.stock) return false;
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
                status: 'Entregado',
                total: total,
                delivery_address: JSON.stringify({
                    guest: guestInfo,
                    items: cart.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price }))
                })
            };

            // Using generic service call logic here or specific if exists
            await pharmacyService.createPOSTransaction({ orderPayload, items: cart });

            get().clearCart();
            // Optional: refresh products
            get().fetchProducts(storeId);
            return true;
        } catch (error) {
            throw error;
        } finally {
            set({ isLoadingCheckout: false });
        }
    },

    isLoading: false,
    error: null,

    fetchProducts: async (storeId) => {
        set({ isLoading: true, error: null });
        try {
            const data = await pharmacyService.getPharmacyProducts(storeId);
            set({ products: data });
        } catch (err) {
            set({ error: err.message });
        } finally {
            set({ isLoading: false });
        }
    },

    saveProduct: async (productData) => {
        try {
            const savedProduct = await pharmacyService.savePharmacyProduct(productData);
            set(state => {
                const exists = state.products.find(p => p.id === savedProduct.id);
                if (exists) {
                    return { products: state.products.map(p => p.id === savedProduct.id ? savedProduct : p) };
                }
                return { products: [savedProduct, ...state.products] };
            });
            return savedProduct;
        } catch (err) {
            throw err;
        }
    },

    deleteProduct: async (id) => {
        try {
            await pharmacyService.deletePharmacyProduct(id);
            set(state => ({ products: state.products.filter(p => p.id !== id) }));
        } catch (err) {
            throw err;
        }
    }
}));
