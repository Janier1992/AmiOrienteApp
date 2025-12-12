import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CheckCircle, XCircle, Trash2, Eye, Truck, Package } from 'lucide-react';

const OrderList = ({ orders, onViewDetails, onCancelOrder }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Entregado': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'En curso': return <Truck className="h-5 w-5 text-blue-500 animate-pulse" />;
      case 'Cancelado': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {orders.length === 0 ? (
        <p>No tienes pedidos aún.</p>
      ) : orders.map(order => (
        <div key={order.id} className="border rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-grow">
            <p className="font-bold text-primary">Pedido #{order.id.substring(0, 8)}</p>
            <p className="text-sm text-gray-500">Fecha: {new Date(order.created_at).toLocaleDateString()}</p>
            <p className="font-semibold">Total: ${Number(order.total).toLocaleString()}</p>
            <div className="flex items-center space-x-2 mt-2">
              {getStatusIcon(order.status)}
              <span className="font-medium">{order.status}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 self-end sm:self-center">
            <Button variant="outline" size="sm" onClick={() => onViewDetails(order)}>
              <Eye className="mr-2 h-4 w-4" /> Ver Detalles
            </Button>
            {order.status !== 'Entregado' && order.status !== 'Cancelado' && order.status !== 'En curso' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" /> Cancelar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Cancelarás el pedido #{order.id.substring(0, 8)} y los productos serán devueltos al inventario de la tienda.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>No, mantener pedido</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onCancelOrder(order.id)}>Sí, cancelar pedido</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderList;