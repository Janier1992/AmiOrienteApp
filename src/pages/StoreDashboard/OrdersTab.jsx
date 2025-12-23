
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Package, User, Clock, Truck, MapPin } from 'lucide-react';
import { useStoreDashboard } from '@/stores/useStoreDashboard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const OrdersTab = ({ storeId }) => {
  // Using granular loading state
  const { orders, fetchOrders, updateOrderStatus, isLoadingOrders } = useStoreDashboard();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    if (storeId) {
      fetchOrders(storeId);
    }
  }, [storeId, fetchOrders]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast({ title: "Estado Actualizado", description: `El pedido ahora está: ${newStatus}` });

      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      toast({ title: "Error", description: "No se pudo actualizar el estado.", variant: "destructive" });
    }
  };

  const openDetails = (order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  }

  const getStatusBadge = (status) => {
    const styles = {
      'Pendiente': 'bg-yellow-100 text-yellow-800',
      'Confirmado': 'bg-blue-100 text-blue-800',
      'En preparación': 'bg-purple-100 text-purple-800',
      'Listo para recogida': 'bg-indigo-100 text-indigo-800',
      'En curso': 'bg-cyan-100 text-cyan-800',
      'Entregado': 'bg-green-100 text-green-800',
      'Cancelado': 'bg-red-100 text-red-800',
    };
    return <Badge variant="outline" className={`${styles[status] || 'bg-gray-100'} px-2 py-1`}>{status}</Badge>;
  };

  if (isLoadingOrders && orders.length === 0) return <LoadingSpinner text="Cargando pedidos..." />;

  return (
    <Card className="animate-in fade-in duration-300">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gestión de Pedidos</CardTitle>
        {isLoadingOrders && <Badge variant="secondary" className="animate-pulse">Actualizando...</Badge>}
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p>No tienes pedidos activos.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Table Header like Excel */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 bg-slate-100 font-semibold text-sm text-slate-600 rounded-t-lg">
              <div className="col-span-2">ID Pedido</div>
              <div className="col-span-3">Cliente</div>
              <div className="col-span-2">Fecha</div>
              <div className="col-span-2">Total / Items</div>
              <div className="col-span-3 text-center">Estado</div>
            </div>

            {orders.map((order) => {
              // Parse Customer Data
              let customerName = order.profiles?.full_name || 'Cliente Mostrador';
              let customerPhone = order.profiles?.phone || 'N/A';

              // Try parsing delivery_address if it's JSON (Guest/POS data)
              try {
                if (order.delivery_address && (order.delivery_address.startsWith('{') || order.delivery_address.startsWith('['))) {
                  const parsed = JSON.parse(order.delivery_address);
                  if (parsed.guest) {
                    customerName = parsed.guest.name || customerName;
                    customerPhone = parsed.guest.phone || customerPhone;
                  }
                }
              } catch (e) {
                // Fallback to raw string if not JSON
              }

              return (
                <div key={order.id} className="border rounded-lg p-3 grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-white hover:bg-slate-50 transition-colors shadow-sm">
                  {/* ID */}
                  <div className="col-span-2 font-mono font-bold text-slate-700">
                    #{order.id.substring(0, 8)}
                  </div>

                  {/* Customer */}
                  <div className="col-span-3">
                    <div className="font-medium text-slate-900">{customerName}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <User className="h-3 w-3" /> {customerPhone}
                    </div>
                  </div>

                  {/* Date */}
                  <div className="col-span-2 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {new Date(order.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-400">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>

                  {/* Total */}
                  <div className="col-span-2">
                    <div className="font-bold text-slate-800">${Number(order.total).toLocaleString()}</div>
                    <div className="text-xs text-slate-500">{order.order_items?.length || 0} ítems</div>
                  </div>

                  {/* Status & Actions */}
                  <div className="col-span-3 flex flex-col gap-2 items-center justify-center">
                    {getStatusBadge(order.status)}
                    <Button variant="ghost" size="sm" className="h-6 text-xs text-blue-600 hover:text-blue-800" onClick={() => openDetails(order)}>
                      Ver Detalles
                    </Button>

                    {/* Quick Actions based on status */}
                    <div className="flex gap-1">
                      {['Pendiente', 'Pendiente de pago en efectivo'].includes(order.status) && (
                        <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700" onClick={() => handleUpdateStatus(order.id, 'Confirmado')}>Confirmar</Button>
                      )}
                      {order.status === 'Confirmado' && (
                        <Button size="sm" className="h-7 text-xs bg-purple-600 hover:bg-purple-700" onClick={() => handleUpdateStatus(order.id, 'En preparación')}>Preparar</Button>
                      )}
                      {order.status === 'En preparación' && (
                        <Button size="sm" className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700" onClick={() => handleUpdateStatus(order.id, 'Listo para recogida')}>
                          <Truck className="h-3 w-3 mr-1" /> Listo
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Pedido #{selectedOrder?.id.substring(0, 8)}</DialogTitle>
              <DialogDescription>
                Estado actual: <span className="font-semibold">{selectedOrder?.status}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div>
                {(() => {
                  let clientName = selectedOrder?.profiles?.full_name || 'N/A';
                  let clientPhone = selectedOrder?.profiles?.phone || 'N/A';
                  let clientDoc = 'N/A';
                  let clientEmail = 'N/A';
                  let isGuest = false;

                  try {
                    if (selectedOrder?.delivery_address && (selectedOrder.delivery_address.startsWith('{') || selectedOrder.delivery_address.startsWith('['))) {
                      const parsed = JSON.parse(selectedOrder.delivery_address);
                      if (parsed.guest) {
                        isGuest = true;
                        clientName = parsed.guest.name || clientName;
                        clientPhone = parsed.guest.phone || clientPhone;
                        clientDoc = parsed.guest.doc_id || 'N/A';
                        clientEmail = parsed.guest.email || 'N/A';
                      }
                    }
                  } catch (e) { }

                  return (
                    <>
                      <h4 className="font-semibold mb-2 flex items-center gap-2"><User className="h-4 w-4" /> Datos del Cliente</h4>
                      <div className="space-y-1 text-sm text-slate-600">
                        <div className="grid grid-cols-[80px_1fr]">
                          <span className="font-medium text-slate-800">Nombre:</span>
                          <span>{clientName}</span>
                        </div>
                        <div className="grid grid-cols-[80px_1fr]">
                          <span className="font-medium text-slate-800">Documento:</span>
                          <span>{clientDoc}</span>
                        </div>
                        <div className="grid grid-cols-[80px_1fr]">
                          <span className="font-medium text-slate-800">Teléfono:</span>
                          <span>{clientPhone}</span>
                        </div>
                        <div className="grid grid-cols-[80px_1fr]">
                          <span className="font-medium text-slate-800">Email:</span>
                          <span className="truncate" title={clientEmail}>{clientEmail}</span>
                        </div>
                        {isGuest && <Badge variant="secondary" className="mt-2 text-xs">Venta POS / Invitado</Badge>}
                      </div>
                    </>
                  );
                })()}
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2"><MapPin className="h-4 w-4" /> Detalle Entrega</h4>
                <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded border">
                  {(() => {
                    try {
                      // If it is our structured JSON, we can extracting shipping info if exists, otherwise assume store pickup if POS
                      if (selectedOrder?.delivery_address?.includes('"guest":')) {
                        return "Entrega inmediata en tienda (POS)";
                      }
                      return selectedOrder?.delivery_address || 'Recogida en tienda';
                    } catch (e) { return selectedOrder?.delivery_address || 'N/A'; }
                  })()}
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Productos</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {selectedOrder?.order_items?.map(item => (
                  <div key={item.id} className="flex justify-between items-center text-sm p-3 border rounded-lg bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="font-mono bg-white px-2 py-1 rounded border text-xs font-bold">{item.quantity}x</div>
                      <span className="font-medium text-slate-700">{item.products?.name}</span>
                    </div>
                    <span className="font-bold text-slate-800">${(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-4 p-4 bg-slate-100 rounded-lg">
                <span className="font-bold text-lg text-slate-700">Total a Pagar</span>
                <span className="font-bold text-2xl text-slate-900">${Number(selectedOrder?.total).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Cerrar</Button>
              {selectedOrder?.status !== 'Cancelado' && selectedOrder?.status !== 'Entregado' && (
                <Select onValueChange={(val) => handleUpdateStatus(selectedOrder.id, val)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Cambiar Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Confirmado">Confirmar</SelectItem>
                    <SelectItem value="En preparación">En preparación</SelectItem>
                    <SelectItem value="Listo para recogida">Listo para recogida</SelectItem>
                    <SelectItem value="Entregado">Entregado</SelectItem>
                    <SelectItem value="Cancelado">Cancelar Pedido</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default OrdersTab;
