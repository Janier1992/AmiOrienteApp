
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Home, Package, UtensilsCrossed, BedDouble, Shirt, Pill, Wheat, ShoppingCart, Sprout, Pencil } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const ServiceSelectionPage = () => {
  const navigate = useNavigate();

  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [userStoreCategory, setUserStoreCategory] = React.useState(null);
  const [isCheckingStore, setIsCheckingStore] = React.useState(true);

  // 1. Check Store Logic
  React.useEffect(() => {
    const checkUserStore = async () => {
      // Wait for Auth to initialize
      if (authLoading) return;

      if (!user) {
        // No user = No store. Stop checking.
        setIsCheckingStore(false);
        setUserStoreCategory(null);
        return;
      }

      // User exists, check store
      setIsCheckingStore(true);
      try {
        const { data: store, error } = await supabase
          .from('stores')
          .select('category')
          .eq('owner_id', user.id)
          .single();

        if (store) {
          setUserStoreCategory(store.category);
        } else {
          setUserStoreCategory(null);
        }
      } catch (e) {
        console.error("Error fetching store category", e);
        setUserStoreCategory(null);
      } finally {
        setIsCheckingStore(false);
      }
    };

    checkUserStore();
  }, [user, authLoading]);

  const handleSelectService = async (serviceName) => {
    // Logic remains similar: Block if mismatch
    if (user && userStoreCategory) {
      const sName = serviceName.toLowerCase();
      const uCat = userStoreCategory.toLowerCase();
      // Relaxed Match
      const isMatch = sName === uCat || uCat.includes(sName) || sName.includes(uCat);

      if (!isMatch) {
        toast({
          variant: "destructive",
          title: "Acceso Restringido",
          description: `Tienes una sesión activa como negocio tipo "${userStoreCategory}". No puedes acceder al módulo de "${serviceName}".`
        });
        return;
      }
      // If match, go to dashboard
      navigate('/tienda/dashboard');
      return;
    }
    // Default flow
    navigate(`/tienda/registro?service=${serviceName}`);
  };

  const services = [
    { name: 'Restaurante', icon: UtensilsCrossed, description: 'Platos y bebidas a domicilio.' },
    { name: 'Hotel', icon: BedDouble, description: 'Gestión de reservas y habitaciones.' },
    { name: 'Ropa', icon: Shirt, description: 'Tiendas de moda y accesorios.' },
    { name: 'Farmacia', icon: Pill, description: 'Medicamentos y productos de salud.' },
    { name: 'Papelería', icon: Pencil, description: 'Suministros de oficina y escolares.' },
    { name: 'Panadería', icon: Wheat, description: 'Pan, pasteles y postres.' },
    { name: 'Supermercado', icon: ShoppingCart, description: 'Comestibles y productos para el hogar.' },
    { name: 'Cultivador', icon: Sprout, description: 'Productos frescos de la granja.' },
    { name: 'General', icon: Package, description: 'Cualquier otro tipo de negocio.' },
  ];

  // 2. Loading State (Full Page or Skeleton)
  if (authLoading || isCheckingStore) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50 dark:bg-gray-900/50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 3. Filter Services
  const visibleServices = services.filter(service => {
    // If no user or no store found, show ALL.
    if (!user || !userStoreCategory) return true;

    // If user has store, show ONLY matching category.
    const sName = service.name.toLowerCase();
    const uCat = userStoreCategory.toLowerCase();
    return sName === uCat || uCat.includes(sName) || sName.includes(uCat);
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative pt-20">
      <Helmet>
        <title>Selección de Servicio | MiOriente</title>
        <meta name="description" content="Selecciona el tipo de servicio para registrar tu negocio en MiOriente." />
      </Helmet>

      {/* Explicit Back / Home Button */}
      <div className="absolute top-4 left-4 z-20">
        <Button variant="outline" size="icon" asChild className="bg-white/90 backdrop-blur-sm hover:bg-white shadow">
          <Link to="/">
            <Home className="h-5 w-5 text-gray-800" />
            <span className="sr-only">Volver al Inicio</span>
          </Link>
        </Button>
      </div>

      {user && (
        <div className="absolute top-4 right-4 z-20">
          <Button asChild className="shadow-lg">
            <Link to="/tienda/dashboard">
              Ir a Mi Cuenta
            </Link>
          </Button>
        </div>
      )}

      <Card className="w-full max-w-4xl shadow-2xl rounded-xl bg-white/95 backdrop-blur border-none">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-3xl font-extrabold text-slate-900">
            {user && userStoreCategory ? `Bienvenido, ${userStoreCategory}` : 'Registro de Negocio'}
          </CardTitle>
          <CardDescription className="text-slate-600 mt-2 text-lg">
            {user && userStoreCategory
              ? 'Accede a tu panel de control o gestiona tu cuenta.'
              : 'Selecciona el tipo de servicio que ofrece tu negocio.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          {visibleServices.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {visibleServices.map((service, index) => (
                <Card
                  key={index}
                  className="flex flex-col items-center text-center p-6 cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 border-slate-200 bg-white group"
                  onClick={() => handleSelectService(service.name)}
                >
                  <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors mb-4 text-primary">
                    <service.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">{service.name}</h3>
                  <p className="text-sm text-slate-500">{service.description}</p>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No se encontraron servicios disponibles para tu categoría.</p>
              <Button variant="link" onClick={() => navigate('/tienda/dashboard')}>Ir al Dashboard</Button>
            </div>
          )}

          <div className="mt-10 text-center">
            <Button variant="outline" onClick={() => navigate(-1)} className="border-slate-300 text-slate-700 hover:bg-slate-100">
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceSelectionPage;
