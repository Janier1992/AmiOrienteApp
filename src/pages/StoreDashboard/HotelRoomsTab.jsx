
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Key } from 'lucide-react';
import { useHotelStore } from '@/stores/useHotelStore';

const HotelRoomsTab = ({ storeId }) => {
  // Modular State from specialized store
  const { rooms, fetchRooms, isLoadingRooms, toggleRoomStatus, addRoom: addRoomAction, error } = useHotelStore();

  useEffect(() => {
    if (storeId) fetchRooms(storeId);
  }, [storeId, fetchRooms]);

  const handleAddRoom = async () => {
    const number = prompt("Número de Habitación:");
    if (!number) return;

    const type = prompt("Tipo (Simple, Doble, Suite):", "Doble");
    const price = prompt("Precio por noche:", "120000");

    try {
      await addRoomAction({ store_id: storeId, number, type, price_per_night: price });
      toast({ title: "Habitación creada" });
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'occupied': return 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100';
      case 'cleaning': return 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100';
      case 'maintenance': return 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100';
      default: return 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'occupied': return 'Ocupada';
      case 'cleaning': return 'Limpieza';
      case 'maintenance': return 'Mantenimiento';
      default: return 'Disponible';
    }
  };

  if (isLoadingRooms && rooms.length === 0) return <div className="p-4">Cargando habitaciones...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gestión de Habitaciones</CardTitle>
        <Button onClick={handleAddRoom}>+ Nueva Habitación</Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {rooms.map(room => (
            <div
              key={room.id}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all shadow-sm ${getStatusColor(room.status)}`}
              onClick={() => toggleRoomStatus(room.id, room.status)}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="font-bold text-2xl">{room.number}</span>
                <Key className="h-5 w-5 opacity-50" />
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

