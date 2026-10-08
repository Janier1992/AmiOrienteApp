import React from 'react';
import { Card } from '@/components/ui/card';
import { History } from 'lucide-react';

const HistoryOrdersTab = ({ orders }) => {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12 bg-muted rounded-lg">
        <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground font-medium">Aún no has completado entregas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card key={order.id} className="p-4 bg-green-50 border-green-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-bold text-foreground">Pedido #{order.id.substring(0, 8)}</p>
              <p className="text-sm text-muted-foreground">Entregado el {new Date(order.created_at).toLocaleDateString()}</p>
            </div>
            <p className="text-lg font-bold text-green-700 dark:text-green-400">${Number(order.total).toLocaleString()}</p>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default HistoryOrdersTab;