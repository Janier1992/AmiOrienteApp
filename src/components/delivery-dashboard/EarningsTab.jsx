import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, TrendingUp, Calendar, Package } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const EarningsTab = ({ history }) => {
    // Calculate earnings
    const stats = useMemo(() => {
        let totalEarnings = 0;
        let completedDeliveries = 0;
        const today = new Date().toDateString();
        let todayEarnings = 0;

        // Mock earnings calculation (assuming fixed rate per delivery or data from order)
        // In a real app, this should come from the DB 'delivery_fee' or similar
        // For now, let's assume a standard fee + order value percentage or just a flat mock fee per delivery for visualization
        // We'll use a mock "delivery_commission" of $5000 COP per delivery if not present

        // Group by day for chart
        const earningsByDay = {};

        history.forEach(order => {
            if (order.status === 'Entregado') {
                completedDeliveries++;
                // Mock fee logic: 
                const fee = 5000;
                totalEarnings += fee;

                if (new Date(order.created_at).toDateString() === today) {
                    todayEarnings += fee;
                }

                const dayName = new Date(order.created_at).toLocaleDateString('es-CO', { weekday: 'short' });
                earningsByDay[dayName] = (earningsByDay[dayName] || 0) + fee;
            }
        });

        const chartData = Object.keys(earningsByDay).map(day => ({
            name: day,
            total: earningsByDay[day]
        }));

        return { totalEarnings, completedDeliveries, todayEarnings, chartData };
    }, [history]);

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ganancias Totales</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">${stats.totalEarnings.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            +${stats.todayEarnings.toLocaleString()} hoy
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
                            ${stats.completedDeliveries > 0 ? (stats.totalEarnings / stats.completedDeliveries).toLocaleString() : 0}
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
