import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore, useCartActions } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { ShoppingBag, X, Plus, Minus, Trash2 } from 'lucide-react';

const CartSidebar = ({ isOpen, onClose }) => {
    const items = useCartStore(state => state.items);
    const getCartTotal = useCartStore(state => state.getCartTotal);
    const getCartItemCount = useCartStore(state => state.getCartItemCount);
    const { removeFromCart, updateQuantity, clearCart } = useCartActions();
    const { user } = useAuth();
    const navigate = useNavigate();
  
    const handleCheckout = () => {
        if (!user) {
            toast({
                title: "Inicia sesión para continuar",
                description: "Debes iniciar sesión como cliente para poder pagar.",
                variant: "destructive"
            });
            navigate('/cliente/login?redirect=/checkout');
            return;
        }
        onClose();
        navigate('/checkout');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 z-[100]"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed top-0 right-0 w-full max-w-md h-full bg-card text-card-foreground shadow-2xl z-[101] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <h2 className="text-2xl font-bold">Tu Carrito ({getCartItemCount()})</h2>
                            <Button variant="ghost" size="icon" onClick={onClose}>
                                <X className="h-6 w-6" />
                            </Button>
                        </div>
                        
                        {items.length === 0 ? (
                            <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
                                <ShoppingBag className="h-24 w-24 text-muted-foreground mb-4" />
                                <h3 className="text-xl font-semibold text-foreground">Tu carrito está vacío</h3>
                                <p className="text-muted-foreground mt-2">¡Añade productos para empezar a comprar!</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                                    {items.map(item => (
                                        <div key={item.id} className="flex items-start space-x-4">
                                            <div className="w-20 h-20 rounded-lg overflow-hidden border border-border">
                                              <img alt={item.name} className="w-full h-full object-cover" src={item.image_url || "https://images.unsplash.com/photo-1638428355339-3ae4ae63bf4e"} />
                                            </div>
                                            <div className="flex-grow">
                                                <h4 className="font-semibold text-foreground">{item.name}</h4>
                                                <p className="text-sm text-muted-foreground">${Number(item.price).toLocaleString()}</p>
                                                <div className="flex items-center mt-2">
                                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}>
                                                        <Minus className="h-4 w-4" />
                                                    </Button>
                                                    <span className="w-10 text-center font-semibold text-foreground">{item.quantity}</span>
                                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-foreground">${(Number(item.price) * item.quantity).toLocaleString()}</p>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 mt-2" onClick={() => removeFromCart(item.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-4 border-t border-border space-y-4 bg-muted">
                                    <div className="flex justify-between font-bold text-lg text-foreground">
                                        <span>Subtotal</span>
                                        <span>${getCartTotal().toLocaleString()}</span>
                                    </div>
                                    <Button onClick={handleCheckout} size="lg" className="w-full">
                                        Continuar al Checkout
                                    </Button>
                                    <Button variant="outline" onClick={clearCart} className="w-full">
                                        Vaciar Carrito
                                    </Button>
                                </div>
                            </>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CartSidebar;