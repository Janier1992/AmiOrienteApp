import { create } from 'zustand';
import { storeService } from '@/services/storeService';
import { createCartSlice } from './createCartSlice';
import { useStoreDashboard } from './useStoreDashboard';

export const useStationeryStore = create((set, get) => ({
    // GenericPOSView lee `products` y `fetchProducts` del store de cada vertical;
    // sin ellos el Punto de Venta de Papelería se caía al montarse.
    products: [],
    isLoadingProducts: false,
    error: null,

    ...createCartSlice(set, get, {
        defaultStatus: 'Entregado',
        onCheckoutComplete: (get, storeId) => {
            get().fetchProducts(storeId);
            // Mantener sincronizado el catálogo del dashboard (stock actualizado)
            useStoreDashboard.getState().fetchProducts(storeId, true);
        },
    }),

    fetchProducts: async (storeId) => {
        set({ isLoadingProducts: true });
        try {
            const products = await storeService.obtenerProductos(storeId);
            set({ products: products || [] });
        } catch (error) {
            console.error(error);
            set({ error: error.message });
        } finally {
            set({ isLoadingProducts: false });
        }
    },
}));
