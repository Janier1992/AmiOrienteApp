
import React from 'react';
// Routes, Route removed - handled in BaseStoreDashboard
// DashboardLayout removed - handled in BaseStoreDashboard
import { LayoutDashboard, ShoppingBag, Package, DollarSign, Settings, Users, Shirt, Pill, Wheat, ShoppingCart, Upload } from 'lucide-react';
import { BulkUploadTab } from '../BulkUploadTab';

import OverviewTab from '../OverviewTab';
import ProductsTab from '../ProductsTab';
import OrdersTab from '../OrdersTab';
import ProfileTab from '../ProfileTab';
import AdminTab from '../AdminTab';
import FinancialsTab from '../FinancialsTab';

import BaseStoreDashboard from './BaseStoreDashboard';

const RetailBaseDashboard = ({ store, icon: Icon, extraTabs = [] }) => {
  const tabs = [
    { path: '', label: 'Resumen', icon: LayoutDashboard, element: <OverviewTab storeId={store.id} /> },
    { path: 'pedidos', label: 'Pedidos', icon: ShoppingBag, element: <OrdersTab storeId={store.id} /> },
    { path: 'inventario', label: 'Productos', icon: Icon || Package, element: <ProductsTab storeId={store.id} /> },
    { path: 'importar', label: 'Importar', icon: Upload, element: <BulkUploadTab storeId={store.id} onProductsUploaded={() => { }} /> },
    { path: 'finanzas', label: 'Finanzas', icon: DollarSign, element: <FinancialsTab storeId={store.id} /> },
    { path: 'equipo', label: 'Equipo', icon: Users, element: <AdminTab storeId={store.id} /> },
    { path: 'configuracion', label: 'Configuración', icon: Settings, element: <ProfileTab /> },
    ...extraTabs
  ];

  return <BaseStoreDashboard store={store} tabs={tabs} />;
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
