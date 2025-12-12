
import React, { memo } from 'react';
import { Routes, Route } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboards/DashboardLayout';
import { LayoutDashboard, Sprout, Tractor, DollarSign, Settings, Users, CloudSun, Upload } from 'lucide-react';
import { BulkUploadTab } from '../BulkUploadTab';

import OverviewTab from '../OverviewTab';
import ProductsTab from '../ProductsTab';
import OrdersTab from '../OrdersTab';
import ProfileTab from '../ProfileTab';
import AdminTab from '../AdminTab';
import FinancialsTab from '../FinancialsTab';

// Optimized with React.memo to prevent re-renders of the entire layout on minor updates
const AgriculturalDashboard = memo(({ store }) => {
  const navItems = [
    { icon: LayoutDashboard, label: 'Mi Finca', path: '' },
    { icon: Sprout, label: 'Cosechas', path: 'cosechas' }, 
    { icon: Tractor, label: 'Pedidos', path: 'pedidos' },
    { icon: Upload, label: 'Importar', path: 'importar' },
    { icon: CloudSun, label: 'Clima', path: 'clima' }, 
    { icon: DollarSign, label: 'Balance', path: 'finanzas' },
    { icon: Users, label: 'Trabajadores', path: 'equipo' },
    { icon: Settings, label: 'Cuenta', path: 'configuracion' },
  ];

  return (
    <DashboardLayout title={store.name} navItems={navItems}>
      <Routes>
        <Route path="/" element={<OverviewTab storeId={store.id} />} />
        <Route path="cosechas" element={<ProductsTab storeId={store.id} />} />
        <Route path="pedidos" element={<OrdersTab storeId={store.id} />} />
        <Route path="importar" element={<BulkUploadTab storeId={store.id} onProductsUploaded={() => {}} />} />
        <Route path="clima" element={<div className="p-8 text-center text-muted-foreground">Módulo de clima en desarrollo...</div>} />
        <Route path="finanzas" element={<FinancialsTab storeId={store.id} />} />
        <Route path="equipo" element={<AdminTab storeId={store.id} />} />
        <Route path="configuracion" element={<ProfileTab />} />
      </Routes>
    </DashboardLayout>
  );
});

export default AgriculturalDashboard;
