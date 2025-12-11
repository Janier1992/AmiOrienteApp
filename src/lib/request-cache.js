
// Simple in-memory LRU-like cache for API requests
// This helps prevent redundant Supabase/API calls during navigation

const cache = new Map();
const MAX_CACHE_SIZE = 50;
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export const apiCache = {
  get: (key) => {
    const item = cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      cache.delete(key);
      return null;
    }
    
    return item.data;
  },

  set: (key, data, ttl = DEFAULT_TTL) => {
    // Enforce size limit
    if (cache.size >= MAX_CACHE_SIZE) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    cache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
  },

  clear: () => {
    cache.clear();
  },

  remove: (key) => {
    cache.delete(key);
  }
};
