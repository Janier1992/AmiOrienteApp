import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { planService } from '@/services/planService';
import { supportService } from '@/services/supportService';
import { CUSTOM_PLAN_ID, describeCommission, describePrice, describeTeamLimit } from '@/config/plans';

const SubscriptionTab = ({ store }) => {
  const [current, setCurrent] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const [list, info] = await Promise.all([
        planService.listarPlanes(),
        planService.obtenerPlanDelNegocio(store.id).catch(() => null),
      ]);
      if (!active) return;
      setPlans(list);
      setCurrent(info);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [store.id]);

  // Mientras no existan pagos en línea, el cambio de plan lo hace el equipo de
  // AmiOriente: aquí se envía la solicitud como ticket de soporte.
  const requestPlan = async (plan) => {
    setRequesting(plan.id);
    try {
      await supportService.crearTicket({
        storeId: store.id,
        subject: `Solicitud de cambio al plan ${plan.name}`,
        message: `El negocio "${store.name}" solicita cambiar del plan ${current?.plan_name || 'actual'} al plan ${plan.name}.`,
      });
      toast({ title: 'Solicitud enviada', description: 'Nuestro equipo te contactará para activar el plan.' });
    } catch (error) {
      toast({ title: 'No se pudo enviar la solicitud', description: error.message, variant: 'destructive' });
    } finally {
      setRequesting(null);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const currentPlan = plans.find((p) => p.id === current?.plan_id);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Mi plan</CardTitle>
          <CardDescription>Plan actual de {store.name}, su comisión y el uso de tu equipo.</CardDescription>
        </CardHeader>
        <CardContent>
          {current ? (
            <div className="p-6 border rounded-lg bg-primary/5 flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">Plan {current.plan_name}</h3>
                  <Badge>Activo</Badge>
                </div>
                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                  <li>{describeCommission({ id: current.plan_id, commission_percent: current.commission_percent })}</li>
                  <li>
                    Equipo: {current.team_count} {current.max_team_members == null ? '(ilimitado)' : `de ${current.max_team_members}`}
                  </li>
                </ul>
              </div>
              {currentPlan && (
                <div className="sm:text-right">
                  <p className="text-2xl font-bold">{describePrice(currentPlan).amount}</p>
                  <p className="text-sm text-muted-foreground">{describePrice(currentPlan).suffix.replace('/', 'por').trim()}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No pudimos cargar tu plan en este momento. Intenta de nuevo más tarde.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.id === current?.plan_id;
          const price = describePrice(plan);
          return (
            <Card key={plan.id} className={isCurrent ? 'border-primary border-2' : ''}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-3xl font-bold">{price.amount}</span>
                  <span className="text-muted-foreground">{price.suffix}</span>
                  <p className="text-sm text-muted-foreground">
                    {describeCommission(plan)} · {describeTeamLimit(plan)}
                  </p>
                </div>
                <ul className="space-y-2 text-sm">
                  {(plan.features || []).map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 mt-0.5 text-primary shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <Button variant="outline" disabled className="w-full">Tu plan actual</Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={plan.id === CUSTOM_PLAN_ID ? 'outline' : 'default'}
                    disabled={requesting === plan.id}
                    onClick={() => requestPlan(plan)}
                  >
                    {requesting === plan.id && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {plan.id === CUSTOM_PLAN_ID ? 'Contactar a ventas' : `Solicitar plan ${plan.name}`}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Los pagos en línea de la suscripción llegarán pronto. Mientras tanto, el cambio de plan lo activa nuestro equipo
        después de tu solicitud.
      </p>
    </div>
  );
};

export default SubscriptionTab;
