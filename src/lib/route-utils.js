
import { lazy, useEffect } from 'react';

// Registry to keep track of loaded and preloaded components
const componentCache = new Map();

/**
 * Creates a lazy-loaded component with prefetching capabilities.
 * @param {string} chunkName - Unique identifier for the chunk
 * @param {Function} importFunc - The dynamic import function () => import(...)
 */
export function lazyWithPrefetch(chunkName, importFunc) {
  const Component = lazy(importFunc);
  
  // Store the import function for manual prefetching
  componentCache.set(chunkName, importFunc);
  
  return Component;
}

/**
 * Prefetches routes based on priority using requestIdleCallback
 * @param {string[]} chunkNames - List of chunk names to prefetch
 * @param {'high'|'low'} priority - Priority of prefetching
 */
export function prefetchRoutes(chunkNames, priority = 'low') {
  if (typeof window === 'undefined') return;

  const prefetch = () => {
    chunkNames.forEach(name => {
      const importFunc = componentCache.get(name);
      if (importFunc) {
        // Execute the import to load the chunk into browser cache
        importFunc()
          .then(() => console.debug(`[Prefetch] Loaded: ${name}`))
          .catch(err => console.debug(`[Prefetch] Failed: ${name}`, err));
      }
    });
  };

  if (priority === 'high') {
    // Execute immediately but in next tick to avoid blocking main thread
    setTimeout(prefetch, 0);
  } else {
    // Execute when browser is idle
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(prefetch, { timeout: 2000 });
    } else {
      setTimeout(prefetch, 2000);
    }
  }
}
