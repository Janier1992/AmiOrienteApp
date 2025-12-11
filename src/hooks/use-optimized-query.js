
import { useState, useEffect, useRef } from 'react';
import { apiCache } from '@/lib/request-cache';

/**
 * A hook that caches async results to prevent re-fetching on navigation.
 * Similar to React Query but lightweight.
 * 
 * @param {string} key - Unique cache key
 * @param {Function} fetcher - Async function to fetch data
 * @param {object} options - { ttl: number, enabled: boolean }
 */
export function useOptimizedQuery(key, fetcher, options = {}) {
  const { ttl = 300000, enabled = true } = options;
  const [data, setData] = useState(() => apiCache.get(key));
  const [loading, setLoading] = useState(!apiCache.get(key));
  const [error, setError] = useState(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    // Check cache first
    const cached = apiCache.get(key);
    if (cached) {
      setData(cached);
      setLoading(false);
      return; // Skip fetch if cached
    }

    let isMounted = true;
    setLoading(true);

    fetcher()
      .then(result => {
        if (isMounted) {
          apiCache.set(key, result, ttl);
          setData(result);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          console.error(`[Query Error] ${key}:`, err);
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [key, enabled, ttl]); // Dependency array ensures re-fetch if key changes

  return { data, loading, error };
}
