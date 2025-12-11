import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart as ShoppingCartIcon, X, Minus, Plus } from 'lucide-react';
import { useCartStore, useCartActions } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const ShoppingCart = ({ isCartOpen, setIsCartOpen }) => {
  const navigate = useNavigate();
  const items = useCartStore(state => state.items);
  const getCartTotal = useCartStore(state => state.getCartTotal);
  const { removeFromCart, updateQuantity } = useCartActions();

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-50"
          onClick={() => setIsCartOpen(false)}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">Carrito de Compras</h2>
              <Button onClick={() => setIsCartOpen(false)} variant="ghost" size="icon">
                <X />
              </Button>
            </div>
            <div className="flex-grow p-6 overflow-y-auto space-y-4">
              {items.length === 0 ? (
                <div className="text-center text-gray-500 h-full flex flex-col items-center justify-center">
                  <ShoppingCartIcon size={48} className="mb-4" />
                  <p>Tu carrito está vacío.</p>
                </div>
              ) : (
                items.map(item => (
                  <div key={item.id} className="flex items-start gap-4 p-3 rounded-lg border">
                    <img src={item.image_url || "https://images.unsplash.com/photo-1571302171879-0965db383dc4"} alt={item.name} className="w-20 h-20 object-cover rounded-md" />
                    <div className="flex-grow">
                      <h3 className="font-semibold text-gray-800">{item.name}</h3>
                      <p className="text-sm text-gray-600 font-bold">
                        ${item.price.toLocaleString()}
                      </p>
                      <div className="flex items-center border rounded-md mt-2">
                        <Button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} size="sm" variant="ghost" className="px-2 text-gray-600 hover:bg-gray-100"><Minus size={16}/></Button>
                        <span className="px-3 text-gray-800">{item.quantity}</span>
                        <Button onClick={() => updateQuantity(item.id, item.quantity + 1)} size="sm" variant="ghost" className="px-2 text-gray-600 hover:bg-gray-100"><Plus size={16}/></Button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       <p className="font-bold text-lg text-primary">${(item.price * item.quantity).toLocaleString()}</p>
                       <Button onClick={() => removeFromCart(item.id)} size="sm" variant="ghost" className="text-red-500 hover:text-red-600 text-xs">Quitar</Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {items.length > 0 && (
              <div className="p-6 border-t bg-gray-50">
                <div className="flex justify-between items-center mb-2 text-gray-600">
                  <span>Subtotal</span>
                  <span>${getCartTotal().toLocaleString()}</span>
                </div>
                 <div className="flex justify-between items-center mb-4 text-gray-600">
                  <span>Envío</span>
                  <span>$5,000</span>
                </div>
                <div className="flex justify-between items-center mb-4 text-gray-800">
                  <span className="text-lg font-medium">Total</span>
                  <span className="text-2xl font-bold">${(getCartTotal() + 5000).toLocaleString()}</span>
                </div>
                <Button onClick={handleCheckout} className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 text-base">
                  Proceder al Pago
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShoppingCart;