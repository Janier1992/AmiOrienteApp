import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const HotelBookingForm = ({ hotelName, onClose }) => {
  const [guests, setGuests] = useState(2);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "¡Reserva Solicitada!",
        description: `Tu solicitud para ${hotelName} ha sido enviada. Te contactaremos pronto para confirmar.`,
      });
      if (onClose) onClose();
    }, 1500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4 p-4 border rounded-lg bg-slate-50">
      <h3 className="font-semibold text-lg mb-2">Reservar en {hotelName}</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Fecha de Llegada</Label>
          <Input type="date" required className="bg-white" />
        </div>
        <div className="space-y-2">
          <Label>Fecha de Salida</Label>
          <Input type="date" required className="bg-white" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Huéspedes</Label>
        <Input 
          type="number" 
          min="1" 
          max="10" 
          value={guests} 
          onChange={(e) => setGuests(e.target.value)}
          required
          className="bg-white"
        />
      </div>

      <div className="space-y-2">
        <Label>Nombre Completo</Label>
        <Input placeholder="Tu nombre" required className="bg-white" />
      </div>
      
      <div className="space-y-2">
        <Label>Teléfono de Contacto</Label>
        <Input placeholder="+57 300 123 4567" type="tel" required className="bg-white" />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {loading ? 'Procesando...' : 'Solicitar Reserva'}
      </Button>
    </form>
  );
};

export default HotelBookingForm;