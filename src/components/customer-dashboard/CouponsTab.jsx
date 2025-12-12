import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/lib/customSupabaseClient';
import { Ticket, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const CouponsTab = () => {
  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    // Fetch active discounts from all stores
    const fetchCoupons = async () => {
        const { data } = await supabase
            .from('discounts')
            .select('*, stores(name, logo_url)')
            .gt('expires_at', new Date().toISOString())
            .limit(10);
        setCoupons(data || []);
    };
    fetchCoupons();
  }, []);

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Código copiado", description: "Úsalo al finalizar tu compra." });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cupones y Promociones</CardTitle>
        <CardDescription>Aprovecha estos descuentos exclusivos.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
            {coupons.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                    <Ticket className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No hay cupones disponibles en este momento.</p>
                </div>
            ) : (
                coupons.map(coupon => (
                    <div key={coupon.id} className="relative overflow-hidden border rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 p-5 flex flex-col justify-between">
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/20 rounded-full blur-xl"></div>
                        
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg text-primary">{coupon.code}</h3>
                                <p className="text-sm text-gray-600">{coupon.stores?.name}</p>
                            </div>
                            <div className="bg-white p-2 rounded-lg shadow-sm border">
                                <span className="font-bold text-xl text-primary">
                                    {coupon.discount_type === 'percentage' ? `${coupon.value}%` : `$${coupon.value}`}
                                </span>
                                <span className="text-[10px] block text-center uppercase">OFF</span>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-primary/10 flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Vence: {new Date(coupon.expires_at).toLocaleDateString()}</span>
                            <Button size="sm" variant="outline" className="h-8" onClick={() => copyCode(coupon.code)}>
                                <Copy className="h-3 w-3 mr-2" /> Copiar
                            </Button>
                        </div>
                    </div>
                ))
            )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CouponsTab;