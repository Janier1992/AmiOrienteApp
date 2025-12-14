import { create } from 'zustand';
import { agroService } from '@/services/agroService';

export const useAgroStore = create((set, get) => ({
    crops: [],
    isLoadingCrops: false,
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
