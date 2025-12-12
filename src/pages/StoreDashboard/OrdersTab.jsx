
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
        
        if(selectedOrder?.id === orderId) {
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
            {orders.map((order) => (
              <div key={order.id} className="border rounded-lg p-4 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center bg-white hover:bg-slate-50 transition-colors">
                <div className="flex-grow space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">#{order.id.substring(0, 8)}</span>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-4">
                     <span className="flex items-center"><User className="h-3 w-3 mr-1" /> {order.profiles?.full_name}</span>
                     <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {new Date(order.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="text-sm font-medium">
                    Total: ${Number(order.total).toLocaleString()} • Items: {order.order_items?.length}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 self-end md:self-center">
                    <Button variant="outline" size="sm" onClick={() => openDetails(order)}>Ver Detalles</Button>
                    
                    {['Pendiente', 'Pendiente de pago en efectivo'].includes(order.status) && (
                        <Button size="sm" onClick={() => handleUpdateStatus(order.id, 'Confirmado')}>Confirmar</Button>
                    )}
                    {order.status === 'Confirmado' && (
                        <Button size="sm" onClick={() => handleUpdateStatus(order.id, 'En preparación')}>Preparar</Button>
                    )}
                    {order.status === 'En preparación' && (
                         <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => handleUpdateStatus(order.id, 'Listo para recogida')}>
                            <Truck className="h-4 w-4 mr-2" /> Domiciliario
                         </Button>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Pedido #{selectedOrder?.id.substring(0,8)}</DialogTitle>
                    <DialogDescription>
                        Estado actual: <span className="font-semibold">{selectedOrder?.status}</span>
                    </DialogDescription>
                </DialogHeader>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    <div>
                        <h4 className="font-semibold mb-2 flex items-center"><User className="h-4 w-4 mr-2"/> Cliente</h4>
                        <p className="text-sm">{selectedOrder?.profiles?.full_name}</p>
                        <p className="text-sm">{selectedOrder?.profiles?.phone || 'N/A'}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2 flex items-center"><MapPin className="h-4 w-4 mr-2"/> Entrega</h4>
                        <p className="text-sm">{selectedOrder?.delivery_address || 'Recogida en tienda'}</p>
                    </div>
                </div>

                <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">Productos</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {selectedOrder?.order_items?.map(item => (
                            <div key={item.id} className="flex justify-between items-center text-sm p-2 border rounded">
                                <div className="flex items-center gap-3">
                                    <span>{item.quantity}x {item.products?.name}</span>
                                </div>
                                <span className="font-medium">${(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between items-center mt-4 text-lg font-bold">
                        <span>Total</span>
                        <span>${Number(selectedOrder?.total).toLocaleString()}</span>
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
