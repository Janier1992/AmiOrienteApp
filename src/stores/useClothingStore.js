import { create } from 'zustand';
import { clothingService } from '@/services/clothingService';

export const useClothingStore = create((set, get) => ({
    products: [], // clothing products with parsed variants
    isLoading: false,
    error: null,

    fetchProducts: async (storeId) => {
        set({ isLoading: true, error: null });
        try {
            const data = await clothingService.getClothingProducts(storeId);
            set({ products: data });
        } catch (err) {
            set({ error: err.message });
        } finally {
            set({ isLoading: false });
        }
    },

    saveProduct: async (productData) => {
        try {
            const savedProduct = await clothingService.saveClothingProduct(productData);
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
            await clothingService.deleteClothingProduct(id);
            set(state => ({ products: state.products.filter(p => p.id !== id) }));
        } catch (err) {
            throw err;
        }
    }
}));
