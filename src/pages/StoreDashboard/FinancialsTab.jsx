
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, CreditCard, TrendingUp, AlertCircle } from 'lucide-react';
import { useStoreDashboard } from '@/stores/useStoreDashboard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const FinancialsTab = ({ storeId }) => {
    // Using granular loading state for stats
    const { stats, isLoadingStats } = useStoreDashboard();
    
    // Safety check if stats haven't loaded yet via parent
    if (isLoadingStats && !stats) return <LoadingSpinner />;
    
    const balance = stats ? (Number(stats.total_sales) - Number(stats.platform_commission)) : 0;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Balance Disponible</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-700">${balance.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Disponible para retirar</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${Number(stats?.total_sales || 0).toLocaleString()}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Comisiones (Soy del Campo)</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-muted-foreground">${Number(stats?.platform_commission || 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">0% Tarifa preferencial</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Historial de Transacciones</CardTitle>
                    <CardDescription>Movimientos recientes de tu cuenta.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                        <AlertCircle className="h-12 w-12 mb-4 text-slate-300" />
                        <p>No hay transacciones recientes para mostrar.</p>
                        <p className="text-sm mt-2">Tus ventas aparecerán aquí una vez procesadas.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default FinancialsTab;
