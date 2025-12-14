import { create } from 'zustand';
import { pharmacyService } from '@/services/pharmacyService';

export const usePharmacyStore = create((set, get) => ({
    products: [],
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
