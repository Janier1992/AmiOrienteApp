import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const SubscriptionTab = ({ store }) => {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Tu Plan</CardTitle>
          <CardDescription>Información sobre tu cuenta en Soy del Campo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          
          <div className="p-6 border rounded-lg bg-green-50/50 border-green-100">
            <div className="flex flex-col sm:flex-row justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-green-900">Plan Gratuito - Acceso Total</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-green-600 hover:bg-green-700">Activo</Badge>
                </div>
                <p className="text-green-800 mt-2">
                  Como parte de la iniciativa <strong>Soy del Campo</strong>, tienes acceso ilimitado a todas las herramientas de la plataforma sin costo alguno.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-green-700">
                    <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" /> Gestión de productos ilimitada
                    </li>
                    <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" /> Administración de equipos
                    </li>
                    <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" /> Herramientas de automatización e IA
                    </li>
                    <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" /> 0% comisión por uso de plataforma
                    </li>
                </ul>
              </div>
              <div className="text-left sm:text-right mt-4 sm:mt-0">
                <p className="text-2xl font-bold text-green-700">$0 / mes</p>
                <p className="text-sm text-green-600">
                  Para siempre
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 border rounded-lg">
            <div className="flex items-start gap-4">
                 <div className="p-3 bg-blue-100 rounded-full">
                    <ShieldCheck className="h-6 w-6 text-blue-600" />
                 </div>
                 <div>
                    <h3 className="text-lg font-semibold">Configuración de Pagos (Opcional)</h3>
                    <p className="text-muted-foreground mt-1 mb-4">
                        Si deseas recibir pagos directamente a tu cuenta bancaria a través de la plataforma, puedes configurar Stripe Connect. Esto es completamente opcional; puedes manejar los pagos en efectivo o por otros medios si lo prefieres.
                    </p>
                    <Link to="/tienda/dashboard/pagos">
                        <Button variant="outline">Gestionar Configuración de Pagos</Button>
                    </Link>
                 </div>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionTab;