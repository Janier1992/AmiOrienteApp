import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { createCartStore } from '@/stores/cartStore';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const storeRef = useRef();
  if (!storeRef.current) {
    storeRef.current = createCartStore();
  }
  
  useEffect(() => {
    const cartKey = user ? `cart-storage-${user.id}` : 'cart-storage-guest';
    
    const savedState = localStorage.getItem(cartKey);
    if (savedState) {
      storeRef.current.getState().initialize(JSON.parse(savedState).items);
    } else {
      storeRef.current.getState().initialize([]);
    }

    const unsubscribe = storeRef.current.subscribe(
      (currentState) => {
        localStorage.setItem(cartKey, JSON.stringify({ items: currentState.items }));
      },
      (state) => state.items
    );

    return () => {
      unsubscribe();
    };
  }, [user]);

  return (
    <CartContext.Provider value={storeRef.current}>
      {children}
    </CartContext.Provider>
  );
};

export const useCartStore = (selector) => {
  const store = useContext(CartContext);
  if (!store) {
    throw new Error('useCartStore must be used within a CartProvider');
  }
  return store(selector);
};

export const useCartActions = () => {
  const store = useContext(CartContext);
  if (!store) {
    throw new Error('useCartActions must be used within a CartProvider');
  }
  return store.getState();
};