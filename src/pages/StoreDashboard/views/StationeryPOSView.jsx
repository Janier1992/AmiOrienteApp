
import React, { useState, useEffect, useMemo } from 'react';
import {
    Search,
    ShoppingCart,
    Trash2,
    Plus,
    Minus,
    CreditCard,
    Banknote,
    Printer,
    Save,
    XCircle,
    PackageOpen
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useStoreDashboard } from '@/stores/useStoreDashboard';

const StationeryPOSView = () => {
    const { products, fetchProducts, store } = useStoreDashboard();
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [checkoutMode, setCheckoutMode] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('Efectivo');
    const [customerName, setCustomerName] = useState('Cliente Mostrador');

    useEffect(() => {
        if (store?.id) fetchProducts(store.id);
    }, [store?.id]);

    // Derived cart totals
    const { subtotal, total, itemCount } = useMemo(() => {
        const sub = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        return { subtotal: sub, total: sub, itemCount: cart.reduce((sum, item) => sum + item.qty, 0) };
    }, [cart]);

    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(p => p.id === product.id);
            if (existing) {
                // Check stock limit
                if (existing.qty >= product.stock) {
                    toast({ title: "Stock insuficiente", variant: "destructive" });
                    return prev;
                }
                return prev.map(p => p.id === product.id ? { ...p, qty: p.qty + 1 } : p);
            }
            return [...prev, { ...product, qty: 1 }];
        });
    };

    const updateQty = (id, delta) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.qty + delta);
                // Basic stock check (optimistic)
                if (delta > 0 && newQty > item.stock) return item;
                return { ...item, qty: newQty };
            }
            return item;
        }));
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        try {
            // 1. Create Transaction Record
            const orderPayload = {
                store_id: store.id,
                customer_id: null, // Anonymous/Walk-in
                status: 'Entregado', // Immediate fulfillment
                total: total,
                delivery_address: JSON.stringify({
                    guest: { name: customerName, method: paymentMethod, type: 'POS' },
                    items: cart.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price }))
                })
            };

            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert(orderPayload)
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Update Inventory (Batch)
            // Real-world would use RPC function or backend loop.
            // Here we loop updates.
            for (const item of cart) {
                const newStock = Math.max(0, item.stock - item.qty);
                await supabase.from('products').update({ stock: newStock }).eq('id', item.id);
            }

            toast({ title: "Venta registrada", description: `Ticket #${orderData.id.slice(0, 8)}` });

            // 3. Reset
            setCart([]);
            setCheckoutMode(false);
            setCustomerName('Cliente Mostrador');
            // Refresh products to show new stock
            fetchProducts(store.id);

        } catch (error) {
            console.error(error);
            toast({ title: "Error en venta", description: error.message, variant: "destructive" });
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku && p.sku.includes(searchTerm))
    );

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-4">

            {/* Left: Product Grid */}
            <div className="flex-1 flex flex-col min-h-0 bg-slate-50 border rounded-xl overflow-hidden">
                <div className="p-4 bg-white border-b flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Buscar productos (Nombre, SKU)..."
                            className="pl-9 bg-gray-100 border-none"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1 p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredProducts.map(product => (
                            <div
                                key={product.id}
                                className={`
                                    group relative bg-white border rounded-xl p-3 shadow-sm hover:shadow-md transition-all cursor-pointer select-none
                                    ${product.stock <= 0 ? 'opacity-50 grayscale' : 'hover:border-yellow-400'}
                                `}
                                onClick={() => product.stock > 0 && addToCart(product)}
                            >
                                <div className="h-24 bg-gray-100 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <PackageOpen className="text-gray-300 h-8 w-8" />
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-sm leading-tight line-clamp-2 min-h-[2.5em]">{product.name}</h3>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-mono">
                                            {product.stock} un.
                                        </span>
                                        <span className="font-bold text-slate-900 text-sm">
                                            ${Number(product.price).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                {/* Overlay for out of stock */}
                                {product.stock <= 0 && (
                                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                                        <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded">Agotado</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    {filteredProducts.length === 0 && (
                        <div className="text-center py-10 text-gray-400">
                            No se encontraron productos
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* Right: Cart / Checkout */}
            <div className="w-full lg:w-[400px] bg-white border rounded-xl flex flex-col shadow-lg">
                <div className="p-4 border-b bg-yellow-400/10 flex items-center justify-between">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5 text-yellow-600" />
                        Ticket de Venta
                    </h2>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        {itemCount} Ítems
                    </Badge>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {cart.map(item => (
                        <div key={item.id} className="flex gap-3 items-center p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 group">
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{item.name}</p>
                                <p className="text-xs text-gray-500">${Number(item.price).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateQty(item.id, -1)}><Minus className="h-3 w-3" /></Button>
                                <span className="w-6 text-center text-sm font-mono">{item.qty}</span>
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateQty(item.id, 1)}><Plus className="h-3 w-3" /></Button>
                            </div>
                            <div className="text-right min-w-[60px]">
                                <p className="font-bold text-sm text-slate-700">${(item.price * item.qty).toLocaleString()}</p>
                            </div>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600" onClick={() => removeFromCart(item.id)}>
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                    {cart.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                            <ShoppingCart className="h-12 w-12 opacity-20" />
                            <p className="text-sm">Ticket vacío</p>
                            <p className="text-xs text-gray-300 px-8 text-center">Selecciona productos del inventario para iniciar una venta.</p>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-slate-50 border-t space-y-4">
                    <div className="space-y-1">
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Subtotal</span>
                            <span>${subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xl font-bold text-slate-900 pt-2 border-t border-dashed border-gray-300">
                            <span>Total</span>
                            <span>${total.toLocaleString()}</span>
                        </div>
                    </div>

                    {!checkoutMode ? (
                        <Button
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 text-lg font-bold shadow-md"
                            disabled={cart.length === 0}
                            onClick={() => setCheckoutMode(true)}
                        >
                            Cobrar
                        </Button>
                    ) : (
                        <div className="space-y-3 animate-in slide-in-from-bottom-4 duration-300">
                            <Input
                                placeholder="Nombre Cliente (Opcional)"
                                value={customerName}
                                onChange={e => setCustomerName(e.target.value)}
                                className="bg-white"
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant={paymentMethod === 'Efectivo' ? 'default' : 'outline'}
                                    onClick={() => setPaymentMethod('Efectivo')}
                                    className="w-full justify-start gap-2"
                                >
                                    <Banknote className="h-4 w-4" /> Efectivo
                                </Button>
                                <Button
                                    variant={paymentMethod === 'Tarjeta' ? 'default' : 'outline'}
                                    onClick={() => setPaymentMethod('Tarjeta')}
                                    className="w-full justify-start gap-2"
                                >
                                    <CreditCard className="h-4 w-4" /> Tarjeta
                                </Button>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1" onClick={() => setCheckoutMode(false)}>
                                    <XCircle className="h-4 w-4 mr-2" /> Cancelar
                                </Button>
                                <Button className="flex-[2] bg-green-600 hover:bg-green-700" onClick={handleCheckout}>
                                    <Printer className="h-4 w-4 mr-2" /> Confirmar Venta
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StationeryPOSView;
