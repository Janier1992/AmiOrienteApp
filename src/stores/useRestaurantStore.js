import { create } from 'zustand';
import { restaurantService } from '@/services/restaurantService';
import { storeService } from '@/services/storeService';
import { createCartSlice } from './createCartSlice';

/**
 * STORE ESPECÍFICO PARA RESTAURANTE
 * Maneja mesas (y futuro KDS/Cocina)
 */
export const useRestaurantStore = create((set, get) => ({
    tables: [],
    products: [], // Added for POS
    isLoadingTables: false,
    error: null,

    ...createCartSlice(set, get, {
        defaultStatus: 'Entregado', // Instant handover
    }),

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
    },
}));
