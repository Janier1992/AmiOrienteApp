import React from 'react';
import { LayoutDashboard, Shirt, ShoppingBag, DollarSign, Settings, Palette, Users } from 'lucide-react';
import BaseStoreDashboard from './BaseStoreDashboard';

// Views
import OverviewTab from '../OverviewTab';
import ClothingProductsView from '../views/ClothingProductsView'; // Specialized View
import OrdersTab from '../OrdersTab';
import FinancialsTab from '../FinancialsTab';
import ProfileTab from '../ProfileTab';

const ClothingStoreDashboard = ({ store }) => {
  const tabs = [
    { path: '', label: 'Resumen', icon: LayoutDashboard, element: <OverviewTab storeId={store.id} /> },
    { path: 'colecccion', label: 'Colección', icon: Shirt, element: <ClothingProductsView /> }, // Specialized
    { path: 'pedidos', label: 'Pedidos', icon: ShoppingBag, element: <OrdersTab storeId={store.id} /> },
    { path: 'finanzas', label: 'Finanzas', icon: DollarSign, element: <FinancialsTab storeId={store.id} /> },
    { path: 'configuracion', label: 'Ajustes', icon: Settings, element: <ProfileTab /> },
  ];

  return <BaseStoreDashboard store={store} tabs={tabs} />;
};

export default ClothingStoreDashboard;
