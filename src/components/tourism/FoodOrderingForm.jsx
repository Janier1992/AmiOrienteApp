import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';

// Mock menu for demo purposes
const MOCK_MENU = [
  { id: 1, name: 'Bandeja Paisa', price: 35000 },
  { id: 2, name: 'Cazuela de Frijoles', price: 28000 },
  { id: 3, name: 'Chicharrón Carnudo', price: 18000 },
  { id: 4, name: 'Jugo Natural', price: 8000 },
];

const FoodOrderingForm = ({ restaurantName, onClose }) => {
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const updateQuantity = (itemId, change) => {
    setCart(prev => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, current + change);
      if (next === 0) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: next };
    });
  };

  const total = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = MOCK_MENU.find(i => i.id === parseInt(id));
    return sum + (item.price * qty);
  }, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (total === 0) {
      toast({ title: "Carrito vacío", description: "Por favor agrega productos.", variant: "destructive" });
      return;
    }

    setLoading(true);
    // Simulate order placement
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "¡Pedido Enviado!",
        description: `Tu pedido a ${restaurantName} está siendo procesado. Un domiciliario lo aceptará pronto.`,
      });
      onClose();
    }, 1500);
  };

  return (
    <div className="space-y-4 mt-4 border rounded-lg bg-slate-50 p-4">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        <ShoppingBag className="h-5 w-5" />
        Pedir a Domicilio - {restaurantName}
      </h3>

      <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
        {MOCK_MENU.map(item => (
          <div key={item.id} className="flex items-center justify-between bg-white p-2 rounded border">
            <div>
              <p className="font-medium text-sm">{item.name}</p>
              <p className="text-xs text-gray-500">${item.price.toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateQuantity(item.id, -1)}>
                <Minus className="h-3 w-3" />
              </Button>
              <span className="text-sm w-4 text-center">{cart[item.id] || 0}</span>
              <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateQuantity(item.id, 1)}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t">
        <div className="flex justify-between font-bold mb-4">
          <span>Total:</span>
          <span>${total.toLocaleString()}</span>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Dirección de Entrega</Label>
            <Input required placeholder="Cra 30 # 29..." className="bg-white h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Notas (Opcional)</Label>
            <Textarea placeholder="Sin cebolla, timbre dañado..." className="bg-white h-16 text-sm" />
          </div>
          <Button type="submit" className="w-full" disabled={loading || total === 0}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {loading ? 'Enviando...' : 'Confirmar Pedido'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default FoodOrderingForm;