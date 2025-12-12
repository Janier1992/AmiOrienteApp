import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Package, Truck, CheckCircle, XCircle, Clock } from 'lucide-react';
import OrderDetailsModal from './OrderDetailsModal';
import OrderTrackingMap from './OrderTrackingMap';
import { Button } from '@/components/ui/button';

export const OrdersTab = ({ orders }) => {
  const [selectedOrder, setSelectedOrder] = useState(null);

  const activeOrders = orders.filter(o => ['Pendiente', 'Pendiente de pago en efectivo', 'En curso'].includes(o.status));
  const pastOrders = orders.filter(o => ['Entregado', 'Cancelado'].includes(o.status));

  const getStatusInfo = (status) => {
    switch (status) {
      case 'Pendiente':
      case 'Pendiente de pago en efectivo':
        return { icon: <Clock className="h-4 w-4" />, color: 'bg-yellow-100 text-yellow-800', text: 'Preparando' };
      case 'En curso':
        return { icon: <Truck className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800', text: 'En Camino' };
      case 'Entregado':
        return { icon: <CheckCircle className="h-4 w-4" />, color: 'bg-green-100 text-green-800', text: 'Entregado' };
      default:
        return { icon: <XCircle className="h-4 w-4" />, color: 'bg-red-100 text-red-800', text: status };
    }
  };

  const calculateETA = (created_at) => {
    const start = new Date(created_at);
    const eta = new Date(start.getTime() + 45 * 60000); // +45 mins mock
    return eta.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
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
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">Entrega Estimada</span>
                        <span className="text-2xl font-bold text-blue-600">{calculateETA(order.created_at)}</span>
                    </div>
                )}
            </div>

            {isActive && order.status === 'En curso' && order.deliveries && (
                <div className="mt-6 border-t pt-4">
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