
import React, { memo } from 'react';
import { LayoutDashboard, Wheat, ShoppingBag, DollarSign, Settings, Users, Upload } from 'lucide-react';
import BaseStoreDashboard from './BaseStoreDashboard';

// Views
import OverviewTab from '../OverviewTab';
import RestaurantMenuView from '../views/RestaurantMenuView'; // Bakeries are visually similar to Menu/Food
import OrdersTab from '../OrdersTab';
import { BulkUploadTab } from '../BulkUploadTab';
import FinancialsTab from '../FinancialsTab';
import AdminTab from '../AdminTab';
import ProfileTab from '../ProfileTab';

const BakeryDashboard = memo(({ store }) => {
  const tabs = [
    { path: '', label: 'Resumen', icon: LayoutDashboard, element: <OverviewTab storeId={store.id} /> },
    { path: 'catalogo', label: 'Vitrina', icon: Wheat, element: <RestaurantMenuView /> }, // Reusing Menu View for Food Visuals
    { path: 'pedidos', label: 'Pedidos', icon: ShoppingBag, element: <OrdersTab storeId={store.id} /> },
    { path: 'importar', label: 'Importar', icon: Upload, element: <BulkUploadTab storeId={store.id} onProductsUploaded={() => { }} /> },
    { path: 'finanzas', label: 'Caja', icon: DollarSign, element: <FinancialsTab storeId={store.id} /> },
    { path: 'equipo', label: 'Panaderos', icon: Users, element: <AdminTab storeId={store.id} /> },
    { path: 'configuracion', label: 'Ajustes', icon: Settings, element: <ProfileTab /> },
  ];

  return <BaseStoreDashboard store={store} tabs={tabs} />;
});

export default BakeryDashboard;
