
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bike, CheckCircle2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { deliveryService } from '@/services/deliveryService';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

/**
 * Lista las liquidaciones de domicilio (70% del delivery_fee de cada
 * pedido) generadas para los pedidos de esta tienda, y permite al dueño
 * marcarlas como pagadas una vez le paga en efectivo/transferencia al
 * domiciliario por fuera de la plataforma.
 */
export const DeliveryPayoutsSection = ({ storeId }) => {
    const [payouts, setPayouts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [payingId, setPayingId] = useState(null);

    const fetchPayouts = useCallback(async () => {
        if (!storeId) return;
        setIsLoading(true);
        const data = await deliveryService.obtenerLiquidacionesPorTienda(storeId);
        setPayouts(data);
        setIsLoading(false);
    }, [storeId]);

    useEffect(() => {
        fetchPayouts();
    }, [fetchPayouts]);

    const handleMarkPaid = async (payoutId) => {
        setPayingId(payoutId);
        try {
            await deliveryService.marcarLiquidacionPagada(payoutId);
            toast({ title: 'Liquidación marcada como pagada' });
            fetchPayouts();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudo marcar la liquidación como pagada.',
                variant: 'destructive',
            });
        } finally {
            setPayingId(null);
        }
    };

    if (isLoading) return <LoadingSpinner />;

    const pending = payouts.filter(p => p.status === 'pending');
    const paid = payouts.filter(p => p.status === 'paid');
    const totalPending = pending.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bike className="h-5 w-5" /> Liquidaciones a Domiciliarios
                </CardTitle>
                <CardDescription>
                    70% del costo de domicilio de cada pedido entregado. Pendiente por pagar: <strong>${totalPending.toLocaleString()}</strong>
                </CardDescription>
            </CardHeader>
            <CardContent>
                {payouts.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                        Aún no hay domicilios entregados con liquidación generada.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {[...pending, ...paid].map(payout => (
                            <div
                                key={payout.id}
                                className="flex items-center justify-between border rounded-lg p-3 text-sm"
                            >
                                <div>
                                    <p className="font-medium">
                                        {payout.deliveries?.profiles?.full_name || 'Domiciliario'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {payout.deliveries?.delivered_at
                                            ? new Date(payout.deliveries.delivered_at).toLocaleDateString('es-CO')
                                            : '—'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-bold">${Number(payout.amount).toLocaleString()}</span>
                                    {payout.status === 'paid' ? (
                                        <Badge variant="secondary" className="gap-1">
                                            <CheckCircle2 className="h-3 w-3" /> Pagado
                                        </Badge>
                                    ) : (
                                        <Button
                                            size="sm"
                                            onClick={() => handleMarkPaid(payout.id)}
                                            disabled={payingId === payout.id}
                                        >
                                            {payingId === payout.id ? 'Guardando...' : 'Marcar pagado'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default DeliveryPayoutsSection;
