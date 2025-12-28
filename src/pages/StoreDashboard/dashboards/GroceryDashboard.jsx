
import React, { memo, lazy } from 'react';
import { LayoutDashboard, ShoppingCart, ShoppingBag, DollarSign, Settings, Users, Upload, CreditCard } from 'lucide-react';
import BaseStoreDashboard from './BaseStoreDashboard';
import { useGroceryStore } from '@/stores/useGroceryStore';

// Views
import OverviewTab from '../OverviewTab';
import SupermarketProductsView from '../views/SupermarketProductsView'; // Specialized View
import OrdersTab from '../OrdersManagementTab';
import { BulkUploadTab } from '../BulkUploadTab';
import FinancialsTab from '../FinancialsTab';
import AdminTab from '../AdminTab';
import ProfileTab from '../ProfileTab';
// Lazy POS
const GenericPOSView = lazy(() => import('../views/GenericPOSView'));

const GroceryDashboard = memo(({ store }) => {
  const tabs = [
    { path: '', label: 'Resumen', icon: LayoutDashboard, element: <OverviewTab storeId={store.id} /> },
    { path: 'caja', label: 'Caja (POS)', icon: CreditCard, element: <GenericPOSView useStore={useGroceryStore} title="Caja Registradora" /> },
    { path: 'inventario', label: 'Inventario', icon: ShoppingCart, element: <SupermarketProductsView /> }, // Specialized (High Density)
    { path: 'pedidos', label: 'Pedidos', icon: ShoppingBag, element: <OrdersTab storeId={store.id} /> },
    { path: 'importar', label: 'Carga Masiva', icon: Upload, element: <BulkUploadTab storeId={store.id} onProductsUploaded={() => { }} /> },
    { path: 'finanzas', label: 'Finanzas', icon: DollarSign, element: <FinancialsTab storeId={store.id} /> },
    { path: 'equipo', label: 'Cajeros', icon: Users, element: <AdminTab storeId={store.id} /> },
    { path: 'configuracion', label: 'Ajustes', icon: Settings, element: <ProfileTab /> },
  ];

  return <BaseStoreDashboard store={store} tabs={tabs} />;
});

export default GroceryDashboard;
