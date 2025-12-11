
import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboards/DashboardLayout';
import { LayoutDashboard, UtensilsCrossed, ChefHat, LayoutGrid, DollarSign, Settings, Users, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { BulkUploadTab } from '../BulkUploadTab';

import OverviewTab from '../OverviewTab';
import ProductsTab from '../ProductsTab';
import OrdersTab from '../OrdersTab';
import ProfileTab from '../ProfileTab';
import AdminTab from '../AdminTab';
import FinancialsTab from '../FinancialsTab';

const TableManagementComponent = ({ storeId }) => {
  const [tables, setTables] = useState([]);
  
  useEffect(() => {
    if(storeId) fetchTables();
  }, [storeId]);

  const fetchTables = async () => {
    const { data } = await supabase.from('restaurant_tables').select('*').eq('store_id', storeId).order('number');
    if(data) setTables(data);
  };

  const addTable = async () => {
    const number = prompt("Número de mesa:");
    if(!number) return;
    const { error } = await supabase.from('restaurant_tables').insert({ store_id: storeId, number, capacity: 4 });
    if(error) toast({title: "Error", description: error.message});
    else fetchTables();
  };

  const toggleStatus = async (table) => {
    const newStatus = table.status === 'available' ? 'occupied' : 'available';
    await supabase.from('restaurant_tables').update({ status: newStatus }).eq('id', table.id);
    fetchTables();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gestión de Mesas</CardTitle>
        <Button onClick={addTable}>+ Agregar Mesa</Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {tables.map(table => (
            <div 
                key={table.id} 
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    table.status === 'occupied' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                }`}
                onClick={() => toggleStatus(table)}
            >
                <div className="text-2xl font-bold text-center mb-2">{table.number}</div>
                <Badge variant={table.status === 'occupied' ? 'destructive' : 'default'} className="w-full justify-center">
                    {table.status === 'occupied' ? 'Ocupada' : 'Libre'}
                </Badge>
            </div>
          ))}
          {tables.length === 0 && <p className="col-span-full text-center text-gray-500">Agrega mesas para gestionarlas aquí.</p>}
        </div>
      </CardContent>
    </Card>
  );
};

const RestaurantDashboard = ({ store }) => {
  const navItems = [
    { icon: LayoutDashboard, label: 'Resumen', path: '' },
    { icon: ChefHat, label: 'Cocina y Pedidos', path: 'pedidos' },
    { icon: UtensilsCrossed, label: 'Menú', path: 'menu' },
    { icon: Upload, label: 'Importar', path: 'importar' },
    { icon: LayoutGrid, label: 'Mesas', path: 'mesas' },
    { icon: DollarSign, label: 'Finanzas', path: 'finanzas' },
    { icon: Users, label: 'Equipo', path: 'equipo' },
    { icon: Settings, label: 'Configuración', path: 'configuracion' },
  ];

  return (
    <DashboardLayout title={store.name} navItems={navItems}>
      <Routes>
        <Route path="/" element={<OverviewTab storeId={store.id} />} />
        <Route path="pedidos" element={<OrdersTab storeId={store.id} />} />
        <Route path="menu" element={<ProductsTab storeId={store.id} />} />
        <Route path="importar" element={<BulkUploadTab storeId={store.id} />} />
        <Route path="mesas" element={<TableManagementComponent storeId={store.id} />} />
        <Route path="finanzas" element={<FinancialsTab storeId={store.id} />} />
        <Route path="equipo" element={<AdminTab storeId={store.id} />} />
        <Route path="configuracion" element={<ProfileTab />} />
      </Routes>
    </DashboardLayout>
  );
};

export default RestaurantDashboard;
