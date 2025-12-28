
import React, { useState, useEffect } from 'react';
import {
    Search,
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    CreditCard,
    User,
    FileText,
    CheckCircle,
    X,
    Loader2,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { useStoreDashboard } from '@/stores/useStoreDashboard';

/**
 * Componente Tarjeta de Producto (Genérico)
 */
const ProductCard = ({ product, onAddToCart }) => {
    const isOutOfStock = product.stock <= 0;

    return (
        <Card className={`overflow-hidden h-full flex flex-col group ${isOutOfStock ? 'opacity-60' : ''}`}>
            <div className="relative h-32 overflow-hidden bg-slate-100">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <ShoppingCart className="h-8 w-8" />
                    </div>
                )}
                {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                        <Badge variant="destructive">Agotado</Badge>
                    </div>
                )}
            </div>
            <CardContent className="p-3 flex-1 flex flex-col">
                <h3 className="font-semibold text-sm leading-tight mb-1 line-clamp-2">{product.name}</h3>
                <p className="text-xs text-slate-500 mb-2">{product.category || 'General'}</p>
                <div className="mt-auto flex items-center justify-between">
                    <span className="font-bold text-blue-900">${parseFloat(product.price).toLocaleString()}</span>
                    <Button
                        size="sm"
                        className="h-7 w-7 rounded-full p-0"
                        onClick={() => onAddToCart(product)}
                        disabled={isOutOfStock}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

/**
 * Componente Panel de Carrito (Reutilizable para Desktop y Mobile)
 */
