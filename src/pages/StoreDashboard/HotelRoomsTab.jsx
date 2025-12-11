
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Key } from 'lucide-react';

const HotelRoomsTab = ({ storeId }) => {
    const [rooms, setRooms] = useState([]);
    
    useEffect(() => { if(storeId) fetchRooms(); }, [storeId]);
  
    const fetchRooms = async () => {
      const { data } = await supabase.from('hotel_rooms').select('*').eq('store_id', storeId).order('number');
      if(data) setRooms(data);
    };
  
    const addRoom = async () => {
      const number = prompt("Número de Habitación:");
      if(!number) return;
      
      const type = prompt("Tipo (Simple, Doble, Suite):", "Doble");
      const price = prompt("Precio por noche:", "120000");
      
      const { error } = await supabase.from('hotel_rooms').insert({ store_id: storeId, number, type, price_per_night: price });
      if(error) toast({title: "Error", description: error.message});
      else fetchRooms();
    };
  
    const toggleStatus = async (room) => {
      const states = ['available', 'occupied', 'cleaning'];
      const currentIdx = states.indexOf(room.status);
      const nextStatus = states[(currentIdx + 1) % states.length];
      
      await supabase.from('hotel_rooms').update({ status: nextStatus }).eq('id', room.id);
      fetchRooms();
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'occupied': return 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100';
            case 'cleaning': return 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100';
            default: return 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100';
        }
    };

    const getStatusLabel = (status) => {
        switch(status) {
            case 'occupied': return 'Ocupada';
            case 'cleaning': return 'Limpieza';
            default: return 'Disponible';
        }
    };
  
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gestión de Habitaciones</CardTitle>
          <Button onClick={addRoom}>+ Nueva Habitación</Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {rooms.map(room => (
              <div 
                  key={room.id} 
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all shadow-sm ${getStatusColor(room.status)}`}
                  onClick={() => toggleStatus(room)}
              >
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-bold text-2xl">{room.number}</span>
                    <Key className="h-5 w-5 opacity-50"/>
                  </div>
                  <p className="text-sm font-medium mb-1">{room.type}</p>
                  <p className="text-xs opacity-75 mb-3">${Number(room.price_per_night).toLocaleString()}/noche</p>
                  <Badge variant="outline" className="w-full justify-center bg-white/50 border-current font-bold">
                      {getStatusLabel(room.status)}
                  </Badge>
              </div>
            ))}
             {rooms.length === 0 && <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">No hay habitaciones registradas. Añade una para comenzar.</div>}
          </div>
        </CardContent>
      </Card>
    );
};

export default HotelRoomsTab;
