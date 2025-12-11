import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/lib/customSupabaseClient';
import { BarChart, LineChart } from '@/components/ui/simple-charts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpRight, ArrowDownRight, TrendingUp, Users, DollarSign, Package } from 'lucide-react';

const AnalyticsTab = ({ store }) => {
  const [salesData, setSalesData] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [period, setPeriod] = useState('week'); // week, month, year
  
  useEffect(() => {
    // In a real application, you would fetch based on the 'period' and 'store.id'
    // Simulating data change based on period
    const generateData = () => {
        if (period === 'week') {
            setSalesData([
                { date: 'Lun', sales: 120000, orders: 4 },
                { date: 'Mar', sales: 85000, orders: 3 },
                { date: 'Mie', sales: 150000, orders: 6 },
                { date: 'Jue', sales: 210000, orders: 8 },
                { date: 'Vie', sales: 180000, orders: 7 },
                { date: 'Sab', sales: 320000, orders: 12 },
                { date: 'Dom', sales: 290000, orders: 10 },
            ]);
        } else if (period === 'month') {
            setSalesData([
                { date: 'Sem 1', sales: 850000, orders: 35 },
                { date: 'Sem 2', sales: 920000, orders: 42 },
                { date: 'Sem 3', sales: 780000, orders: 31 },
                { date: 'Sem 4', sales: 1100000, orders: 55 },
            ]);
        }
    };

    setCustomerData([
        { name: 'Juan P.', orders: 12, spent: 450000 },
        { name: 'Maria L.', orders: 8, spent: 320000 },
        { name: 'Carlos R.', orders: 5, spent: 150000 },
        { name: 'Ana S.', orders: 15, spent: 680000 },
        { name: 'Pedro M.', orders: 3, spent: 90000 },
    ]);

    generateData();
  }, [store, period]);

  const valueFormatter = (number) => `$${new Intl.NumberFormat('es-CO').format(number)}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Analíticas</h2>
            <p className="text-muted-foreground">Visión general del rendimiento de tu tienda.</p>
        </div>
        
        <Tabs value={period} onValueChange={setPeriod} className="w-[400px]">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mes</TabsTrigger>
            <TabsTrigger value="year">Año</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1,355,000</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
               <ArrowUpRight className="h-3 w-3 text-emerald-500 mr-1"/>
               <span className="text-emerald-500 font-medium">+20.1%</span> vs mes anterior
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+50</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
               <ArrowDownRight className="h-3 w-3 text-red-500 mr-1"/>
               <span className="text-red-500 font-medium">-4%</span> vs mes anterior
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
               <ArrowUpRight className="h-3 w-3 text-emerald-500 mr-1"/>
               <span className="text-emerald-500 font-medium">+12%</span> vs mes anterior
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$27,100</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
               <ArrowUpRight className="h-3 w-3 text-emerald-500 mr-1"/>
               <span className="text-emerald-500 font-medium">+2.4%</span> vs mes anterior
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Resumen de Ventas</CardTitle>
          <CardDescription>Visualiza las tendencias de ingresos en el periodo seleccionado.</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
             <LineChart 
                data={salesData} 
                index="date" 
                categories={["sales"]} 
                valueFormatter={valueFormatter}
                className="h-[400px]"
            />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
                <CardTitle>Top Clientes</CardTitle>
                <CardDescription>Clientes con mayor volumen de pedidos.</CardDescription>
            </CardHeader>
            <CardContent>
                <BarChart 
                    data={customerData}
                    index="name"
                    categories={["orders"]}
                    className="h-[300px]"
                />
            </CardContent>
          </Card>
           
           <Card>
             <CardHeader>
                <CardTitle>Rendimiento por Producto</CardTitle>
                <CardDescription>Productos más vendidos este mes.</CardDescription>
             </CardHeader>
             <CardContent>
                <div className="space-y-4">
                    {[
                        { name: "Aguacate Hass", sales: 45, revenue: 225000 },
                        { name: "Café Molido 500g", sales: 32, revenue: 480000 },
                        { name: "Miel Orgánica", sales: 28, revenue: 336000 },
                        { name: "Huevos Criollos x30", sales: 25, revenue: 375000 },
                    ].map((product, i) => (
                        <div key={i} className="flex items-center">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs mr-3">
                                #{i+1}
                            </div>
                            <div className="flex-1 space-y-1">
                                <p className="text-sm font-medium leading-none">{product.name}</p>
                                <p className="text-xs text-muted-foreground">{product.sales} ventas</p>
                            </div>
                            <div className="font-medium text-sm">
                                {valueFormatter(product.revenue)}
                            </div>
                        </div>
                    ))}
                </div>
             </CardContent>
           </Card>
      </div>
    </div>
  );
};

export default AnalyticsTab;