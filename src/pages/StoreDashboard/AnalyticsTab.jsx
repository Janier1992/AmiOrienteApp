import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/lib/customSupabaseClient';
import { BarChart, LineChart } from '@/components/ui/simple-charts';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpRight, ArrowDownRight, TrendingUp, Users, DollarSign, Package } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const buildBuckets = (period, now) => {
  const buckets = [];
  if (period === 'week') {
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0);
      const end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999);
      buckets.push({ label: start.toLocaleDateString('es-CO', { weekday: 'short' }), start, end });
    }
  } else if (period === 'month') {
    for (let i = 3; i >= 0; i--) {
      const end = new Date(now);
      end.setDate(now.getDate() - i * 7);
      end.setHours(23, 59, 59, 999);
      const start = new Date(end);
      start.setDate(end.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      buckets.push({ label: `Sem ${4 - i}`, start, end });
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      buckets.push({ label: start.toLocaleDateString('es-CO', { month: 'short' }), start, end });
    }
  }
  return buckets;
};

const AnalyticsTab = ({ store }) => {
  const [period, setPeriod] = useState('week');
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [summary, setSummary] = useState({
    revenue: 0, revenueChange: 0, orders: 0, ordersChange: 0, activeCustomers: 0, avgTicket: 0
  });

  const fetchAnalytics = useCallback(async () => {
    if (!store?.id) return;
    setLoading(true);

    const now = new Date();
    const buckets = buildBuckets(period, now);
    const rangeStart = buckets[0].start;
    const rangeEnd = buckets[buckets.length - 1].end;
    const spanMs = rangeEnd.getTime() - rangeStart.getTime();
    const prevStart = new Date(rangeStart.getTime() - spanMs);
    const prevEnd = rangeStart;

    const { data: currentOrders } = await supabase
      .from('orders')
      .select('id, customer_id, total, created_at, profiles(full_name)')
      .eq('store_id', store.id)
      .neq('status', 'Cancelado')
      .gte('created_at', rangeStart.toISOString())
      .lte('created_at', rangeEnd.toISOString());

    const { data: previousOrders } = await supabase
      .from('orders')
      .select('id, total')
      .eq('store_id', store.id)
      .neq('status', 'Cancelado')
      .gte('created_at', prevStart.toISOString())
      .lt('created_at', prevEnd.toISOString());

    const orders = currentOrders || [];
    const prevOrdersList = previousOrders || [];

    // Sales chart: distribute orders into their time bucket
    const chartData = buckets.map(b => ({ date: b.label, sales: 0, orders: 0 }));
    orders.forEach(order => {
      const createdAt = new Date(order.created_at);
      const idx = buckets.findIndex(b => createdAt >= b.start && createdAt <= b.end);
      if (idx !== -1) {
        chartData[idx].sales += Number(order.total) || 0;
        chartData[idx].orders += 1;
      }
    });
    setSalesData(chartData);

    // Top customers
    const customerMap = new Map();
    orders.forEach(order => {
      const key = order.customer_id;
      const name = order.profiles?.full_name || 'Cliente';
      const entry = customerMap.get(key) || { name, orders: 0, spent: 0 };
      entry.orders += 1;
      entry.spent += Number(order.total) || 0;
      customerMap.set(key, entry);
    });
    setTopCustomers([...customerMap.values()].sort((a, b) => b.orders - a.orders).slice(0, 5));

    // Top products (from order_items of the orders in range)
    const orderIds = orders.map(o => o.id);
    let products = [];
    if (orderIds.length > 0) {
      const { data: items } = await supabase
        .from('order_items')
        .select('quantity, price, products(name)')
        .in('order_id', orderIds);

      const productMap = new Map();
      (items || []).forEach(item => {
        const name = item.products?.name || 'Producto eliminado';
        const entry = productMap.get(name) || { name, sales: 0, revenue: 0 };
        entry.sales += Number(item.quantity) || 0;
        entry.revenue += (Number(item.price) || 0) * (Number(item.quantity) || 0);
        productMap.set(name, entry);
      });
      products = [...productMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 4);
    }
    setTopProducts(products);

    // Summary cards
    const revenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const prevRevenue = prevOrdersList.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const ordersCount = orders.length;
    const prevOrdersCount = prevOrdersList.length;
    const activeCustomers = new Set(orders.map(o => o.customer_id)).size;

    const pctChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    setSummary({
      revenue,
      revenueChange: pctChange(revenue, prevRevenue),
      orders: ordersCount,
      ordersChange: pctChange(ordersCount, prevOrdersCount),
      activeCustomers,
      avgTicket: ordersCount > 0 ? revenue / ordersCount : 0,
    });

    setLoading(false);
  }, [store?.id, period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const valueFormatter = (number) => `$${new Intl.NumberFormat('es-CO').format(Math.round(number))}`;
  const ChangeIndicator = ({ value }) => (
    <p className="text-xs text-muted-foreground flex items-center mt-1">
      {value >= 0 ? (
        <ArrowUpRight className="h-3 w-3 text-emerald-500 mr-1" />
      ) : (
        <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
      )}
      <span className={value >= 0 ? "text-emerald-500 font-medium" : "text-red-500 font-medium"}>
        {value >= 0 ? '+' : ''}{value.toFixed(1)}%
      </span> vs periodo anterior
    </p>
  );

  if (loading) return <LoadingSpinner />;

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
            <div className="text-2xl font-bold">{valueFormatter(summary.revenue)}</div>
            <ChangeIndicator value={summary.revenueChange} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.orders}</div>
            <ChangeIndicator value={summary.ordersChange} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.activeCustomers}</div>
            <p className="text-xs text-muted-foreground mt-1">en este periodo</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{valueFormatter(summary.avgTicket)}</div>
            <p className="text-xs text-muted-foreground mt-1">por pedido</p>
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
                <CardDescription>Clientes con mayor volumen de pedidos en este periodo.</CardDescription>
            </CardHeader>
            <CardContent>
                {topCustomers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Sin pedidos en este periodo.</p>
                ) : (
                  <BarChart
                      data={topCustomers}
                      index="name"
                      categories={["orders"]}
                      className="h-[300px]"
                  />
                )}
            </CardContent>
          </Card>

           <Card>
             <CardHeader>
                <CardTitle>Rendimiento por Producto</CardTitle>
                <CardDescription>Productos más vendidos en este periodo.</CardDescription>
             </CardHeader>
             <CardContent>
                {topProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Sin ventas en este periodo.</p>
                ) : (
                  <div className="space-y-4">
                      {topProducts.map((product, i) => (
                          <div key={i} className="flex items-center">
                              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs mr-3">
                                  #{i + 1}
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
                )}
             </CardContent>
           </Card>
      </div>
    </div>
  );
};

export default AnalyticsTab;
