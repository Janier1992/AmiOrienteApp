import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, MapPin, Navigation, Phone, Check } from 'lucide-react';
import DeliveryMap from './DeliveryMap';

const InProgressOrdersTab = ({ orders, onCompleteOrder }) => {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-100 rounded-lg">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">No tienes entregas en curso.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card key={order.id} className="p-4 border-2 border-blue-500 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-blue-700">Pedido #{order.id.substring(0, 8)}</p>
              <p className="text-sm text-gray-600 mt-2"><MapPin className="inline h-4 w-4 mr-1 text-blue-500" />Recoger en: <span className="font-semibold">{order.deliveries?.pickup_address || 'N/A'}</span></p>
              <p className="text-sm text-gray-600"><MapPin className="inline h-4 w-4 mr-1 text-green-500" />Entregar a: <span className="font-semibold">{order.deliveries?.delivery_address || 'N/A'}</span></p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-green-600">${Number(order.total).toLocaleString()}</p>
              {order.status === 'Pendiente de pago en efectivo' && <p className="text-xs font-semibold text-white bg-blue-600 px-2 py-1 rounded-full inline-block mt-1">Cobrar en Efectivo</p>}
            </div>
          </div>
          <DeliveryMap delivery={order.deliveries} />
          <div className="flex justify-end items-center mt-4 gap-2">
            <a href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(order.deliveries?.pickup_address || '')}&destination=${encodeURIComponent(order.deliveries?.delivery_address || '')}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" disabled={!order.deliveries?.pickup_address || !order.deliveries?.delivery_address}><Navigation className="h-4 w-4 mr-2" />Navegar</Button>
            </a>
            <a href={`tel:${order.profiles?.phone}`}>
              <Button variant="outline" size="sm" disabled={!order.profiles?.phone}><Phone className="h-4 w-4 mr-2" />Llamar</Button>
            </a>
            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => onCompleteOrder(order.id)}><Check className="h-4 w-4 mr-2" />Completar</Button>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default InProgressOrdersTab;