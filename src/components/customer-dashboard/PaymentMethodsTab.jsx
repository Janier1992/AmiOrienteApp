import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { CreditCard, Plus, Trash2, ShieldCheck } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';


const PaymentMethodsTab = ({ userId }) => {
  const [methods, setMethods] = useState([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    fetchMethods();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('user_payment_methods')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false });
        
      if (error) throw error;
      setMethods(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase.from('user_payment_methods').delete().eq('id', id);
      if (error) throw error;
      setMethods(methods.filter(m => m.id !== id));
      toast({ title: "Método eliminado", description: "La tarjeta ha sido removida." });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar." });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Métodos de Pago</CardTitle>
          <CardDescription>Gestiona tus tarjetas para compras rápidas.</CardDescription>
        </div>
        {/* Guardar tarjetas exige una pasarela de pagos con tokenización (no se guardan datos de tarjeta propios). */}
        <Button size="sm" disabled title="Disponible cuando se active el pago en línea">
          <Plus className="h-4 w-4 mr-2" /> Agregar Tarjeta (próximamente)
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {methods.map((method) => (
            <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
              <div className="flex items-center gap-4">
                <div className="bg-slate-100 p-2 rounded">
                  <CreditCard className="h-6 w-6 text-slate-700" />
                </div>
                <div>
                  <p className="font-semibold flex items-center gap-2">
                    {method.brand} •••• {method.last_four}
                    {method.is_default && <span className="text-xs bg-green-100 text-green-700 px-2 rounded-full">Principal</span>}
                  </p>
                  <p className="text-sm text-muted-foreground">Expira: {method.exp_month}/{method.exp_year}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(method.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {methods.length === 0 && (
             <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <ShieldCheck className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p>No tienes métodos de pago guardados.</p>
                <p className="text-xs mt-1">Por ahora los pedidos se pagan en efectivo o por transferencia. El pago con tarjeta llegará pronto.</p>
             </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentMethodsTab;