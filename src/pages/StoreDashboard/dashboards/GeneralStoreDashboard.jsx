import React, { lazy } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  DollarSign,
  Settings,
  Users,
  Upload,
  CreditCard,
  TableProperties
} from 'lucide-react';
import BaseStoreDashboard from './BaseStoreDashboard';
import { useGeneralStore } from '@/stores/useGeneralStore';

// Lazy Load Tabs
const OverviewTab = lazy(() => import('../OverviewTab'));
const OrdersTab = lazy(() => import('../OrdersManagementTab'));
// const ProductsTab = lazy(() => import('../ProductsTab')); // Replaced by QuickGrid
const GenericPOSView = lazy(() => import('../views/GenericPOSView')); // POS
const QuickGridProductView = lazy(() => import('../views/QuickGridProductView')); // Quick Grid
const BulkUploadTab = lazy(() => import('../BulkUploadTab'));
const FinancialsTab = lazy(() => import('../FinancialsTab'));
const AdminTab = lazy(() => import('../AdminTab'));
const ProfileTab = lazy(() => import('../ProfileTab'));

const GeneralStoreDashboard = ({ store }) => {
  const tabs = [
    { path: '', label: 'Resumen', icon: LayoutDashboard, element: <OverviewTab storeId={store.id} /> },
    { path: 'caja', label: 'Caja (POS)', icon: CreditCard, element: <GenericPOSView useStore={useGeneralStore} title="Punto de Venta" /> },
    { path: 'productos', label: 'Inventario (Rápido)', icon: TableProperties, element: <QuickGridProductView storeId={store.id} /> },
    { path: 'pedidos', label: 'Pedidos', icon: ShoppingBag, element: <OrdersTab storeId={store.id} /> },
    { path: 'importar', label: 'Importar', icon: Upload, element: <BulkUploadTab storeId={store.id} /> },
    { path: 'finanzas', label: 'Finanzas', icon: DollarSign, element: <FinancialsTab storeId={store.id} /> },
    { path: 'equipo', label: 'Equipo', icon: Users, element: <AdminTab storeId={store.id} /> },
    { path: 'configuracion', label: 'Configuración', icon: Settings, element: <ProfileTab /> }
  ];

  return <BaseStoreDashboard store={store} tabs={tabs} />;
};

export default GeneralStoreDashboard;
