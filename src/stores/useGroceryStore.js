import { create } from 'zustand';
import { storeService } from '@/services/storeService';
import { createCartSlice } from './createCartSlice';

export const useGroceryStore = create((set, get) => ({
    // Store State
    products: [],
    isLoadingProducts: false,
    error: null,

    ...createCartSlice(set, get, {
        defaultStatus: 'Entregado',
        onCheckoutComplete: (get, storeId) => get().fetchProducts(storeId),
    }),

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
}));
