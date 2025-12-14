
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Home } from 'lucide-react';

const StoreRegister = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp, user } = useAuth();
  const location = useLocation();

  // If user is already logged in, redirect them to dashboard to prevent "User already exists" errors
  // from accidental re-registration attempts.
  // Enhanced Redirect Logic
  useEffect(() => {
    const checkRedirect = async () => {
      if (user) {
        // Check if user has a store
        const { data: store } = await supabase
          .from('stores')
          .select('category')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (store) {
          // Strict Isolation: If user has ANY store, force them to their dashboard.
          // They cannot verify or register a second store.
          navigate('/tienda/dashboard');
          toast({
            title: "Acceso Redirigido",
            description: `Ya tienes registrado un negocio de tipo "${store.category}".`,
          });
        }
      }
    };

    checkRedirect();
  }, [user, navigate, location.search]);

  const queryParams = new URLSearchParams(location.search);
  const serviceType = queryParams.get('service') || 'General';

  // DB Mapping to ensure Trigger finds the correct service_category_id
  const CATEGORY_DB_MAP = {
    'Restaurante': 'Restaurante',
    'Hotel': 'Hotel',
    'Ropa': 'Tienda de Ropa / Moda',
    'Farmacia': 'Farmacia / Droguería',
    'Papelería': 'Papelería / Miscelánea',
    'Panadería': 'Panadería / Repostería',
    'Supermercado': 'Supermercado / Abarrotes',
    'Cultivador': 'Cultivadores',
    'General': 'Otro Comercio'
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // We pass 'true' as the 4th argument to suppress the default error toast from context,
      // allowing us to handle the specific errors locally with custom messages.
      const { user: newUser, error } = await signUp(email, password, {
        data: {
          role: 'tienda',
          store_name: storeName,
          address: address,
          address: address,
          category: serviceType, // Display Category (e.g. 'Cultivador')
          service_category: CATEGORY_DB_MAP[serviceType] || 'Domicilios', // FK Lookup Name (e.g. 'Cultivadores')
        },
      }, true);

      if (error) {
        let message = error.message;

        // Robust error handling matching Supabase codes
        if (error.code === 'user_already_exists' || message === 'User already registered' || message.includes('already registered')) {
          message = 'Este correo electrónico ya está registrado. Por favor intenta iniciar sesión.';
        } else if (message.includes('Password should be')) {
          message = 'La contraseña debe tener al menos 6 caracteres.';
        }

        toast({
          title: "Error de Registro",
          description: message,
          variant: "destructive",
        });
      } else if (newUser) {
        toast({
          title: "Registro Exitoso",
          description: "¡Bienvenido! Hemos enviado un correo de confirmación. Por favor, revisa tu bandeja de entrada.",
        });
        navigate('/tienda/dashboard');
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Error Inesperado",
        description: "Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 relative">
      <Helmet>
        <title>Registro de Negocio | MiOriente</title>
        <meta name="description" content="Registra tu tienda, restaurante o servicio en MiOriente." />
      </Helmet>

      <div className="absolute top-4 left-4 z-10">
        <Button variant="outline" size="icon" asChild className="bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm">
          <Link to="/">
            <Home className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            <span className="sr-only">Volver al Inicio</span>
          </Link>
        </Button>
      </div>

      <Card className="w-full max-w-md shadow-lg rounded-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Registrar Negocio</CardTitle>
          <CardDescription className="text-muted-foreground mt-2">
            Únete a MiOriente y empieza a vender tus productos/servicios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <Label htmlFor="serviceType">Tipo de Negocio</Label>
              <Input
                id="serviceType"
                type="text"
                value={serviceType}
                readOnly
                className="mt-1 bg-gray-100 dark:bg-gray-800"
              />
            </div>
            <div>
              <Label htmlFor="storeName">Nombre del Negocio</Label>
              <Input
                id="storeName"
                type="text"
                placeholder="Mi Tienda de Ejemplo"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="address">Dirección del Negocio</Label>
              <Input
                id="address"
                type="text"
                placeholder="Calle 123 #45-67"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Registrar Negocio'
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link to="/tienda/login" className="text-primary hover:underline">
                Ingresar
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default StoreRegister;
