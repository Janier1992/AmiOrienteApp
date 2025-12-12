import React, { createContext, useState, useContext } from 'react';

const CartSidebarContext = createContext();

export const useCartSidebar = () => useContext(CartSidebarContext);

export const CartSidebarProvider = ({ children }) => {
  const [isCartOpen, setIsCartOpen] = useState(false);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  return (
    <CartSidebarContext.Provider value={{ isCartOpen, openCart, closeCart }}>
      {children}
    </CartSidebarContext.Provider>
  );
};