import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Package, Truck, CheckCircle, XCircle, Clock } from 'lucide-react';
import OrderDetailsModal from './OrderDetailsModal';
import DriverCard from '@/components/customer-dashboard/DriverCard';
import OrderTrackingMap from './OrderTrackingMap';
import { Button } from '@/components/ui/button';
import CancelOrderDialog from '@/components/shared/CancelOrderDialog';
import { toast } from '@/components/ui/use-toast';
import { orderService } from '@/services/orderService';
import { CUSTOMER_CANCELABLE_STATUSES, isActiveOrder } from '@/lib/orderRules';

export const OrdersTab = ({ orders, onOrdersChanged }) => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderToCancel, setOrderToCancel] = useState(null);

  const handleCancel = async (reason) => {
    try {
      await orderService.cancelarPedido(orderToCancel.id, reason);
      toast({ title: 'Pedido cancelado', description: 'El negocio fue avisado.' });
      setOrderToCancel(null);
      if (onOrdersChanged) await onOrdersChanged();
    } catch (e) {
      toast({ title: 'No se pudo cancelar', description: e.message, variant: 'destructive' });
    }
  };

  const activeOrders = orders.filter(isActiveOrder);
  const pastOrders = orders.filter(o => !isActiveOrder(o));

  const getStatusInfo = (status) => {
    switch (status) {
      case 'Nuevo':
      case 'Pendiente':
      case 'Pendiente de pago en efectivo':
        return { icon: <Clock className="h-4 w-4" />, color: 'bg-yellow-100 text-yellow-800', text: 'Enviado al negocio' };
      case 'Confirmado':
        return { icon: <CheckCircle className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800', text: 'Confirmado' };
      case 'En preparación':
        return { icon: <Package className="h-4 w-4" />, color: 'bg-purple-100 text-purple-800', text: 'Preparando' };
      case 'Listo para recogida':
        return { icon: <Package className="h-4 w-4" />, color: 'bg-indigo-100 text-indigo-800', text: 'Listo, esperando domiciliario' };
      case 'En curso':
        return { icon: <Truck className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800', text: 'En Camino' };
      case 'Entregado':
        return { icon: <CheckCircle className="h-4 w-4" />, color: 'bg-green-100 text-green-800', text: 'Entregado' };
      default:
        return { icon: <XCircle className="h-4 w-4" />, color: 'bg-red-100 text-red-800', text: status };
    }
  };

  const OrderCard = ({ order, isActive }) => {
    const status = getStatusInfo(order.status);
    return (
        <div className="border rounded-lg p-5 bg-card hover:bg-accent/5 transition-colors cursor-pointer" onClick={() => setSelectedOrder(order)}>
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${status.color}`}>
                        {status.icon}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg">{order.stores?.name}</h3>
                            <Badge variant="outline" className="text-xs">{status.text}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Pedido #{order.id.substring(0,8)} • {new Date(order.created_at).toLocaleDateString()}</p>
                        <p className="font-medium mt-1 text-primary">{order.order_items?.length || 0} productos • ${Number(order.total).toLocaleString()}</p>
                    </div>
                </div>
                
                {isActive && order.status === 'En curso' && (
                    <div className="text-right flex flex-col justify-center">
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">Estado</span>
                        <span className="text-lg font-bold text-blue-600">Tu pedido va en camino</span>
                    </div>
                )}
            </div>

            {isActive && CUSTOMER_CANCELABLE_STATUSES.includes(order.status) && (
                <div className="mt-4 flex justify-end">
                    <Button variant="outline" size="sm" className="text-red-600" onClick={(e) => { e.stopPropagation(); setOrderToCancel(order); }}>
                        Cancelar pedido
                    </Button>
                </div>
            )}

            {order.status === 'Cancelado' && order.cancellation_reason && (
                <p className="mt-3 text-sm text-muted-foreground">Motivo: {order.cancellation_reason}</p>
            )}

            {isActive && order.status === 'En curso' && order.deliveries && (
                <div className="mt-6 border-t pt-4 space-y-4">
                     <DriverCard orderId={order.id} />
                     <p className="text-xs font-bold text-muted-foreground uppercase mb-3 flex items-center gap-2">
                        <Truck className="h-3 w-3" /> Rastreo en Tiempo Real
                     </p>
                     <OrderTrackingMap delivery={order.deliveries} />
                </div>
            )}
        </div>
    );
  };

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-2xl">Mis Pedidos</CardTitle>
        <CardDescription>Rastrea tus envíos y revisa tu historial.</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Tabs defaultValue="activos" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="activos">En Curso ({activeOrders.length})</TabsTrigger>
                <TabsTrigger value="historial">Historial ({pastOrders.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="activos" className="space-y-4">
                {activeOrders.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-xl">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-20" />
                        <p className="text-muted-foreground">No tienes pedidos activos en este momento.</p>
                        <Button variant="link" className="mt-2 text-primary">Ir a comprar</Button>
                    </div>
                ) : (
                    activeOrders.map(order => <OrderCard key={order.id} order={order} isActive={true} />)
                )}
            </TabsContent>

            <TabsContent value="historial" className="space-y-4">
                {pastOrders.map(order => <OrderCard key={order.id} order={order} isActive={false} />)}
            </TabsContent>
        </Tabs>
      </CardContent>

      <CancelOrderDialog
        order={orderToCancel}
        isOpen={!!orderToCancel}
        audience="cliente"
        onClose={() => setOrderToCancel(null)}
        onConfirm={handleCancel}
      />

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </Card>
  );
};