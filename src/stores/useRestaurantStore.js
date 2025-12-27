import { create } from 'zustand';
import { restaurantService } from '@/services/restaurantService';
import { storeService } from '@/services/storeService';

/**
 * STORE ESPECÍFICO PARA RESTAURANTE
 * Maneja mesas (y futuro KDS/Cocina)
 */
export const useRestaurantStore = create((set, get) => ({
    tables: [],
    products: [], // Added for POS
    cart: [], // New Cart State
    isLoadingTables: false,
    isLoadingCheckout: false, // New Loading State
    error: null,

    // Cart Actions (Copied from standard)
    addToCart: (product) => {
        const currentCart = get().cart;
        const existing = currentCart.find(p => p.id === product.id);

        if (existing) {
            // Restaurant might not track strict stock for prepared items, but let's keep logic if stock exists
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
                    // Check stock if relevant
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
                status: 'Entregado', // Instant handover
                total: total,
                delivery_address: JSON.stringify({
                    guest: guestInfo,
                    items: cart.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price }))
                })
            };

            await restaurantService.createPOSTransaction({ orderPayload, items: cart });

            get().clearCart();
            // Don't necessarily fetch tables, maybe fetch products if stock tracked?
            return true;
        } catch (error) {
            throw error;
        } finally {
            set({ isLoadingCheckout: false });
        }
    },

    fetchTables: async (storeId) => {
        set({ isLoadingTables: true, error: null });
        try {
            const tables = await restaurantService.getTables(storeId);
            set({ tables });
        } catch (err) {
            set({ error: err.message });
        } finally {
            set({ isLoadingTables: false });
        }
    },

    addTable: async (tableData) => {
        try {
            const newTable = await restaurantService.createTable(tableData);
            set(state => ({ tables: [...state.tables, newTable] }));
            return newTable;
        } catch (err) {
            throw err;
        }
    },

    toggleTableStatus: async (tableId, currentStatus) => {
        const newStatus = currentStatus === 'available' ? 'occupied' : 'available';
        const tables = get().tables;

        // Optimistic update
        set({ tables: tables.map(t => t.id === tableId ? { ...t, status: newStatus } : t) });

        try {
            await restaurantService.updateTableStatus(tableId, newStatus);
        } catch (err) {
            // Revert
            set({ tables });
            throw err;
        }
    },

    fetchProducts: async (storeId) => {
        try {
            const products = await storeService.getProducts(storeId);
            set({ products });
        } catch (error) {
            console.error("Error fetching products for POS:", error);
        }
    }
}));
