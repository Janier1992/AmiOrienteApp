import React from 'react';
import { Helmet } from 'react-helmet';
import { Check, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Link } from 'react-router-dom';

const plans = [
  {
    name: 'Básico',
    price: 'Gratis',
    frequency: '+ 22% por venta',
    description: 'Ideal para tiendas que recién comienzan y quieren vender en línea sin costo inicial.',
    features: [
      'Listado de productos ilimitado',
      'Gestión de pedidos',
      'Panel de control de la tienda',
      'Pagos en línea y en efectivo',
    ],
    cta: 'Comienza Ahora',
    path: '/tienda/registro',
    isFeatured: false,
  },
  {
    name: 'Profesional',
    price: '$59,900',
    frequency: '/mes + 15% por venta',
    description: 'Para negocios en crecimiento que buscan optimizar su operación y reducir costos.',
    features: [
      'Todo lo del plan Básico',
      'Comisión por venta reducida (15%)',
      'Control de inventario avanzado',
      'Administración de equipo y roles',
      'Soporte prioritario',
    ],
    cta: 'Elegir Profesional',
    path: '/tienda/dashboard?tab=suscripcion',
    isFeatured: true,
  },
  {
    name: 'Empresarial',
    price: 'Personalizado',
    frequency: '',
    description: 'Soluciones a medida para grandes volúmenes de venta y necesidades específicas.',
    features: [
      'Todo lo del plan Profesional',
      'Comisiones personalizadas',
      'Agente de IA para atención al cliente',
      'Automatización de marketing',
      'Gerente de cuenta dedicado',
    ],
    cta: 'Contactar a Ventas',
    path: '/contacto',
    isFeatured: false,
  },
];

const PricingPage = () => {
  return (
    <>
      <Helmet>
        <title>Planes y Precios - MiOriente</title>
        <meta name="description" content="Elige el plan perfecto para tu negocio. Desde comisiones por venta hasta suscripciones con herramientas avanzadas." />
      </Helmet>
      <div className="bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-foreground">
              Un plan para cada etapa de tu negocio
            </h1>
            <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
              Escalable, justo y transparente. Empieza gratis y crece con nuestras herramientas avanzadas.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <Card key={plan.name} className={`flex flex-col bg-card text-card-foreground border-border ${plan.isFeatured ? 'border-primary border-2 shadow-2xl' : ''}`}>
                {plan.isFeatured && (
                  <div className="py-1 px-4 bg-primary text-primary-foreground text-sm font-semibold rounded-t-lg text-center">
                    Más Popular
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-3xl font-bold">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="text-center mb-8">
                    <span className="text-5xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.frequency}</span>
                  </div>
                  <ul className="space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <Check className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link to={plan.path} className="w-full">
                    <Button size="lg" className="w-full" variant={plan.isFeatured ? 'default' : 'outline'}>
                      {plan.cta}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default PricingPage;