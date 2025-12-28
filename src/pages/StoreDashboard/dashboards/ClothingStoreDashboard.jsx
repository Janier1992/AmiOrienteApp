import React from 'react';
import { LayoutDashboard, Shirt, ShoppingBag, DollarSign, Settings, Palette, Users } from 'lucide-react';
import BaseStoreDashboard from './BaseStoreDashboard';

// Views
import OverviewTab from '../OverviewTab';
import ClothingProductsView from '../views/ClothingProductsView'; // Specialized View
import OrdersTab from '../OrdersManagementTab';
import FinancialsTab from '../FinancialsTab';
import StoreSettingsTab from '../views/StoreSettingsTab'; // Standardized Base Component
import StoreCustomersTab from '../views/StoreCustomersTab'; // Standardized Base Component

const ClothingStoreDashboard = ({ store }) => {
  const tabs = [
    { path: '', label: 'Resumen', icon: LayoutDashboard, element: <OverviewTab storeId={store.id} /> },
    { path: 'coleccion', label: 'Colección', icon: Shirt, element: <ClothingProductsView /> }, // Typo fixed
    { path: 'pedidos', label: 'Pedidos', icon: ShoppingBag, element: <OrdersTab storeId={store.id} /> },
    { path: 'clientes', label: 'Clientes', icon: Users, element: <StoreCustomersTab /> }, // Added Base Capability
    { path: 'finanzas', label: 'Finanzas', icon: DollarSign, element: <FinancialsTab storeId={store.id} /> },
    { path: 'configuracion', label: 'Configuración', icon: Settings, element: <StoreSettingsTab /> }, // Standardized
  ];

  return <BaseStoreDashboard store={store} tabs={tabs} />;
};

export default ClothingStoreDashboard;
