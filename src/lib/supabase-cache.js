
import { create } from 'zustand';

// Simple in-memory cache for Supabase queries to prevent redundant fetching
export const useSupabaseCache = create((set, get) => ({
  cache: {},
  // Cache validity duration (default 5 minutes)
  ttl: 5 * 60 * 1000, 
  
  setCache: (key, data) => set((state) => ({
    cache: {
      ...state.cache,
      [key]: {
        data,
        timestamp: Date.now()
      }
    }
  })),

  getCache: (key) => {
    const entry = get().cache[key];
    if (!entry) return null;
    
    const isExpired = Date.now() - entry.timestamp > get().ttl;
    if (isExpired) {
      // Clean up expired entry (optional, lazy cleanup)
      return null;
    }
    return entry.data;
  },

  clearCache: () => set({ cache: {} })
}));

// Helper to wrap Supabase queries with caching
export const cachedQuery = async (key, queryFn, options = {}) => {
  const { forceRefresh = false } = options;
  
  if (!forceRefresh) {
    const cachedData = useSupabaseCache.getState().getCache(key);
    if (cachedData) return { data: cachedData, error: null, fromCache: true };
  }

  try {
    const { data, error } = await queryFn();
    if (!error && data) {
      useSupabaseCache.getState().setCache(key, data);
    }
    return { data, error, fromCache: false };
  } catch (err) {
    return { data: null, error: err, fromCache: false };
  }
};
