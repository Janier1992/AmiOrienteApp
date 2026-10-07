import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { buildWhatsAppUrl } from '@/lib/contact';

/**
 * Solicitud de reserva: arma el mensaje y lo envía al hotel por WhatsApp.
 * (Antes simulaba el envío sin guardar nada; ahora el hotel recibe la solicitud de verdad.)
 */
const HotelBookingForm = ({ hotelName, phone, onClose }) => {
  const [form, setForm] = useState({ checkIn: '', checkOut: '', guests: 2, name: '', phone: '' });
  const { toast } = useToast();

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = (e) => {
    e.preventDefault();

    if (form.checkOut <= form.checkIn) {
      toast({ title: "Fechas inválidas", description: "La salida debe ser posterior a la llegada.", variant: "destructive" });
      return;
    }

    const message =
      `Hola ${hotelName}, quiero solicitar una reserva:\n` +
      `• Llegada: ${form.checkIn}\n• Salida: ${form.checkOut}\n• Huéspedes: ${form.guests}\n` +
      `• Nombre: ${form.name}\n• Teléfono: ${form.phone}\n\nEnviado desde AmiOriente.`;
    const url = buildWhatsAppUrl(phone, message);

    if (!url) {
      toast({ title: "Sin contacto disponible", description: "Este establecimiento aún no tiene un teléfono registrado.", variant: "destructive" });
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
    toast({ title: "Abrimos WhatsApp", description: "Envía el mensaje para que el hotel reciba tu solicitud." });
    if (onClose) onClose();
  };

  if (!phone) {
    return (
      <div className="mt-4 p-4 border rounded-lg bg-slate-50 text-sm text-muted-foreground">
        Este establecimiento aún no tiene un teléfono registrado para recibir reservas.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4 p-4 border rounded-lg bg-slate-50">
      <h3 className="font-semibold text-lg mb-2">Reservar en {hotelName}</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Fecha de Llegada</Label>
          <Input type="date" required min={today} value={form.checkIn} onChange={update('checkIn')} className="bg-white" />
        </div>
        <div className="space-y-2">
          <Label>Fecha de Salida</Label>
          <Input type="date" required min={form.checkIn || today} value={form.checkOut} onChange={update('checkOut')} className="bg-white" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Huéspedes</Label>
        <Input type="number" min="1" max="10" required value={form.guests} onChange={update('guests')} className="bg-white" />
      </div>

      <div className="space-y-2">
        <Label>Nombre Completo</Label>
        <Input placeholder="Tu nombre" required value={form.name} onChange={update('name')} className="bg-white" />
      </div>

      <div className="space-y-2">
        <Label>Teléfono de Contacto</Label>
        <Input placeholder="+57 300 123 4567" type="tel" required value={form.phone} onChange={update('phone')} className="bg-white" />
      </div>

      <Button type="submit" className="w-full">
        <MessageCircle className="mr-2 h-4 w-4" />
        Solicitar reserva por WhatsApp
      </Button>
    </form>
  );
};

export default HotelBookingForm;
