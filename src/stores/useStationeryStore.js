import { create } from 'zustand';
import { createCartSlice } from './createCartSlice';
import { useStoreDashboard } from './useStoreDashboard'; // Reusing generic fetchProducts for now as products are shared

export const useStationeryStore = create((set, get) => ({
    ...createCartSlice(set, get, {
        defaultStatus: 'Entregado',
        onCheckoutComplete: (get, storeId) => {
            // Refresh products in generic store to show updated stock
            useStoreDashboard.getState().fetchProducts(storeId, true);
        },
    }),
}));
