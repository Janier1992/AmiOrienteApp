import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { planService } from '@/services/planService';
import { FALLBACK_PLANS, CUSTOM_PLAN_ID, describeCommission, describePrice, describeTeamLimit } from '@/config/plans';

const FEATURED_PLAN_ID = 'pro';

const planCta = (plan) => {
  if (plan.id === CUSTOM_PLAN_ID) return { label: 'Contactar a Ventas', path: '/contacto' };
  if (plan.id === FEATURED_PLAN_ID) return { label: `Elegir ${plan.name}`, path: '/tienda/dashboard/suscripcion' };
  return { label: 'Comienza Ahora', path: '/tienda/registro' };
};

const PricingPage = () => {
  const [plans, setPlans] = useState(FALLBACK_PLANS);

  useEffect(() => {
    let active = true;
    planService.listarPlanes().then((list) => active && setPlans(list));
    return () => { active = false; };
  }, []);

  return (
    <>
      <Helmet>
        <title>Planes y Precios - AmiOriente</title>
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
            {plans.map((plan) => {
              const isFeatured = plan.id === FEATURED_PLAN_ID;
              const price = describePrice(plan);
              const cta = planCta(plan);
              return (
              <Card key={plan.id} className={`flex flex-col bg-card text-card-foreground border-border ${isFeatured ? 'border-primary border-2 shadow-2xl' : ''}`}>
                {isFeatured && (
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
                    <span className="text-5xl font-bold">{price.amount}</span>
                    <span className="text-muted-foreground">{price.suffix}</span>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {describeCommission(plan)} · {describeTeamLimit(plan)}
                    </p>
                  </div>
                  <ul className="space-y-4">
                    {(plan.features || []).map((feature) => (
                      <li key={feature} className="flex items-start">
                        <Check className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link to={cta.path} className="w-full">
                    <Button size="lg" className="w-full" variant={isFeatured ? 'default' : 'outline'}>
                      {cta.label}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default PricingPage;