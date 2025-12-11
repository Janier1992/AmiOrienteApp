import React from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Package, Settings, BarChart, MessageCircle, ArrowRight, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const MoreServicesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCardClick = (path) => {
    // If a business-related card is clicked, redirect to dashboard if logged in as store, else to login.
    const businessPaths = ['/tienda/dashboard?tab=inventario', '/tienda/dashboard?tab=automatizacion', '/tienda/dashboard?tab=admin'];
    if (businessPaths.includes(path)) {
      if (user && user.user_metadata?.role === 'tienda') {
        navigate(path);
      } else {
        navigate('/tienda/login');
      }
    } else {
      navigate(path);
    }
  };

  const menuItems = [
    { icon: UserPlus, label: "Registro de Tiendas", description: "Inscribe tu negocio en nuestra plataforma.", path: "/tienda/registro" },
    { icon: DollarSign, label: "Planes y Precios", description: "Elige el plan que mejor se adapte a tu negocio.", path: "/precios" },
    { icon: Package, label: "Control de Inventarios", description: "Gestiona tu stock de forma inteligente.", path: "/tienda/dashboard?tab=inventario" },
    { icon: Settings, label: "Automatización de Procesos", description: "Optimiza tareas repetitivas con IA.", path: "/tienda/dashboard?tab=automatizacion" },
    { icon: BarChart, label: "Administración de Negocios", description: "Analíticas y gestión de tu equipo.", path: "/tienda/dashboard?tab=admin" },
    { icon: MessageCircle, label: "Atención al Cliente (IA)", description: "Un bot 24/7 para atender a tus clientes.", path: "/tienda/dashboard?tab=automatizacion" },
  ];

  const ServiceCard = ({ item }) => (
    <div onClick={() => handleCardClick(item.path)} className="cursor-pointer">
      <Card className="h-full hover:border-primary transition-all hover:shadow-lg bg-card text-card-foreground border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="p-3 bg-primary/10 rounded-lg">
              <item.icon className="h-6 w-6 text-primary" />
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <CardTitle className="text-lg">{item.label}</CardTitle>
          <CardDescription>{item.description}</CardDescription>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Más Servicios - MiOriente</title>
        <meta name="description" content="Explora todas las herramientas y servicios avanzados que MiOriente ofrece para potenciar tu negocio." />
      </Helmet>
      <div className="min-h-screen bg-background">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item, index) => (
              <ServiceCard key={index} item={item} />
            ))}
          </div>
        </main>
      </div>
    </>
  );
};

export default MoreServicesPage;