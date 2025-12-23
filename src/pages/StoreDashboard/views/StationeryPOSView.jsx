
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { useStoreDashboard } from '@/stores/useStoreDashboard';
import { useStationeryStore } from '@/stores/useStationeryStore';

const StationeryPOSView = () => {
    // Generic Data (Products)
    const { products, fetchProducts, store } = useStoreDashboard();

    // Modular POS State
    const {
        cart,
        addToCart: addToCartAction,
        removeFromCart,
        updateCartQty,
        processCheckout,
        isLoadingCheckout
    } = useStationeryStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [checkoutMode, setCheckoutMode] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('Efectivo');
    const [customerName, setCustomerName] = useState('');
    const [customerDocId, setCustomerDocId] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');

    // Invoice Modal State
    const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
    const [lastOrder, setLastOrder] = useState(null);

    useEffect(() => {
        if (store?.id) fetchProducts(store.id);
    }, [store?.id]);

    // Derived cart totals
    const { subtotal, total, itemCount } = useMemo(() => {
        const sub = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        return { subtotal: sub, total: sub, itemCount: cart.reduce((sum, item) => sum + item.qty, 0) };
    }, [cart]);

    const handleAddToCart = (product) => {
        const success = addToCartAction(product);
        if (!success) {
            toast({ title: "Stock insuficiente", variant: "destructive" });
        }
    };

    const handleCheckout = async () => {
        try {
            if (!customerName || !customerDocId) {
                toast({ title: "Datos incompletos", description: "Nombre y Documento son obligatorios", variant: "destructive" });
                return;
            }

            const customerData = {
                name: customerName,
                docId: customerDocId,
                phone: customerPhone,
                email: customerEmail
            };

            // Capture order details for invoice summary before clearing cart
            const orderSummary = {
                customer: customerData,
                total: total,
                paymentMethod: paymentMethod,
                items: [...cart] // Copy cart items
            };

            await processCheckout(store.id, customerData, paymentMethod, total);

            setLastOrder(orderSummary);
            setInvoiceModalOpen(true);

            setCheckoutMode(false);
            // Reset form
            setCustomerName('');
            setCustomerDocId('');
            setCustomerPhone('');
            setCustomerEmail('');
            // Note: Cart is cleared by the store action, so we use orderSummary.items for display if needed diff logic
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
                                onClick={() => product.stock > 0 && handleAddToCart(product)}
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
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateCartQty(item.id, -1)}><Minus className="h-3 w-3" /></Button>
                                <span className="w-6 text-center text-sm font-mono">{item.qty}</span>
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateCartQty(item.id, 1)}><Plus className="h-3 w-3" /></Button>
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
                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    placeholder="Nombre Cliente *"
                                    value={customerName}
                                    onChange={e => setCustomerName(e.target.value)}
                                    className="bg-white col-span-2"
                                />
                                <Input
                                    placeholder="Documento (C.C/NIT) *"
                                    value={customerDocId}
                                    onChange={e => setCustomerDocId(e.target.value)}
                                    className="bg-white"
                                />
                                <Input
                                    placeholder="Teléfono"
                                    value={customerPhone}
                                    onChange={e => setCustomerPhone(e.target.value)}
                                    className="bg-white"
                                />
                                <Input
                                    placeholder="Correo Electrónico (Para factura)"
                                    value={customerEmail}
                                    onChange={e => setCustomerEmail(e.target.value)}
                                    className="bg-white col-span-2"
                                />
                            </div>
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
                                <Button className="flex-[2] bg-green-600 hover:bg-green-700" onClick={handleCheckout} disabled={isLoadingCheckout}>
                                    <Printer className="h-4 w-4 mr-2" /> {isLoadingCheckout ? 'Procesando...' : 'Confirmar Venta'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Invoice Confirmation Modal */}
            {
                invoiceModalOpen && lastOrder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="bg-green-600 p-4 text-white text-center">
                                <div className="mx-auto bg-white/20 w-12 h-12 rounded-full flex items-center justify-center mb-2">
                                    <Printer className="h-6 w-6" />
                                </div>
                                <h2 className="text-xl font-bold">¡Venta Exitosa!</h2>
                                <p className="text-green-100 text-sm">Factura generada correctamente</p>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="text-center space-y-1 pb-4 border-b">
                                    <p className="text-sm text-gray-500">Total Pagado</p>
                                    <p className="text-3xl font-bold text-slate-800">${lastOrder.total.toLocaleString()}</p>
                                    <p className="text-xs text-gray-400">Método: {lastOrder.paymentMethod}</p>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Cliente:</span>
                                        <span className="font-medium">{lastOrder.customer.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Documento:</span>
                                        <span className="font-medium">{lastOrder.customer.docId}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Email:</span>
                                        <span className="font-medium">{lastOrder.customer.email || 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1">
                                    <p className="font-semibold text-gray-500 mb-2">Resumen de productos:</p>
                                    {lastOrder.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between">
                                            <span>{item.qty}x {item.name}</span>
                                            <span>${(item.price * item.qty).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-2 gap-3 flex">
                                    <Button variant="outline" className="flex-1" onClick={() => setInvoiceModalOpen(false)}>
                                        Cerrar
                                    </Button>
                                    <Button className="flex-1" onClick={() => window.print()}>
                                        <Printer className="h-4 w-4 mr-2" /> Imprimir
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default StationeryPOSView;

