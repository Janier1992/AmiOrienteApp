import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Truck, LogOut, Package, History, Loader2, Menu, Home, X } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Helmet } from 'react-helmet';
import AvailableOrdersTab from '@/components/delivery-dashboard/AvailableOrdersTab';
import InProgressOrdersTab from '@/components/delivery-dashboard/InProgressOrdersTab';
import HistoryOrdersTab from '@/components/delivery-dashboard/HistoryOrdersTab';
import OrderDetailsModal from '@/components/delivery-dashboard/OrderDetailsModal';
import deliveryService from '@/services/deliveryService';

// ... (DeliverySidebar component remains unchanged, assuming it is defined above or imported)
const DeliverySidebar = ({ isOpen, onClose, activeTab, onTabChange, isConnected, onConnect, onLogout, user }) => {
  const navigate = useNavigate();
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`
                  fixed top-0 left-0 z-50 h-full w-64 bg-card border-r shadow-lg lg:shadow-none lg:relative lg:translate-x-0
                  transform transition-transform duration-300 ease-in-out
                  ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 border-b px-4 shrink-0 bg-primary/5">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              <span className="font-bold text-lg">Domiciliario</span>
            </div>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="p-4 space-y-4 flex-1">
            <div className="p-4 bg-muted/30 rounded-lg border">
              <p className="text-sm font-medium mb-2">Estado: <span className={isConnected ? "text-green-600" : "text-gray-500"}>{isConnected ? "Conectado" : "Desconectado"}</span></p>
              <Button
                onClick={onConnect}
                size="sm"
                className={`w-full ${isConnected ? "bg-destructive hover:bg-destructive/80" : "bg-primary hover:bg-primary/80"}`}
              >
                {isConnected ? "Desconectarse" : "Conectarse"}
              </Button>
            </div>

            <div className="space-y-1">
              <Button
                variant={activeTab === 'disponibles' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => { onTabChange('disponibles'); onClose(); }}
              >
                <Package className="mr-2 h-4 w-4" /> Disponibles
              </Button>
              <Button
                variant={activeTab === 'curso' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => { onTabChange('curso'); onClose(); }}
              >
                <Truck className="mr-2 h-4 w-4" /> En curso
              </Button>
              <Button
                variant={activeTab === 'historial' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => { onTabChange('historial'); onClose(); }}
              >
                <History className="mr-2 h-4 w-4" /> Historial
              </Button>
            </div>
          </div>

          <div className="p-4 border-t space-y-2 bg-muted/10">
            <div className="px-2 pb-2">
              <p className="text-xs font-medium text-muted-foreground">Conectado como:</p>
              <p className="text-sm truncate font-semibold" title={user?.email}>{user?.email}</p>
            </div>
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/')}>
              <Home className="mr-2 h-4 w-4" /> Ir al inicio
            </Button>
            <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}

const DeliveryDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('disponibles');

  // Estados para datos
  const [availableOrders, setAvailableOrders] = useState([]);
  const [currentDelivery, setCurrentDelivery] = useState(null);
  const [historyOrders, setHistoryOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const locationIntervalRef = useRef(null);

  const fetchData = useCallback(async (currentUserId) => {
    if (!currentUserId) return;
    setLoading(true);
    try {
      // Cargar pedidos disponibles
      const disponibles = await deliveryService.obtenerPedidosDisponibles();
      setAvailableOrders(disponibles || []);

      // Cargar entrega actual
      const actual = await deliveryService.obtenerEntregaActual(currentUserId);

      // Si hay una entrega actual, la formateamos para que coincida con lo que esperan los componentes hijos
      // La estructura retornada por el servicio tiene `orders` anidado, pero los componentes pueden esperar la orden plana con `deliveries`
      // Ajustamos según necesidad visual. 
      // Si el componente InProgressOrdersTab espera una lista de ordenes, le pasamos un array con la orden actual.
      // Pero InProgressOrdersTab espera `orders` donde la orden tiene `deliveries`.
      // El servicio retorna el objeto `delivery` con `orders` dentro.
      // Transformamos para compatibilidad:
      let formattedCurrent = [];
      if (actual && actual.orders) {
        formattedCurrent = [{
          ...actual.orders,
          deliveries: [actual] // Simulamos la estructura original de array 
        }];
      }
      setCurrentDelivery(formattedCurrent);

      // Cargar historial
      const historial = await deliveryService.obtenerHistorialEntregas(currentUserId);
      // Historial retorna deliveries con orders anidados. Transformamos a orders.
      const formattedHistory = historial.map(h => ({
        ...h.orders,
        deliveries: [h]
      }));
      setHistoryOrders(formattedHistory);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ title: "Error", description: "No se pudieron cargar los datos.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/domiciliario/login');
      return;
    }
    fetchData(user.id);
  }, [user, navigate, authLoading, fetchData]);

  useEffect(() => {
    if (!user) return;
    // Suscripción simplificada para refrescar todo al haber cambios
    const channel = supabase
      .channel('public-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchData(user.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries' }, () => fetchData(user.id))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchData]);

  const sendLocation = useCallback(async () => {
    if (!user) return;
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await deliveryService.actualizarUbicacion(user.id, latitude, longitude);
      },
      (error) => console.error("Error getting location:", error),
      { enableHighAccuracy: true }
    );
  }, [user]);

  useEffect(() => {
    if (isConnected) {
      sendLocation();
      locationIntervalRef.current = setInterval(sendLocation, 30000);
    } else {
      if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
    }
    return () => {
      if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
    };
  }, [isConnected, sendLocation]);

  const handleConnect = () => setIsConnected(!isConnected);

  const handleLogout = async () => {
    await signOut();
    toast({ title: "Sesión cerrada" });
    navigate('/');
  };

  const handleAcceptOrder = async (orderId) => {
    if (!user) return;
    try {
      await deliveryService.aceptarEntrega(orderId, user.id);
      await fetchData(user.id);

      toast({ title: "¡Pedido Aceptado!", description: "El pedido ahora está en tu lista 'En Curso'." });
      setActiveTab('curso');
    } catch (error) {
      console.error("Error accepting order:", error);
      toast({ title: "Error", description: error.message || "No se pudo aceptar el pedido.", variant: "destructive" });
    }
  };

  const handleCompleteOrder = async (orderId) => {
    try {
      await deliveryService.actualizarEstadoEntrega(orderId, 'Entregado');
      await fetchData(user.id);

      toast({ title: "¡Entrega Completada!", description: "¡Buen trabajo!" });
      setActiveTab('historial');
    } catch (error) {
      console.error("Error completing order:", error);
      toast({ title: "Error", description: error.message || "No se pudo completar la entrega.", variant: "destructive" });
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrderForDetails(order);
    setIsDetailsModalOpen(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      <Helmet>
        <title>Panel Domiciliario</title>
      </Helmet>

      {/* Mobile Toggle Button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden shadow-md bg-background"
        onClick={() => setIsSidebarOpen(true)}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Menu</span>
      </Button>

      <DeliverySidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isConnected={isConnected}
        onConnect={handleConnect}
        onLogout={handleLogout}
        user={user}
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0 min-w-0 overflow-y-auto max-h-screen">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold">Panel de Entregas</h1>
              <p className="text-muted-foreground">Gestiona tus pedidos disponibles y entregas activas.</p>
            </div>
          </div>

          <Card className="bg-card text-card-foreground border-border w-full">
            <CardContent className="p-0 sm:p-6">
              {loading ? <div className="flex items-center justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div> : (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/50 p-1">
                    <TabsTrigger value="disponibles" className="text-xs sm:text-sm">
                      <Package className="mr-1 sm:mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Disponibles</span> ({availableOrders.length})
                    </TabsTrigger>
                    <TabsTrigger value="curso" className="text-xs sm:text-sm">
                      <Truck className="mr-1 sm:mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">En curso</span> ({currentDelivery ? currentDelivery.length : 0})
                    </TabsTrigger>
                    <TabsTrigger value="historial" className="text-xs sm:text-sm">
                      <History className="mr-1 sm:mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Historial</span> ({historyOrders.length})
                    </TabsTrigger>
                  </TabsList>

                  <div className="p-4 sm:p-0">
                    <TabsContent value="disponibles" className="mt-0">
                      <AvailableOrdersTab
                        isConnected={isConnected}
                        orders={availableOrders}
                        onAcceptOrder={handleAcceptOrder}
                        onViewDetails={handleViewDetails}
                      />
                    </TabsContent>

                    <TabsContent value="curso" className="mt-0">
                      <InProgressOrdersTab
                        orders={currentDelivery || []}
                        onCompleteOrder={handleCompleteOrder}
                      />
                    </TabsContent>

                    <TabsContent value="historial" className="mt-0">
                      <HistoryOrdersTab orders={historyOrders} />
                    </TabsContent>
                  </div>

                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <OrderDetailsModal
        order={selectedOrderForDetails}
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
      />
    </div>
  );
};

export default DeliveryDashboard;
