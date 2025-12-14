import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useCartStore, useCartActions } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Loader2, ArrowLeft, CreditCard, AlertTriangle, MapPin } from 'lucide-react';
import orderService from '@/services/orderService';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/customSupabaseClient';

const CheckoutPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const items = useCartStore(state => state.items);
  const { getCartTotal, clearCart } = useCartActions();
  const [processing, setProcessing] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  const total = getCartTotal();

  const groupedItems = useMemo(() => {
    return items.reduce((acc, item) => {
      const storeId = item.store_id;
      if (!acc[storeId]) {
        acc[storeId] = {
          store_id: storeId,
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

    // Intentar cargar dirección del perfil
    const loadProfileAddress = async () => {
      const { data } = await supabase.from('profiles').select('address').eq('id', user.id).single();
      if (data && data.address) {
        setDeliveryAddress(data.address);
      }
    };
    loadProfileAddress();

  }, [user, items.length, navigate]);

  const handleProcessOrder = async () => {
    if (!deliveryAddress.trim()) {
      toast({
        title: "Dirección requerida",
        description: "Por favor ingresa una dirección de entrega.",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);

    try {
      const stores = Object.values(groupedItems);

      // Procesar una orden por cada tienda
      for (const storeGroup of stores) {
        const orderPayload = {
          customer_id: user.id,
          store_id: storeGroup.store_id,
          delivery_address: deliveryAddress,
          payment_method: 'efectivo', // Por ahora simulación asume efectivo/contraentrega
          notes: deliveryNotes,
          total: storeGroup.total // El servicio recalculará fees
        };

        const orderItems = storeGroup.items.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price
        }));

        await orderService.crearPedido(orderPayload, orderItems);
      }

      // Simular pequeño delay para UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "¡Pedido Realizado!",
        description: `Se han creado ${stores.length} orden(es) exitosamente.`,
      });

      clearCart();
      navigate('/cliente/dashboard?tab=pedidos'); // Redirigir a mis pedidos en lugar de confirmación genérica

    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Error al procesar",
        description: error.message || "Hubo un problema registrando tu pedido.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Finalizar Compra - Domicilios MiOriente</title>
      </Helmet>
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <h1 className="text-3xl font-bold mb-8">Finalizar Compra</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Izquierda: Detalles de Entrega */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" /> Dirección de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección y Barrio</Label>
                  <Input
                    id="address"
                    placeholder="Ej: Calle 5 #4-20, Barrio Centro"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Instrucciones Adicionales (Opcional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Ej: Casa blanca de dos pisos, golpear fuerte..."
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Items del Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.values(groupedItems).map(group => (
                  <div key={group.store_id} className="border rounded-lg p-4 bg-slate-50">
                    <h3 className="font-bold mb-3 text-lg flex justify-between">
                      <span>{group.store_name}</span>
                      <span className="text-sm font-normal text-muted-foreground">Subtotal: ${group.total.toLocaleString()}</span>
                    </h3>
                    <div className="space-y-2">
                      {group.items.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-sm bg-white p-2 rounded border-b last:border-0 border-slate-100">
                          <div className="flex items-center gap-3">
                            {item.image_url && <img src={item.image_url} alt={item.name} className="h-10 w-10 object-cover rounded" />}
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-xs text-muted-foreground">Cant: {item.quantity}</p>
                            </div>
                          </div>
                          <p>${(item.price * item.quantity).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Columna Derecha: Resumen y Pago */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Resumen de Pago</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Warning de Modo Simulación */}
                <div className="p-3 border border-yellow-200 bg-yellow-50 rounded-md text-xs text-yellow-800">
                  <p className="font-bold flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Modo Simulación
                  </p>
                  <p>Las órdenes se registrarán en el sistema como <strong>Pendientes de Pago</strong>.</p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal Productos</span>
                    <span>${total.toLocaleString()}</span>
                  </div>
                  {/* Nota: Los fees reales se calculan al crear la orden, aquí mostramos estimados o base */}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Servicio (Est.)</span>
                    <span>$2,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Domicilio Base (Est.)</span>
                    <span>$3,500</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Total Estimado</span>
                    <span>${(total + 5500).toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={handleProcessOrder}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                    disabled={processing}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      `Confirmar Pedido`
                    )}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Al confirmar, aceptas nuestros términos y condiciones.
                  </p>
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