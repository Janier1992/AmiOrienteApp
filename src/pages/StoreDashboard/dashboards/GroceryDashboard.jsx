
import React, { memo } from 'react';
import { LayoutDashboard, ShoppingCart, ShoppingBag, DollarSign, Settings, Users, Upload } from 'lucide-react';
import BaseStoreDashboard from './BaseStoreDashboard';

// Views
import OverviewTab from '../OverviewTab';
import SupermarketProductsView from '../views/SupermarketProductsView'; // Specialized View
import OrdersTab from '../OrdersTab';
import { BulkUploadTab } from '../BulkUploadTab';
import FinancialsTab from '../FinancialsTab';
import AdminTab from '../AdminTab';
import ProfileTab from '../ProfileTab';

const GroceryDashboard = memo(({ store }) => {
  const tabs = [
    { path: '', label: 'Resumen', icon: LayoutDashboard, element: <OverviewTab storeId={store.id} /> },
    { path: 'inventario', label: 'Inventario', icon: ShoppingCart, element: <SupermarketProductsView /> }, // Specialized (High Density)
    { path: 'pedidos', label: 'Pedidos', icon: ShoppingBag, element: <OrdersTab storeId={store.id} /> },
    { path: 'importar', label: 'Carga Masiva', icon: Upload, element: <BulkUploadTab storeId={store.id} onProductsUploaded={() => { }} /> },
    { path: 'finanzas', label: 'Caja', icon: DollarSign, element: <FinancialsTab storeId={store.id} /> },
    { path: 'equipo', label: 'Cajeros', icon: Users, element: <AdminTab storeId={store.id} /> },
    { path: 'configuracion', label: 'Ajustes', icon: Settings, element: <ProfileTab /> },
  ];

  return <BaseStoreDashboard store={store} tabs={tabs} />;
});

export default GroceryDashboard;
