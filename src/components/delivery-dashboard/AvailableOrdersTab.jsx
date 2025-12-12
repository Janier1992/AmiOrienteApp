import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Truck, Eye } from 'lucide-react';

const AvailableOrdersTab = ({ isConnected, orders, onAcceptOrder, onViewDetails }) => {
  if (!isConnected) {
    return (
      <div className="text-center py-12 bg-slate-100 rounded-lg">
        <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Conéctate para ver pedidos disponibles.</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-100 rounded-lg">
        <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">No hay pedidos disponibles por ahora.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card key={order.id} className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold">Pedido #{order.id.substring(0, 8)}</p>
              <p className="text-sm text-gray-600">De: <span className="font-semibold">{order.stores?.name || 'N/A'}</span></p>
              <p className="text-sm text-gray-600">Cliente: <span className="font-semibold">{order.profiles?.full_name || 'N/A'}</span></p>
              <p className="text-lg font-bold text-green-600 mt-1">${Number(order.total).toLocaleString()}</p>
              {order.status === 'Pendiente de pago en efectivo' && <p className="text-xs font-semibold text-white bg-blue-600 px-2 py-1 rounded-full inline-block mt-2">Pago en Efectivo</p>}
            </div>
            <div className="flex flex-col items-end gap-2">
              <Button onClick={() => onAcceptOrder(order.id)}>Aceptar Pedido</Button>
              <Button variant="outline" size="sm" onClick={() => onViewDetails(order)}><Eye className="mr-2 h-4 w-4" />Ver Detalles</Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default AvailableOrdersTab;