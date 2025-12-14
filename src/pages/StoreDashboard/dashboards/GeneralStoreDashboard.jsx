import React, { lazy } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  DollarSign,
  Settings,
  Users,
  Upload
} from 'lucide-react';
import BaseStoreDashboard from './BaseStoreDashboard';

// Lazy Load Tabs
const OverviewTab = lazy(() => import('../OverviewTab'));
const OrdersTab = lazy(() => import('../OrdersTab'));
const ProductsTab = lazy(() => import('../ProductsTab'));
const BulkUploadTab = lazy(() => import('../BulkUploadTab'));
const FinancialsTab = lazy(() => import('../FinancialsTab'));
const AdminTab = lazy(() => import('../AdminTab'));
const ProfileTab = lazy(() => import('../ProfileTab'));

const GeneralStoreDashboard = ({ store }) => {
  const tabs = [
    { path: '', label: 'Resumen', icon: LayoutDashboard, element: <OverviewTab storeId={store.id} /> },
    { path: 'pedidos', label: 'Pedidos', icon: ShoppingBag, element: <OrdersTab storeId={store.id} /> },
    { path: 'productos', label: 'Productos', icon: Package, element: <ProductsTab storeId={store.id} /> },
    { path: 'importar', label: 'Importar', icon: Upload, element: <BulkUploadTab storeId={store.id} /> },
    { path: 'finanzas', label: 'Finanzas', icon: DollarSign, element: <FinancialsTab storeId={store.id} /> },
    { path: 'equipo', label: 'Equipo', icon: Users, element: <AdminTab storeId={store.id} /> },
    { path: 'configuracion', label: 'Configuración', icon: Settings, element: <ProfileTab /> }
  ];

  return <BaseStoreDashboard store={store} tabs={tabs} />;
};

export default GeneralStoreDashboard;
