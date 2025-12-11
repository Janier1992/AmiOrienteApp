import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useCartStore, useCartActions } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Loader2, ArrowLeft, CreditCard, AlertTriangle } from 'lucide-react';

const CheckoutPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const items = useCartStore(state => state.items);
  const { getCartTotal, clearCart } = useCartActions();
  const [processing, setProcessing] = useState(false);

  const total = getCartTotal();

  const groupedItems = useMemo(() => {
    return items.reduce((acc, item) => {
      const storeId = item.store_id;
      if (!acc[storeId]) {
        acc[storeId] = {
          store_name: item.stores.name,
          items: [],
          total: 0,
        };
      }
      acc[storeId].items.push(item);
      acc[storeId].total += item.price * item.quantity;
      return acc;
    }, {});
  }, [items]);

  useEffect(() => {
    if (!user) {
      navigate('/cliente/login?redirect=/checkout');
      return;
    }
    if (items.length === 0) {
      navigate('/productos');
      return;
    }
  }, [user, items.length, navigate]);

  const handleMockPayment = async () => {
    setProcessing(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Here we would normally process with Bold or another provider
    // For now, we simulate a successful transaction to allow flow completion
    
    try {
        toast({
            title: "Pedido Registrado (Modo Simulación)",
            description: "La pasarela de pagos está desactivada. Su pedido ha sido registrado como pendiente de pago.",
        });
        
        clearCart();
        navigate('/confirmacion-pedido');
        
    } catch (error) {
        toast({
            title: "Error",
            description: "Hubo un problema procesando la orden.",
            variant: "destructive"
        });
    } finally {
        setProcessing(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Checkout - Domicilios MiOriente</title>
      </Helmet>
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Resumen del Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.values(groupedItems).map(group => (
                  <div key={group.store_name}>
                    <h3 className="font-semibold mb-2">{group.store_name}</h3>
                    {group.items.map(item => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <p className="text-muted-foreground">{item.name} x {item.quantity}</p>
                        <p>${(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                ))}
                <div className="border-t pt-4 mt-4 flex justify-between font-bold text-lg">
                  <p>Total</p>
                  <p>${total.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Información de Pago</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 border border-yellow-200 bg-yellow-50/50 rounded-lg text-yellow-800 text-sm">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
                        <div>
                            <p className="font-semibold mb-1">
                                Pasarela de Pagos Desactivada
                            </p>
                            <p className="mb-2">
                                La integración con Stripe ha sido removida. Próximamente se integrará la pasarela de pagos <strong>Bold</strong> para mejorar tu experiencia.
                            </p>
                            <p className="text-xs opacity-90">
                                * Por el momento, puedes finalizar tu pedido en modo "Simulación" para probar el flujo de la aplicación sin realizar cobros reales.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                    <div className="p-4 border rounded-md bg-muted/20">
                        <label className="block text-sm font-medium mb-3">Método de Pago</label>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 p-3 border rounded bg-background/50 opacity-50 cursor-not-allowed">
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Tarjeta de Crédito / Débito (Deshabilitado)</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 border border-primary/20 bg-primary/5 rounded cursor-pointer ring-1 ring-primary/20">
                                <div className="h-4 w-4 rounded-full border-[5px] border-primary"></div>
                                <span className="font-medium">Simulación de Pedido</span>
                            </div>
                        </div>
                    </div>

                    <Button 
                        onClick={handleMockPayment} 
                        className="w-full" 
                        size="lg"
                        disabled={processing}
                    >
                        {processing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Procesando...
                            </>
                        ) : (
                            `Confirmar Pedido ($${total.toLocaleString()})`
                        )}
                    </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default CheckoutPage;