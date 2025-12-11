import { create } from 'zustand';

const initialCartState = {
  items: [],
};

const createCartStore = () => create((set, get) => ({
  ...initialCartState,
  isInitialized: false,
  initialize: (initialItems) => {
    set({ items: initialItems, isInitialized: true });
  },
  addToCart: (product, quantity = 1) => {
    const existingItem = get().items.find((item) => item.id === product.id);
    if (existingItem) {
      set((state) => ({
        items: state.items.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        ),
      }));
    } else {
      set((state) => ({
        items: [...state.items, { ...product, quantity }],
      }));
    }
  },
  removeFromCart: (productId) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== productId),
    }));
  },
  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
    } else {
      set((state) => ({
        items: state.items.map((item) =>
          item.id === productId ? { ...item, quantity } : item
        ),
      }));
    }
  },
  clearCart: () => {
    set({ items: [] });
  },
  getCartTotal: () => {
    return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
  },
  getCartItemCount: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },
  reset: () => {
    set(initialCartState);
  }
}));

export { createCartStore };