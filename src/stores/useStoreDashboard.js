
import { create } from 'zustand';
import { storeService } from '@/services/storeService';
import { supabase } from '@/lib/customSupabaseClient';

// Cache duration: 2 minutes
const CACHE_DURATION = 120000;

export const useStoreDashboard = create((set, get) => ({
  store: null,
  stats: null,
  orders: [],
  products: [],

  // Granular Loading States
  isLoadingStore: false,
  isLoadingStats: false,
  isLoadingOrders: false,
  isLoadingProducts: false,

  error: null,

  // Cache timestamps
  lastFetch: {
    stats: 0,
    orders: 0,
    products: 0
  },

  setStore: (store) => set({ store }),

  fetchStoreData: async (userId) => {
    // Prevent infinite loops or redundant fetches
    const currentStore = get().store;
    if (currentStore && currentStore.owner_id === userId) return;

    set({ isLoadingStore: true, error: null });

    // Safety timeout to prevent infinite loading screen
    const timeoutId = setTimeout(() => {
      if (get().isLoadingStore) {
        set({ isLoadingStore: false, error: "Tiempo de espera agotado. Por favor recarga la página." });
      }
    }, 15000);

    try {
      // DIRECT SUPABASE QUERY: More reliable than service layer for critical initial load
      // Uses maybeSingle() to return null instead of throwing error if no store found
      // Uses maybeSingle() to return null instead of throwing error if no store found
      const store = await storeService.getStoreByOwner(userId);


      clearTimeout(timeoutId);
      set({ store });

      // Load secondary data in background without blocking UI
      if (store) {
        get().fetchStats(store.id);
      }
    } catch (error) {
      console.error("Store fetch error:", error);
      clearTimeout(timeoutId);
      set({ error: "No se pudo cargar la información del negocio." });
    } finally {
      // Critical: Ensure loading is ALWAYS turned off
      set({ isLoadingStore: false });
    }
  },

  fetchStats: async (storeId, force = false) => {
    const now = Date.now();
    if (!force && now - get().lastFetch.stats < CACHE_DURATION && get().stats) return;

    set({ isLoadingStats: true });
    try {
      // Try service first, fallback to safer parallel queries if needed
      const [stats, monthlyIncome] = await Promise.all([
        storeService.getStoreStats(storeId).catch(() => ({})), // Catch individual failures
        storeService.getMonthlyIncome(storeId).catch(() => [])
      ]);

      set(state => ({
        stats: { ...stats, monthlyIncome },
        lastFetch: { ...state.lastFetch, stats: now }
      }));
    } catch (error) {
      console.error("Stats error", error);
    } finally {
      set({ isLoadingStats: false });
    }
  },

  fetchOrders: async (storeId, force = false) => {
    const now = Date.now();
    if (!force && now - get().lastFetch.orders < CACHE_DURATION && get().orders.length > 0) return;

    set({ isLoadingOrders: true });
    try {
      const orders = await storeService.getOrders(storeId);
      set(state => ({
        orders,
        lastFetch: { ...state.lastFetch, orders: now }
      }));
    } catch (error) {
      console.error("Orders fetch error:", error);
    } finally {
      set({ isLoadingOrders: false });
    }
  },

  fetchProducts: async (storeId, force = false) => {
    const now = Date.now();
    if (!force && now - get().lastFetch.products < CACHE_DURATION && get().products.length > 0) return;

    set({ isLoadingProducts: true });
    try {
      const products = await storeService.getProducts(storeId);
      set(state => ({
        products,
        lastFetch: { ...state.lastFetch, products: now }
      }));
    } catch (error) {
      console.error("Products fetch error:", error);
    } finally {
      set({ isLoadingProducts: false });
    }
  },

  updateOrderStatus: async (orderId, status) => {
    try {
      await storeService.updateOrderStatus(orderId, status);
      set(state => ({
        orders: state.orders.map(o => o.id === orderId ? { ...o, status } : o)
      }));
    } catch (error) {
      throw error;
    }
  },

  addProduct: async (productData) => {
    try {
      const data = await storeService.createProduct(productData);

      set(state => ({
        products: [data, ...state.products],
        stats: state.stats ? { ...state.stats, total_products: Number(state.stats?.total_products || 0) + 1 } : state.stats
      }));
      return data;
    } catch (error) {
      throw error;
    }
  },

  deleteProduct: async (productId) => {
    try {
      await storeService.deleteProduct(productId);

      set(state => ({
        products: state.products.filter(p => p.id !== productId),
        stats: state.stats ? { ...state.stats, total_products: Number(state.stats?.total_products || 0) - 1 } : state.stats
      }));
    } catch (error) {
      throw error;
    }
  },

  updateProduct: async (productId, updates) => {
    try {
      const data = await storeService.updateProduct(productId, updates);
      set(state => ({
        products: state.products.map(p => p.id === productId ? data : p)
      }));
      return data;
    } catch (error) {
      throw error;
    }
  }
}));
