
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Simple performance monitoring utility
export const reportWebVitals = (metric) => {
  // In a real app, send to analytics endpoint
  // console.log(metric); 
};

export const measureInteraction = (name) => {
  const start = performance.now();
  return () => {
    const duration = performance.now() - start;
    if (duration > 1000) {
      console.warn(`[Performance] Slow interaction in ${name}: ${duration.toFixed(2)}ms`);
    }
  };
};

// Hook to track route transition time
export const useRouteTransitionTimer = () => {
  const location = useLocation();
  const startTime = useRef(performance.now());

  useEffect(() => {
    const duration = performance.now() - startTime.current;
    // Reset for next navigation
    startTime.current = performance.now();
  }, [location]);
};
