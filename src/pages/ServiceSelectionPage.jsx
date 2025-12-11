
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Home, Package, UtensilsCrossed, BedDouble, Shirt, Pill, Wheat, ShoppingCart, Sprout } from 'lucide-react';

const ServiceSelectionPage = () => {
  const navigate = useNavigate();

  const handleSelectService = (serviceType) => {
    // In a real application, this would redirect to a specific registration form
    // or set a context for the next registration step.
    // For now, we'll navigate to the generic store registration with the serviceType as a query param.
    navigate(`/tienda/registro?service=${serviceType}`);
  };

  const services = [
    { name: 'Restaurante', icon: UtensilsCrossed, description: 'Platos y bebidas a domicilio.' },
    { name: 'Hotel', icon: BedDouble, description: 'Gestión de reservas y habitaciones.' },
    { name: 'Ropa', icon: Shirt, description: 'Tiendas de moda y accesorios.' },
    { name: 'Farmacia', icon: Pill, description: 'Medicamentos y productos de salud.' },
    { name: 'Panadería', icon: Wheat, description: 'Pan, pasteles y postres.' },
    { name: 'Supermercado', icon: ShoppingCart, description: 'Comestibles y productos para el hogar.' },
    { name: 'Cultivador', icon: Sprout, description: 'Productos frescos de la granja.' },
    { name: 'General', icon: Package, description: 'Cualquier otro tipo de negocio.' },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 relative">
      <Helmet>
        <title>Selección de Servicio | MiOriente</title>
        <meta name="description" content="Selecciona el tipo de servicio para registrar tu negocio en MiOriente." />
      </Helmet>

      <div className="absolute top-4 left-4 z-10">
        <Button variant="outline" size="icon" asChild className="bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm">
          <Link to="/">
            <Home className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            <span className="sr-only">Volver al Inicio</span>
          </Link>
        </Button>
      </div>

      <Card className="w-full max-w-4xl shadow-lg rounded-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Registro de Negocio</CardTitle>
          <CardDescription className="text-muted-foreground mt-2">
            Selecciona el tipo de servicio que ofrece tu negocio para continuar con el registro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <Card 
                key={index} 
                className="flex flex-col items-center text-center p-6 cursor-pointer hover:shadow-xl transition-all duration-300 group hover:-translate-y-1"
                onClick={() => handleSelectService(service.name)}
              >
                <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors mb-4">
                  <service.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-1">{service.name}</h3>
                <p className="text-sm text-muted-foreground">{service.description}</p>
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceSelectionPage;
