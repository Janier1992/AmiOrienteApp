
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboards/DashboardLayout';
import { LayoutDashboard, ShoppingBag, Package, DollarSign, Settings, Users, Shirt, Pill, Wheat, ShoppingCart, Upload } from 'lucide-react';
import { BulkUploadTab } from '../BulkUploadTab';

import OverviewTab from '../OverviewTab';
import ProductsTab from '../ProductsTab';
import OrdersTab from '../OrdersTab';
import ProfileTab from '../ProfileTab';
import AdminTab from '../AdminTab';
import FinancialsTab from '../FinancialsTab';

const RetailBaseDashboard = ({ store, icon: Icon, extraTabs = [] }) => {
  const navItems = [
    { icon: LayoutDashboard, label: 'Resumen', path: '' },
    { icon: ShoppingBag, label: 'Pedidos', path: 'pedidos' },
    { icon: Icon || Package, label: 'Productos', path: 'inventario' },
    { icon: Upload, label: 'Importar', path: 'importar' },
    { icon: DollarSign, label: 'Finanzas', path: 'finanzas' },
    { icon: Users, label: 'Equipo', path: 'equipo' },
    { icon: Settings, label: 'Configuración', path: 'configuracion' },
    ...extraTabs
  ];

  return (
    <DashboardLayout title={store.name} navItems={navItems}>
      <Routes>
        <Route path="/" element={<OverviewTab storeId={store.id} />} />
        <Route path="pedidos" element={<OrdersTab storeId={store.id} />} />
        <Route path="inventario" element={<ProductsTab storeId={store.id} />} />
        <Route path="importar" element={<BulkUploadTab storeId={store.id} onProductsUploaded={() => {}} />} />
        <Route path="finanzas" element={<FinancialsTab storeId={store.id} />} />
        <Route path="equipo" element={<AdminTab storeId={store.id} />} />
        <Route path="configuracion" element={<ProfileTab />} />
      </Routes>
    </DashboardLayout>
  );
};

export const ClothingDashboard = ({ store }) => (
    <RetailBaseDashboard store={store} icon={Shirt} />
);

export const PharmacyDashboard = ({ store }) => (
    <RetailBaseDashboard store={store} icon={Pill} />
);

export const BakeryDashboard = ({ store }) => (
    <RetailBaseDashboard store={store} icon={Wheat} />
);

export const GroceryDashboard = ({ store }) => (
    <RetailBaseDashboard store={store} icon={ShoppingCart} />
);

export const GeneralDashboard = ({ store }) => (
    <RetailBaseDashboard store={store} icon={Package} />
);
