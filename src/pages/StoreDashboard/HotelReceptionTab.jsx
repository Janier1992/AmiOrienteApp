
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Clock, LogIn, LogOut, User } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { format, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const HotelReceptionTab = ({ storeId }) => {
  const [todaysActivity, setTodaysActivity] = useState({ arrivals: [], departures: [], staying: [] });
  const [stats, setStats] = useState({ available: 0, occupied: 0, cleaning: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [storeId]);

  const fetchData = async () => {
    setLoading(true);
    const today = new Date();

    // Fetch Rooms Status
    const { data: rooms } = await supabase.from('hotel_rooms').select('status').eq('store_id', storeId);
    if (rooms) {
      setStats({
        available: rooms.filter(r => r.status === 'available').length,
        occupied: rooms.filter(r => r.status === 'occupied').length,
        cleaning: rooms.filter(r => r.status === 'cleaning').length,
      });
    }

    // Fetch Orders (Reservations)
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('store_id', storeId)
      .neq('status', 'Cancelado');

    if (orders) {
      const arrivals = [];
      const departures = [];
      const staying = [];

      orders.forEach(order => {
        try {
          // Parse our custom metadata from delivery_address
          const meta = order.delivery_address ? JSON.parse(order.delivery_address) : null;
          if (meta && meta.reservation) {
            const checkIn = parseISO(meta.reservation.checkIn);
            const checkOut = parseISO(meta.reservation.checkOut);

            const guestName = meta.guest?.name || 'Huésped';
            const roomNumber = meta.reservation?.roomNumber || 'Asignar';
            
            const item = { ...order, guestName, roomNumber, meta };

            if (isSameDay(checkIn, today) && order.status === 'Confirmado') {
              arrivals.push(item);
            }
            if (isSameDay(checkOut, today) && order.status === 'En curso') {
              departures.push(item);
            }
            if (order.status === 'En curso' && !isSameDay(checkOut, today)) {
              staying.push(item);
            }
          }
        } catch (e) {
          // Ignore legacy orders without valid JSON
        }
      });

      setTodaysActivity({ arrivals, departures, staying });
    }
    setLoading(false);
  };

  const updateStatus = async (orderId, newStatus) => {
      await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      fetchData();
  };

  const ActivityList = ({ items, type }) => {
      if (items.length === 0) return <div className="text-center py-8 text-muted-foreground">No hay actividad programada.</div>;
      
      return (
          <div className="space-y-3">
              {items.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm">
                      <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${type === 'in' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                              {type === 'in' ? <LogIn className="h-4 w-4" /> : <LogOut className="h-4 w-4" />}
                          </div>
                          <div>
                              <p className="font-medium text-sm">{item.guestName}</p>
                              <div className="flex gap-2 text-xs text-muted-foreground">
                                  <span className="flex items-center"><User className="h-3 w-3 mr-1"/> {item.meta?.reservation?.adults || 1}</span>
                                  <span>Hab: {item.roomNumber}</span>
                              </div>
                          </div>
                      </div>
                      {type === 'in' && (
                          <Button size="sm" onClick={() => updateStatus(item.id, 'En curso')}>Check-in</Button>
                      )}
                      {type === 'out' && (
                          <Button size="sm" variant="outline" onClick={() => updateStatus(item.id, 'Entregado')}>Check-out</Button>
                      )}
                  </div>
              ))}
          </div>
      )
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-green-700 text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5"/> Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-green-800">{stats.available}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
           <CardHeader className="pb-2">
            <CardTitle className="text-blue-700 text-lg flex items-center gap-2">
              <User className="h-5 w-5"/> Ocupadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-blue-800">{stats.occupied}</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
           <CardHeader className="pb-2">
            <CardTitle className="text-yellow-700 text-lg flex items-center gap-2">
              <Clock className="h-5 w-5"/> Limpieza
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-yellow-800">{stats.cleaning}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="col-span-1 lg:col-span-2">
              <CardHeader>
                  <CardTitle>Operaciones de Hoy</CardTitle>
                  <CardDescription>{format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es })}</CardDescription>
              </CardHeader>
              <CardContent>
                  <Tabs defaultValue="arrivals" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="arrivals">Llegadas ({todaysActivity.arrivals.length})</TabsTrigger>
                          <TabsTrigger value="departures">Salidas ({todaysActivity.departures.length})</TabsTrigger>
                          <TabsTrigger value="staying">Hospedados ({todaysActivity.staying.length})</TabsTrigger>
                      </TabsList>
                      <TabsContent value="arrivals" className="mt-4">
                          <ActivityList items={todaysActivity.arrivals} type="in" />
                      </TabsContent>
                      <TabsContent value="departures" className="mt-4">
                          <ActivityList items={todaysActivity.departures} type="out" />
                      </TabsContent>
                      <TabsContent value="staying" className="mt-4">
                          <ActivityList items={todaysActivity.staying} type="stay" />
                      </TabsContent>
                  </Tabs>
              </CardContent>
          </Card>
      </div>
    </div>
  );
};

export default HotelReceptionTab;
