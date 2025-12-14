import React from 'react';
import { LayoutDashboard, UtensilsCrossed, ChefHat, LayoutGrid, DollarSign, Settings, Users, Upload } from 'lucide-react';
import { BulkUploadTab } from '../BulkUploadTab';
import BaseStoreDashboard from './BaseStoreDashboard';
import TableManagementTab from '../views/TableManagementTab';

// Lazy Load Tabs
const OverviewTab = React.lazy(() => import('../OverviewTab'));
const ProductsTab = React.lazy(() => import('../ProductsTab'));
const OrdersTab = React.lazy(() => import('../OrdersTab'));
const ProfileTab = React.lazy(() => import('../ProfileTab'));
const AdminTab = React.lazy(() => import('../AdminTab'));
const FinancialsTab = React.lazy(() => import('../FinancialsTab'));

const RestaurantDashboard = ({ store }) => {
  const tabs = [
    { path: '', label: 'Resumen', icon: LayoutDashboard, element: <OverviewTab storeId={store.id} /> },
    { path: 'pedidos', label: 'Cocina y Pedidos', icon: ChefHat, element: <OrdersTab storeId={store.id} /> },
    { path: 'menu', label: 'Menú', icon: UtensilsCrossed, element: <ProductsTab storeId={store.id} /> },
    { path: 'importar', label: 'Importar', icon: Upload, element: <BulkUploadTab storeId={store.id} /> },
    { path: 'mesas', label: 'Mesas', icon: LayoutGrid, element: <TableManagementTab storeId={store.id} /> },
    { path: 'finanzas', label: 'Finanzas', icon: DollarSign, element: <FinancialsTab storeId={store.id} /> },
    { path: 'equipo', label: 'Equipo', icon: Users, element: <AdminTab storeId={store.id} /> },
    { path: 'configuracion', label: 'Configuración', icon: Settings, element: <ProfileTab /> }
  ];

  return <BaseStoreDashboard store={store} tabs={tabs} />;
};

export default RestaurantDashboard;
