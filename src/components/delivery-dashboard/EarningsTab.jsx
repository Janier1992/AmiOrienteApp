import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, TrendingUp, Package, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const getPayout = (delivery) => {
    const payout = Array.isArray(delivery.delivery_payouts) ? delivery.delivery_payouts[0] : delivery.delivery_payouts;
    return payout || null;
};

const EarningsTab = ({ history }) => {
    // Calculate earnings from the real delivery_payouts records
    // (70% del delivery_fee de cada pedido, ver database_updates/20261003_delivery_payouts.sql)
    const stats = useMemo(() => {
        let totalEarnings = 0;
        let pendingEarnings = 0;
        let paidEarnings = 0;
        let completedDeliveries = 0;
        const today = new Date().toDateString();
        let todayEarnings = 0;

        const earningsByDay = {};

        history.forEach(delivery => {
            const payout = getPayout(delivery);
            if (!payout) return; // aún no se ha generado la liquidación (o entrega no completada)

            const amount = Number(payout.amount) || 0;
            completedDeliveries++;
            totalEarnings += amount;

            if (payout.status === 'paid') {
                paidEarnings += amount;
            } else {
                pendingEarnings += amount;
            }

            const referenceDate = delivery.delivered_at || delivery.created_at;
            if (new Date(referenceDate).toDateString() === today) {
                todayEarnings += amount;
            }

            const dayName = new Date(referenceDate).toLocaleDateString('es-CO', { weekday: 'short' });
            earningsByDay[dayName] = (earningsByDay[dayName] || 0) + amount;
        });

        const chartData = Object.keys(earningsByDay).map(day => ({
            name: day,
            total: earningsByDay[day]
        }));

        return { totalEarnings, pendingEarnings, paidEarnings, completedDeliveries, todayEarnings, chartData };
    }, [history]);

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ganancias Totales</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-700 dark:text-green-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-700 dark:text-green-400">${stats.totalEarnings.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            +${stats.todayEarnings.toLocaleString()} hoy
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pendiente de Pago</CardTitle>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">${stats.pendingEarnings.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            Ya pagado: ${stats.paidEarnings.toLocaleString()}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Entregas Realizadas</CardTitle>
                        <Package className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.completedDeliveries}</div>
                        <p className="text-xs text-muted-foreground">
                            Exitosas
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Promedio por Entrega</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${stats.completedDeliveries > 0 ? Math.round(stats.totalEarnings / stats.completedDeliveries).toLocaleString() : 0}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Rendimiento Semanal</CardTitle>
                    <CardDescription>Tus ganancias de los últimos 7 días</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <div className="h-[200px] w-full">
                        {stats.chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `$${value}`}
                                    />
                                    <Tooltip
                                        formatter={(value) => [`$${value.toLocaleString()}`, "Ganancia"]}
                                        cursor={{ fill: 'transparent' }}
                                    />
                                    <Bar dataKey="total" fill="#16a34a" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                                No hay datos suficientes para mostrar la gráfica.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default EarningsTab;