const CartPanel = ({ cart, updateCartQty, removeFromCart, clearCart, subtotal, total, onCheckout, onCloseMobile }) => (
    <div className="flex flex-col h-full bg-white">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <div>
                <h2 className="font-bold text-lg flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Orden Actual
                </h2>
                <p className="text-xs text-slate-400">{cart.length} ítems</p>
            </div>
            {onCloseMobile && (
                <Button variant="ghost" size="icon" onClick={onCloseMobile} className="lg:hidden">
                    <X className="h-5 w-5" />
                </Button>
            )}
        </div>

        <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
                {cart.map(item => (
                    <div key={item.id} className="flex gap-3 bg-white border border-slate-100 p-2 rounded-lg shadow-sm">
                        <div className="h-12 w-12 bg-slate-100 rounded-md overflow-hidden flex-shrink-0">
                            {item.image_url && <img src={item.image_url} alt="" className="h-full w-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium truncate">{item.name}</h4>
                            <div className="flex items-center justify-between mt-1">
                                <div className="flex items-center gap-2 bg-slate-50 rounded-md p-0.5">
                                    <button
                                        className="h-6 w-6 flex items-center justify-center hover:bg-slate-200 rounded"
                                        onClick={() => updateCartQty(item.id, -1)}
                                    >
                                        <Minus className="h-3 w-3" />
                                    </button>
                                    <span className="text-xs w-4 text-center font-medium">{item.qty}</span>
                                    <button
                                        className="h-6 w-6 flex items-center justify-center hover:bg-slate-200 rounded"
                                        onClick={() => updateCartQty(item.id, 1)}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </button>
                                </div>
                                <span className="text-sm font-bold">${(item.price * item.qty).toLocaleString()}</span>
                            </div>
                        </div>
                        <button
                            className="text-slate-300 hover:text-red-500 self-center"
                            onClick={() => removeFromCart(item.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                ))}
                {cart.length === 0 && (
                    <div className="text-center py-10 text-slate-400 text-sm">
                        El carrito está vacío
                    </div>
                )}
            </div>
        </ScrollArea>

        <div className="p-4 bg-slate-50 border-t border-slate-200">
            <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span>${subtotal.toLocaleString()}</span>
                </div>
                <div className="border-b border-gray-200" />
                <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-blue-600">${total.toLocaleString()}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={clearCart} disabled={cart.length === 0}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpiar
                </Button>
                <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={cart.length === 0}
                    onClick={onCheckout}
                >
                    Pagar <CheckCircle className="h-4 w-4 ml-2" />
                </Button>
            </div>
        </div>
    </div>
);

/**
 * Vista de Punto de Venta (POS) Genérica
 */
const GenericPOSView = ({ useStore, title = "Punto de Venta" }) => {
    const { store } = useStoreDashboard();

    // Extraer estado
    const {
        products,
        fetchProducts,
        cart,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        processCheckout,
        isLoadingCheckout
    } = useStore();

    // Estados UI
    const [searchTerm, setSearchTerm] = useState('');
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [showMobileCart, setShowMobileCart] = useState(false); // Mobile toggle

    // Customer Data
    const [customerName, setCustomerName] = useState('');
    const [customerDocId, setCustomerDocId] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Efectivo');

    // Invoice Modal
    const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
    const [lastOrder, setLastOrder] = useState(null);

    // Initial Load
    useEffect(() => {
        if (store?.id) fetchProducts(store.id);
    }, [store?.id, fetchProducts]);

    // Filtering
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const total = subtotal;

    // Handlers
    const handleAddToCart = (product) => {
        const added = addToCart(product);
        if (!added) toast({ title: "Stock insuficiente", variant: "destructive" });
    };

    const handleCheckout = async () => {
        if (!customerName || !customerDocId) {
            toast({ title: "Datos incompletos", description: "Nombre y Documento son obligatorios", variant: "destructive" });
            return;
        }

        const customerData = { name: customerName, docId: customerDocId, phone: customerPhone, email: customerEmail };
        const orderSummary = {
            customer: customerData,
            items: [...cart],
            total: total,
            date: new Date().toLocaleString(),
            id: `POS-${Date.now().toString().slice(-6)}`,
            paymentMethod
        };

        try {
            await processCheckout(store.id, customerData, paymentMethod, total);
            setCheckoutOpen(false);
            setLastOrder(orderSummary);
            setInvoiceModalOpen(true);
            setCustomerName(''); setCustomerDocId(''); setCustomerPhone(''); setCustomerEmail('');
            toast({ title: "Venta realizada con éxito" });
            if (showMobileCart) setShowMobileCart(false); // Close mobile cart after sale
        } catch (error) {
            toast({ title: "Error al procesar venta", description: error.message, variant: "destructive" });
        }
    };

    return (
        <div className="flex flex-col xl:flex-row h-[calc(100vh-140px)] xl:h-[calc(100vh-100px)] gap-4 font-sans relative">
            {/* Left: Product Grid (Full Width on Mobile) */}
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="w-full sm:w-auto">
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <ShoppingCart className="h-6 w-6 text-blue-600" />
                            {title}
                        </h1>
                    </div>
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Buscar producto..."
                            className="pl-9 bg-slate-50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1 bg-slate-50/50 rounded-xl border border-slate-200 p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20 lg:pb-0">
                        {filteredProducts.map(product => (
                            <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
                        ))}
                    </div>
                    {filteredProducts.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 min-h-[200px]">
                            <Search className="h-12 w-12 mb-2 opacity-20" />
                            <p>No se encontraron productos</p>
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* Desktop Cart Sidebar (Hidden on Mobile/Tablet) */}
            <div className="hidden xl:flex w-96 bg-white border-l border-slate-200 flex-col shadow-xl rounded-xl overflow-hidden">
                <CartPanel
                    cart={cart}
                    updateCartQty={updateCartQty}
                    removeFromCart={removeFromCart}
                    clearCart={clearCart}
                    subtotal={subtotal}
                    total={total}
                    onCheckout={() => setCheckoutOpen(true)}
                />
            </div>

            {/* Mobile Cart Floating Button */}
            <div className="xl:hidden fixed bottom-6 right-6 z-40">
                <Button
                    className="h-16 w-16 rounded-full shadow-2xl bg-blue-600 hover:bg-blue-700 relative"
                    onClick={() => setShowMobileCart(true)}
                >
                    <ShoppingCart className="h-8 w-8 text-white" />
                    {cart.length > 0 && (
                        <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center bg-red-500 border-2 border-white">
                            {cart.length}
                        </Badge>
                    )}
                </Button>
            </div>

            {/* Mobile Cart Overlay (Slide Up/Over) */}
            {showMobileCart && (
                <div className="fixed inset-0 z-50 bg-black/50 lg:hidden flex justify-end">
                    <div className="w-full sm:w-96 bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300">
                        <CartPanel
                            cart={cart}
                            updateCartQty={updateCartQty}
                            removeFromCart={removeFromCart}
                            clearCart={clearCart}
                            subtotal={subtotal}
                            total={total}
                            onCheckout={() => setCheckoutOpen(true)}
                            onCloseMobile={() => setShowMobileCart(false)}
                        />
                    </div>
                </div>
            )}

            {/* Checkout Dialog */}
            <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Finalizar Venta</DialogTitle>
                        <DialogDescription>Ingrese los datos del cliente.</DialogDescription>
                    </DialogHeader>
                    {/* ... (Existing Checkout Form) ... */}
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="docId" className="text-right">Documento</Label>
                            <Input id="docId" value={customerDocId} onChange={e => setCustomerDocId(e.target.value)} className="col-span-3" placeholder="CC / NIT" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Nombre</Label>
                            <Input id="name" value={customerName} onChange={e => setCustomerName(e.target.value)} className="col-span-3" placeholder="Nombre" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="phone" className="text-right">Celular</Label>
                            <Input id="phone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="col-span-3" placeholder="300..." />
                        </div>
                        <div className="space-y-2 pt-2">
                            <Label>Método de Pago</Label>
                            <div className="flex gap-4">
                                <label className="flex items-center space-x-2"><input type="radio" checked={paymentMethod === 'Efectivo'} onChange={() => setPaymentMethod('Efectivo')} /><span>Efectivo</span></label>
                                <label className="flex items-center space-x-2"><input type="radio" checked={paymentMethod === 'Tarjeta'} onChange={() => setPaymentMethod('Tarjeta')} /><span>Tarjeta</span></label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCheckoutOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCheckout} disabled={isLoadingCheckout}>
                            {isLoadingCheckout ? <Loader2 className="animate-spin mr-2" /> : null} Confirmar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Invoice Modal */}
            <Dialog open={invoiceModalOpen} onOpenChange={setInvoiceModalOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-green-600"><CheckCircle className="h-6 w-6" /> Venta Exitosa</DialogTitle>
                    </DialogHeader>
                    {lastOrder && (
                        <div className="bg-slate-50 p-4 rounded-lg text-sm space-y-3 font-mono border">
                            <div className="flex justify-between border-b pb-2"><span>Factura #</span><span className="font-bold">{lastOrder.id}</span></div>
                            <div className="space-y-1">
                                <p><span className="text-slate-500">Cliente:</span> {lastOrder.customer.name}</p>
                                <div className="border-t border-b py-2 space-y-1">
                                    {lastOrder.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between"><span>{item.qty}x {item.name}</span><span>${(item.price * item.qty).toLocaleString()}</span></div>
                                    ))}
                                </div>
                                <div className="flex justify-between text-lg font-bold pt-1"><span>TOTAL</span><span>${lastOrder.total.toLocaleString()}</span></div>
                            </div>
                        </div>
                    )}
                    <DialogFooter><Button className="w-full" onClick={() => setInvoiceModalOpen(false)}>Cerrar</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default GenericPOSView;
