import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useCart = create(
  persist(
    (set, get) => ({
      items: [],
      addToCart: (product, quantity = 1) => {
        set(state => {
          const existingItem = state.items.find(item => item.id === product.id);
          if (existingItem) {
            return {
              items: state.items.map(item =>
                item.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }
          return { items: [...state.items, { ...product, quantity }] };
        });
      },
      removeFromCart: (productId) => {
        set(state => ({
          items: state.items.filter(item => item.id !== productId),
        }));
      },
      updateQuantity: (productId, quantity) => {
        set(state => ({
          items: state.items.map(item =>
            item.id === productId ? { ...item, quantity } : item
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
      getCartTotal: () => {
        return get().items.reduce((total, item) => {
          return total + item.price * item.quantity;
        }, 0);
      },
    }),
    {
      name: 'mioriente-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
);