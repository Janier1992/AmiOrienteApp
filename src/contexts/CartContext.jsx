import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { createCartStore } from '@/stores/cartStore';
import { mergeCartItems, readStoredCartItems } from '@/lib/cartMerge';

const GUEST_CART_KEY = 'cart-storage-guest';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const storeRef = useRef();
  if (!storeRef.current) {
    storeRef.current = createCartStore();
  }
  
  useEffect(() => {
    const cartKey = user ? `cart-storage-${user.id}` : GUEST_CART_KEY;

    let items = readStoredCartItems(localStorage, cartKey);

    // Al iniciar sesión, el carrito armado como invitado pasa al del usuario
    // (si no, quien elige productos y luego inicia sesión para pagar los perdería).
    if (user) {
      const guestItems = readStoredCartItems(localStorage, GUEST_CART_KEY);
      if (guestItems.length > 0) {
        items = mergeCartItems(items, guestItems);
        localStorage.setItem(cartKey, JSON.stringify({ items }));
        localStorage.removeItem(GUEST_CART_KEY);
      }
    }

    storeRef.current.getState().initialize(items);

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