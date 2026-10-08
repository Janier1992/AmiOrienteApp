
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Helmet } from 'react-helmet';
import Sidebar from '@/components/customer-dashboard/Sidebar';
import { OrdersTab } from '@/components/customer-dashboard/OrdersTab';
import ProfileTab from '@/components/customer-dashboard/ProfileTab';
import WishlistTab from '@/components/customer-dashboard/WishlistTab';
import AddressesTab from '@/components/customer-dashboard/AddressesTab';
import PaymentMethodsTab from '@/components/customer-dashboard/PaymentMethodsTab';
import NotificationsTab from '@/components/customer-dashboard/NotificationsTab';
import ReviewsTab from '@/components/customer-dashboard/ReviewsTab';
import CouponsTab from '@/components/customer-dashboard/CouponsTab';
import TeamMembershipBanner from '@/components/customer-dashboard/TeamMembershipBanner';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('pedidos');
  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const fetchDashboardData = useCallback(async (userId) => {
    setLoading(true);
    try {
      const [ordersRes, profileRes] = await Promise.all([
        supabase
          .from('orders')
          .select(`
            *, 
            stores (name), 
            deliveries (*), 
            order_items (*, products!order_items_product_id_fkey(name, image_url))
          `)
          .eq('customer_id', userId)
          .order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
      ]);

      if (ordersRes.error) throw ordersRes.error;
      setOrders(ordersRes.data || []);

      if (profileRes.error) throw profileRes.error;
      setProfile(profileRes.data);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({ title: 'Error', description: 'No se pudieron cargar tus datos.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualización en vivo: cuando la tienda confirma/prepara o el domiciliario
  // recoge el pedido, el cliente lo ve sin recargar la página.
  const refreshOrders = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *, 
        stores (name), 
        deliveries (*), 
        order_items (*, products!order_items_product_id_fkey(name, image_url))
      `)
      .eq('customer_id', userId)
      .order('created_at', { ascending: false });
    if (!error && data) setOrders(data);
  }, []);

  useEffect(() => {
    if (!user || user.user_metadata?.role !== 'cliente') return undefined;
    const channel = supabase
      .channel(`customer-orders-${user.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `customer_id=eq.${user.id}` },
        () => refreshOrders(user.id))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, refreshOrders]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/cliente/login');
      return;
    }

    if (user.user_metadata?.role !== 'cliente') {
      navigate('/');
      toast({ title: "Acceso no autorizado", description: "Esta sección es solo para clientes.", variant: 'destructive' });
      return;
    }

    fetchDashboardData(user.id);
  }, [user, navigate, authLoading, fetchDashboardData]);

  const handleLogout = async () => {
    await signOut();
    toast({ title: "Sesión cerrada", description: "Has cerrado sesión exitosamente." });
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const { full_name, phone, address } = profile;
      const { error } = await supabase
        .from('profiles')
        .update({ full_name, phone, address })
        .eq('id', user.id);

      if (error) throw error;
      toast({ title: 'Perfil actualizado', description: 'Tus datos se guardaron correctamente.' });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar tu perfil.', variant: 'destructive' });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-foreground">Cargando tu panel...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row relative">
      <Helmet>
        <title>Mi Panel | Cliente</title>
      </Helmet>

      {/* Mobile Toggle Button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden shadow-md bg-background"
        onClick={() => setIsSidebarOpen(true)}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Menu</span>
      </Button>

      <Sidebar
        profile={profile}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onLogout={handleLogout}
        onHome={() => navigate('/')}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen mt-14 md:mt-0">
        <div className="max-w-5xl mx-auto space-y-6">
          <TeamMembershipBanner userId={user.id} />
          {activeTab === 'pedidos' && <OrdersTab orders={orders} onOrdersChanged={() => refreshOrders(user.id)} />}
          {activeTab === 'perfil' && profile && (
            <ProfileTab
              profile={{ ...profile, email: user.email }}
              onInputChange={handleProfileInputChange}
              onProfileUpdate={handleProfileUpdate}
            />
          )}
          {activeTab === 'deseos' && <WishlistTab userId={user.id} />}
          {activeTab === 'direcciones' && <AddressesTab userId={user.id} />}
          {activeTab === 'pagos' && <PaymentMethodsTab userId={user.id} />}
          {activeTab === 'notificaciones' && <NotificationsTab userId={user.id} />}
          {activeTab === 'resenas' && <ReviewsTab userId={user.id} />}
          {activeTab === 'cupones' && <CouponsTab />}
        </div>
      </main>
    </div>
  );
};

export default CustomerDashboard;
