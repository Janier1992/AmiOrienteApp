import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Lock } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const PaymentsTab = ({ store }) => {
  const handleConnect = () => {
    toast({
        title: "Próximamente",
        description: "La integración con Bold está en proceso. Por ahora, utiliza pagos en efectivo o transferencias directas.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de Pagos</CardTitle>
        <CardDescription>Gestiona cómo recibes el dinero de tus ventas.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="p-6 border rounded-lg bg-blue-50 border-blue-100 flex items-start gap-4">
            <div className="p-3 bg-white rounded-full border shadow-sm">
                <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
                <h3 className="font-semibold text-blue-900">Integración con Bold (Próximamente)</h3>
                <p className="text-sm text-blue-700 mt-1 mb-4">
                    Estamos trabajando para integrar la pasarela de pagos Bold para que puedas recibir pagos con tarjeta de crédito, débito y PSE de manera segura y directa en tu cuenta bancaria.
                </p>
                <Button onClick={handleConnect} disabled className="bg-blue-600 text-white opacity-50 cursor-not-allowed">
                    <Lock className="mr-2 h-4 w-4" /> Conectar Bold
                </Button>
            </div>
        </div>

        <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-2">Métodos Actuales</h3>
            <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">✅ Pago contra entrega (Efectivo)</li>
                <li className="flex items-center gap-2">✅ Transferencia directa (Nequi/Daviplata - Acordado con cliente)</li>
            </ul>
        </div>

      </CardContent>
    </Card>
  );
};

export default PaymentsTab;