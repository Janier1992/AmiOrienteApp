import React from 'react';
import { Card } from '@/components/ui/card';
import { History } from 'lucide-react';

const HistoryOrdersTab = ({ orders }) => {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-100 rounded-lg">
        <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Aún no has completado entregas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card key={order.id} className="p-4 bg-green-50 border-green-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-bold text-gray-700">Pedido #{order.id.substring(0, 8)}</p>
              <p className="text-sm text-gray-500">Entregado el {new Date(order.created_at).toLocaleDateString()}</p>
            </div>
            <p className="text-lg font-bold text-green-700">${Number(order.total).toLocaleString()}</p>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default HistoryOrdersTab;