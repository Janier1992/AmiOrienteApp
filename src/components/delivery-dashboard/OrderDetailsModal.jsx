import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

const OrderDetailsModal = ({ order, open, onOpenChange }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Detalles del Pedido #{order?.id.substring(0, 8)}</DialogTitle>
        <DialogDescription>
          De {order?.stores?.name} para {order?.profiles?.full_name}.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        {order?.order_items?.map(item => (
          <div key={item.id} className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={item.products?.image_url || 'https://placehold.co/64'} alt={item.products?.name} className="w-16 h-16 rounded-md object-cover" />
              <div>
                <p className="font-semibold">{item.products?.name}</p>
                <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
              </div>
            </div>
            <p className="font-semibold">${(item.price * item.quantity).toLocaleString()}</p>
          </div>
        ))}
      </div>
      <DialogFooter className="pt-4 border-t">
        <div className="w-full flex justify-between font-bold text-lg">
          <span>Total a Recaudar:</span>
          <span>${Number(order?.total).toLocaleString()}</span>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default OrderDetailsModal;