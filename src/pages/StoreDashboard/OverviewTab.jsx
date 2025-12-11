
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, ShoppingBag, Package, TrendingUp } from 'lucide-react';
import { LineChart } from '@/components/ui/simple-charts';
import { useStoreDashboard } from '@/stores/useStoreDashboard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const OverviewTab = ({ storeId }) => {
  // Use specific loading state
  const { stats, fetchStats, isLoadingStats } = useStoreDashboard();

  useEffect(() => {
    if (storeId) {
        fetchStats(storeId);
    }
  }, [storeId, fetchStats]);

  // Show loading only if we have NO data. If we have cached data, show it while updating (stale-while-revalidate pattern)
  if (isLoadingStats && !stats) return <LoadingSpinner text="Actualizando métricas..." className="h-64" />;

  const { 
      total_sales = 0, 
      total_orders = 0, 
      total_products = 0, 
      platform_commission = 0, 
      monthlyIncome = [] 
  } = stats || {};

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${Number(total_sales).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+20.1% desde el mes pasado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Completados</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total_orders}</div>
            <p className="text-xs text-muted-foreground">Pedidos históricos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventario Activo</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total_products}</div>
            <p className="text-xs text-muted-foreground">Productos en stock</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comisión Plataforma</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">-${Number(platform_commission).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Soy del Campo (0% comisión)</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Ingresos por Periodo</CardTitle>
            <CardDescription>Resumen mensual de ventas.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <LineChart 
                data={monthlyIncome.length > 0 ? monthlyIncome : [{month: 'Hoy', total: 0}]} 
                index="month" 
                categories={["total"]} 
                valueFormatter={(number) => `$${Number(number).toLocaleString()}`} 
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OverviewTab;
