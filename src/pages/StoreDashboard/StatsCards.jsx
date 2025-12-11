import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Package, ShoppingCart, TrendingUp } from 'lucide-react';

export const StatsCards = ({ stats }) => {
  const { total_sales, total_orders, total_products, platform_commission } = stats || {};

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ventas Totales</p>
              <p className="text-2xl font-bold text-gray-900">${Number(total_sales || 0).toLocaleString('es-CO')}</p>
              <p className="text-xs text-green-600">+20.1% desde el mes pasado</p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Productos</p>
              <p className="text-2xl font-bold text-gray-900">{total_products || 0}</p>
              <p className="text-xs text-blue-600">+2 nuevos esta semana</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pedidos</p>
              <p className="text-2xl font-bold text-gray-900">{total_orders || 0}</p>
              <p className="text-xs text-purple-600">+12% desde ayer</p>
            </div>
            <div className="p-3 rounded-full bg-purple-100">
              <ShoppingCart className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Comisión Plataforma</p>
              <p className="text-2xl font-bold text-red-600">-${Number(platform_commission || 0).toLocaleString('es-CO')}</p>
              <p className="text-xs text-gray-500">22% de las ventas</p>
            </div>
            <div className="p-3 rounded-full bg-red-100">
              <TrendingUp className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};