
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Calendar as CalendarIcon, Search, Plus, User, CreditCard, Save, X } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const HotelReservationsTab = ({ storeId }) => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRes, setSelectedRes] = useState(null); // The reservation being viewed/edited
  
  // Form State
  const [formData, setFormData] = useState({
      guestName: '',
      email: '',
      phone: '',
      address: '',
      checkIn: '',
      checkOut: '',
      roomId: '',
      adults: 1,
      children: 0,
      status: 'Confirmado',
      totalPrice: 0
  });

  useEffect(() => {
    fetchData();
  }, [storeId]);

  const fetchData = async () => {
    setLoading(true);
    // Fetch Rooms for dropdown
    const { data: roomsData } = await supabase.from('hotel_rooms').select('*').eq('store_id', storeId);
    setRooms(roomsData || []);

    // Fetch Reservations (Orders)
    const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });
    
    // Process orders into friendly reservation objects
    const processed = ordersData?.map(order => {
        let meta = {};
        try {
            meta = order.delivery_address ? JSON.parse(order.delivery_address) : {};
        } catch(e) { /* ignore */ }
        
        return {
            id: order.id,
            status: order.status,
            total: order.total,
            guest: meta.guest || { name: 'Desconocido', email: '' },
            reservation: meta.reservation || { checkIn: '', checkOut: '' },
            createdAt: order.created_at,
            originalOrder: order // Keep ref
        };
    }) || [];

    setReservations(processed);
    setLoading(false);
  };

  const handleSelectReservation = (res) => {
      setSelectedRes(res);
      setIsEditing(true);
      
      if (res) {
          // Populate form
          setFormData({
              guestName: res.guest.name || '',
              email: res.guest.email || '',
              phone: res.guest.phone || '',
              address: res.guest.address || '',
              checkIn: res.reservation.checkIn || '',
              checkOut: res.reservation.checkOut || '',
              roomId: res.reservation.roomId || '',
              adults: res.reservation.adults || 1,
              children: res.reservation.children || 0,
              status: res.status,
              totalPrice: res.total
          });
      } else {
          // New Reservation defaults
          setFormData({
              guestName: '',
              email: '',
              phone: '',
              address: '',
              checkIn: new Date().toISOString().split('T')[0],
              checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
              roomId: '',
              adults: 1,
              children: 0,
              status: 'Confirmado',
              totalPrice: 0
          });
      }
  };

  const handleSave = async (e) => {
      e.preventDefault();
      
      if (!formData.email) {
          toast({ title: "Error", description: "El email es obligatorio.", variant: "destructive" });
          return;
      }

      // Construct metadata JSON
      const room = rooms.find(r => r.id === formData.roomId);
      const metadata = {
          guest: {
              name: formData.guestName,
              email: formData.email,
              phone: formData.phone,
              address: formData.address
          },
          reservation: {
              roomId: formData.roomId,
              roomNumber: room ? room.number : 'N/A',
              checkIn: formData.checkIn,
              checkOut: formData.checkOut,
              adults: formData.adults,
              children: formData.children
          }
      };

      const payload = {
          store_id: storeId,
          customer_id: user.id, // Using current user (store owner) as proxy for "Walk-in/Admin Booking"
          status: formData.status,
          total: formData.totalPrice || 0,
          delivery_address: JSON.stringify(metadata) // Store structured data here
      };

      try {
          if (selectedRes && selectedRes.id) {
              // Update
              const { error } = await supabase.from('orders').update(payload).eq('id', selectedRes.id);
              if(error) throw error;
              toast({ title: "Reserva actualizada" });
          } else {
              // Create
              const { error } = await supabase.from('orders').insert(payload);
              if(error) throw error;
              toast({ title: "Reserva creada" });
          }
          setIsEditing(false);
          setSelectedRes(null);
          fetchData();
      } catch (err) {
          console.error(err);
          toast({ title: "Error al guardar", description: err.message, variant: "destructive" });
      }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-6">
      {/* List Section */}
      <div className={`flex-1 flex flex-col min-h-0 transition-all ${isEditing ? 'hidden lg:flex lg:w-1/3 lg:flex-none' : 'w-full'}`}>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Reservas</h2>
            <Button onClick={() => handleSelectReservation(null)} className="gap-2">
                <Plus className="h-4 w-4" /> Nueva Reserva
            </Button>
        </div>
        
        <Card className="flex-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-muted/30">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar por nombre o referencia..." className="pl-9" />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {reservations.map(res => (
                    <div 
                        key={res.id}
                        onClick={() => handleSelectReservation(res)}
                        className={`p-3 rounded-lg border cursor-pointer hover:bg-slate-50 transition-colors ${selectedRes?.id === res.id ? 'bg-slate-100 border-primary ring-1 ring-primary' : ''}`}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-semibold text-sm">{res.guest.name}</span>
                            <Badge variant="outline" className="text-xs">{res.status}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground grid grid-cols-2 gap-2">
                            <span className="flex items-center gap-1"><CalendarIcon className="h-3 w-3"/> {res.reservation.checkIn}</span>
                            <span className="flex items-center gap-1"><CreditCard className="h-3 w-3"/> ${Number(res.total).toLocaleString()}</span>
                        </div>
                    </div>
                ))}
                {reservations.length === 0 && <div className="p-4 text-center text-sm text-muted-foreground">No hay reservas encontradas.</div>}
            </div>
        </Card>
      </div>

      {/* Form Section (Inline) */}
      {(isEditing || selectedRes) && (
          <div className="flex-1 flex flex-col h-full animate-in slide-in-from-right-4 duration-200">
             <Card className="flex-1 overflow-y-auto">
                <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white z-10 border-b">
                    <div>
                        <CardTitle>{selectedRes ? 'Editar Reserva' : 'Nueva Reserva'}</CardTitle>
                        <CardDescription>Detalles de la estancia y huésped</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <form id="reservation-form" onSubmit={handleSave} className="space-y-6">
                        {/* Guest Details */}
                        <div className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2 text-primary">
                                <User className="h-4 w-4" /> Información del Huésped
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="guestName">Nombre Completo *</Label>
                                    <Input id="guestName" required value={formData.guestName} onChange={e => setFormData({...formData, guestName: e.target.value})} placeholder="Ej. Juan Pérez" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Correo Electrónico *</Label>
                                    <Input id="email" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="juan@ejemplo.com" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Teléfono</Label>
                                    <Input id="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+57 300 123 4567" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address">Dirección</Label>
                                    <Input id="address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Dirección principal" />
                                </div>
                            </div>
                        </div>

                        <div className="border-t pt-4 space-y-4">
                            <h3 className="font-semibold flex items-center gap-2 text-primary">
                                <CalendarIcon className="h-4 w-4" /> Detalles de la Estancia
                            </h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="checkIn">Fecha Entrada</Label>
                                    <Input id="checkIn" type="date" required value={formData.checkIn} onChange={e => setFormData({...formData, checkIn: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="checkOut">Fecha Salida</Label>
                                    <Input id="checkOut" type="date" required value={formData.checkOut} onChange={e => setFormData({...formData, checkOut: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="room">Habitación Asignada</Label>
                                    <Select value={formData.roomId} onValueChange={v => setFormData({...formData, roomId: v})}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar habitación" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Sin asignar</SelectItem>
                                            {rooms.map(room => (
                                                <SelectItem key={room.id} value={room.id}>
                                                    {room.number} - {room.type} (${Number(room.price_per_night).toLocaleString()})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="status">Estado Reserva</Label>
                                    <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Estado" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Confirmado">Confirmada</SelectItem>
                                            <SelectItem value="En curso">En House (Check-in)</SelectItem>
                                            <SelectItem value="Entregado">Completada (Check-out)</SelectItem>
                                            <SelectItem value="Cancelado">Cancelada</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="adults">Adultos</Label>
                                    <Input id="adults" type="number" min="1" value={formData.adults} onChange={e => setFormData({...formData, adults: parseInt(e.target.value)})} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="children">Niños</Label>
                                    <Input id="children" type="number" min="0" value={formData.children} onChange={e => setFormData({...formData, children: parseInt(e.target.value)})} />
                                </div>
                            </div>
                        </div>

                        <div className="border-t pt-4 space-y-4">
                            <h3 className="font-semibold flex items-center gap-2 text-primary">
                                <CreditCard className="h-4 w-4" /> Pago
                            </h3>
                             <div className="space-y-2">
                                <Label htmlFor="total">Total a Pagar ($)</Label>
                                <Input id="total" type="number" required value={formData.totalPrice} onChange={e => setFormData({...formData, totalPrice: e.target.value})} className="font-mono text-lg font-bold" />
                            </div>
                        </div>
                    </form>
                </CardContent>
                <div className="p-4 border-t bg-muted/20 flex justify-end gap-3 sticky bottom-0 z-10">
                    <Button variant="outline" type="button" onClick={() => setIsEditing(false)}>Cancelar</Button>
                    <Button type="submit" form="reservation-form">
                        <Save className="h-4 w-4 mr-2" /> Guardar Reserva
                    </Button>
                </div>
             </Card>
          </div>
      )}
      
      {!isEditing && !selectedRes && (
          <div className="hidden lg:flex flex-1 items-center justify-center bg-slate-50 border rounded-lg border-dashed">
              <div className="text-center text-muted-foreground">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Selecciona una reserva para ver detalles o crea una nueva.</p>
              </div>
          </div>
      )}
    </div>
  );
};

export default HotelReservationsTab;
