import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useCartStore, useCartActions } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Loader2, ArrowLeft, AlertTriangle, MapPin, Tag, X, Truck } from 'lucide-react';
import orderService from '@/services/orderService';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/customSupabaseClient';
import { SERVICE_FEE, DELIVERY_BASE_FEE } from '@/lib/constants';

const CheckoutPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const items = useCartStore(state => state.items);
  const { getCartTotal, clearCart, removeFromCart } = useCartActions();
  const [processing, setProcessing] = useState(false);
  // Tras un pedido exitoso se vacía el carrito; sin esta guarda el efecto de
  // abajo lo tomaba por un carrito vacío y redirigía a /productos, pisando la
  // pantalla de confirmación.
  const orderPlacedRef = useRef(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [shippingZones, setShippingZones] = useState({}); // { [store_id]: [{ id, name, shipping_rates: [...] }] }
  const [taxRates, setTaxRates] = useState({}); // { [store_id]: combined rate, e.g. 0.19 }
  const [selectedShipping, setSelectedShipping] = useState({}); // { [store_id]: { zoneId, rateId, price } }

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
      if (!orderPlacedRef.current) navigate('/productos');
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

  useEffect(() => {
    const storeIds = Object.keys(groupedItems);
    if (storeIds.length === 0) return;

    const loadShippingAndTaxes = async () => {
      const { data: zonesData } = await supabase
        .from('shipping_zones')
        .select('id, store_id, name, shipping_rates(id, name, price)')
        .in('store_id', storeIds);

      const zonesByStore = {};
      (zonesData || []).forEach(zone => {
        if (!zonesByStore[zone.store_id]) zonesByStore[zone.store_id] = [];
        zonesByStore[zone.store_id].push(zone);
      });
      setShippingZones(zonesByStore);

      const { data: taxesData } = await supabase
        .from('taxes')
        .select('store_id, rate')
        .in('store_id', storeIds);

      const taxByStore = {};
      (taxesData || []).forEach(t => {
        taxByStore[t.store_id] = (taxByStore[t.store_id] || 0) + Number(t.rate);
      });
      setTaxRates(taxByStore);
    };
    loadShippingAndTaxes();
  }, [groupedItems]);

  const handleSelectZone = (storeId, zoneId) => {
    setSelectedShipping(prev => ({ ...prev, [storeId]: { zoneId, rateId: null, price: null } }));
  };

  const handleSelectRate = (storeId, zoneId, rateId, price) => {
    setSelectedShipping(prev => ({ ...prev, [storeId]: { zoneId, rateId, price } }));
  };

  // null = store has no configured zones, use the flat platform default fee
  const getShippingFee = (storeId) => {
    const zones = shippingZones[storeId];
    if (!zones || zones.length === 0) return null;
    return selectedShipping[storeId]?.price ?? undefined;
  };

  const getTaxAmount = (storeId, subtotal) => {
    const rate = taxRates[storeId] || 0;
    return subtotal * rate;
  };

  const totals = useMemo(() => {
    const stores = Object.values(groupedItems);
    let serviceFeeTotal = 0;
    let shippingTotal = 0;
    let taxTotal = 0;
    stores.forEach(group => {
      serviceFeeTotal += SERVICE_FEE;
      const fee = getShippingFee(group.store_id);
      shippingTotal += (fee === null || fee === undefined) ? DELIVERY_BASE_FEE : fee;
      taxTotal += getTaxAmount(group.store_id, group.total);
    });
    const discount = appliedCoupon?.amount || 0;
    const grandTotal = Math.max(0, total + serviceFeeTotal + shippingTotal + taxTotal - discount);
    return { serviceFeeTotal, shippingTotal, taxTotal, discount, grandTotal };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupedItems, selectedShipping, shippingZones, taxRates, appliedCoupon, total]);

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    setApplyingCoupon(true);
    try {
      const storeIds = Object.keys(groupedItems);
      const { data, error } = await supabase
        .from('discounts')
        .select('*')
        .eq('code', code)
        .in('store_id', storeIds)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error || !data) {
        toast({ title: "Código inválido", description: "Ese código no existe, no aplica a estos productos o ya expiró.", variant: "destructive" });
        return;
      }
      if (data.usage_limit && data.usage_count >= data.usage_limit) {
        toast({ title: "Código agotado", description: "Este código alcanzó su límite de usos.", variant: "destructive" });
        return;
      }

      const group = groupedItems[data.store_id];
      const amount = data.discount_type === 'percentage'
        ? Math.round(group.total * (Number(data.value) / 100))
        : Math.min(Number(data.value), group.total);

      setAppliedCoupon({
        code: data.code,
        store_id: data.store_id,
        store_name: group.store_name,
        amount,
      });
      toast({ title: "Cupón aplicado", description: `Descuento de $${amount.toLocaleString()} en ${group.store_name}.` });
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
  };

  const handleProcessOrder = async () => {
    if (!deliveryAddress.trim()) {
      toast({
        title: "Dirección requerida",
        description: "Por favor ingresa una dirección de entrega.",
        variant: "destructive"
      });
      return;
    }

    for (const [storeId, group] of Object.entries(groupedItems)) {
      const zones = shippingZones[storeId];
      if (zones && zones.length > 0 && !selectedShipping[storeId]?.rateId) {
        toast({
          title: "Falta zona de entrega",
          description: `Selecciona tu zona de entrega para ${group.store_name}.`,
          variant: "destructive"
        });
        return;
      }
    }

    setProcessing(true);

    try {
      const stores = Object.values(groupedItems);
      const createdOrders = [];
      const failedStores = [];

      // Procesar una orden por cada tienda. El precio, envío, impuestos,
      // descuento y total los recalcula create_order() en el servidor a
      // partir de precios reales — aquí solo mandamos la intención del
      // cliente (qué producto, cuánta cantidad, qué código/tarifa eligió).
      for (const storeGroup of stores) {
        const isDiscountedStore = appliedCoupon && storeGroup.store_id === appliedCoupon.store_id;
        const shippingSelection = selectedShipping[storeGroup.store_id];
        const orderPayload = {
          store_id: storeGroup.store_id,
          delivery_address: deliveryAddress,
          payment_method: 'efectivo', // Por ahora simulación asume efectivo/contraentrega
          notes: deliveryNotes,
          discount_code: isDiscountedStore ? appliedCoupon.code : null,
          shipping_rate_id: shippingSelection?.rateId || null,
        };

        const orderItems = storeGroup.items.map(item => ({
          product_id: item.id,
          quantity: item.quantity
        }));

        // Un fallo en una tienda no debe ocultar ni repetir los pedidos que sí se crearon.
        try {
          const newOrder = await orderService.crearPedido(orderPayload, orderItems);
          createdOrders.push(newOrder);
          orderPlacedRef.current = true; // evita que el carrito vacío nos saque de aquí
          // Estos productos ya se pidieron: sacarlos del carrito evita duplicar el pedido al reintentar.
          storeGroup.items.forEach(item => removeFromCart(item.id));
        } catch (storeError) {
          console.error(`Checkout error (${storeGroup.store_name}):`, storeError);
          failedStores.push({ name: storeGroup.store_name, message: storeError.message });
        }
      }

      if (createdOrders.length === 0) {
        throw new Error(failedStores[0]?.message || 'No se pudo registrar tu pedido.');
      }

      if (failedStores.length > 0) {
        orderPlacedRef.current = false;
        toast({
          title: "Pedido creado parcialmente",
          description: `Se crearon ${createdOrders.length} pedido(s), pero no se pudo registrar el de: ${failedStores.map(f => f.name).join(', ')}. Esos productos siguen en tu carrito para que reintentes.`,
          variant: "destructive"
        });
        return;
      }

      // Simular pequeño delay para UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      orderPlacedRef.current = true;
      clearCart();

      // Con un solo pedido mostramos la pantalla de confirmación con el
      // detalle; con varios (carrito multi-tienda) vamos directo al listado.
      if (createdOrders.length === 1 && createdOrders[0]?.id) {
        navigate(`/confirmacion-pedido?order_id=${createdOrders[0].id}`);
      } else {
        toast({
          title: "¡Pedido Realizado!",
          description: `Se han creado ${stores.length} orden(es) exitosamente.`,
        });
        navigate('/cliente/dashboard?tab=pedidos');
      }

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
        <title>Finalizar Compra - AmiOriente</title>
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
                    {shippingZones[group.store_id]?.length > 0 && (
                      <div className="mb-3 flex flex-col sm:flex-row gap-2 bg-white p-3 rounded border">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                          <Truck className="h-4 w-4" /> Envío:
                        </div>
                        <Select
                          value={selectedShipping[group.store_id]?.zoneId || ''}
                          onValueChange={(zoneId) => handleSelectZone(group.store_id, zoneId)}
                        >
                          <SelectTrigger className="sm:w-48 h-8 text-xs"><SelectValue placeholder="Zona de entrega" /></SelectTrigger>
                          <SelectContent>
                            {shippingZones[group.store_id].map(zone => (
                              <SelectItem key={zone.id} value={zone.id}>{zone.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedShipping[group.store_id]?.zoneId && (
                          <Select
                            value={selectedShipping[group.store_id]?.rateId || ''}
                            onValueChange={(rateId) => {
                              const zone = shippingZones[group.store_id].find(z => z.id === selectedShipping[group.store_id].zoneId);
                              const rate = zone?.shipping_rates?.find(r => r.id === rateId);
                              handleSelectRate(group.store_id, zone.id, rateId, rate ? Number(rate.price) : null);
                            }}
                          >
                            <SelectTrigger className="sm:w-48 h-8 text-xs"><SelectValue placeholder="Tarifa" /></SelectTrigger>
                            <SelectContent>
                              {(shippingZones[group.store_id].find(z => z.id === selectedShipping[group.store_id].zoneId)?.shipping_rates || []).map(rate => (
                                <SelectItem key={rate.id} value={rate.id}>{rate.name} - ${Number(rate.price).toLocaleString()}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )}
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" /> Código de Descuento
                </CardTitle>
              </CardHeader>
              <CardContent>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 border border-green-200 bg-green-50 rounded-md">
                    <div>
                      <p className="font-semibold text-green-800">{appliedCoupon.code}</p>
                      <p className="text-xs text-green-700">-${appliedCoupon.amount.toLocaleString()} en {appliedCoupon.store_name}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleRemoveCoupon}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ingresa tu código"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                    />
                    <Button variant="outline" onClick={handleApplyCoupon} disabled={applyingCoupon || !couponInput.trim()}>
                      {applyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aplicar'}
                    </Button>
                  </div>
                )}
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
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Servicio</span>
                    <span>${totals.serviceFeeTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Domicilio</span>
                    <span>${totals.shippingTotal.toLocaleString()}</span>
                  </div>
                  {totals.taxTotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Impuestos</span>
                      <span>${Math.round(totals.taxTotal).toLocaleString()}</span>
                    </div>
                  )}
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600">
                      <span>Descuento ({appliedCoupon.code})</span>
                      <span>-${appliedCoupon.amount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Total Estimado</span>
                    <span>${Math.round(totals.grandTotal).toLocaleString()}</span>
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