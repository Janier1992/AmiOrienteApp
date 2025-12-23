import React, { memo } from 'react';
import { LayoutDashboard, Sprout, Tractor, DollarSign, Settings, Users, CloudSun, Upload, ShoppingBag, CreditCard, Truck, QrCode } from 'lucide-react';
import BaseStoreDashboard from './BaseStoreDashboard';

// Logic Components
import OverviewTab from '../OverviewTab';
import AgroCropsView from '../views/AgroCropsView'; // Specialized View
// import ProductsTab from '../ProductsTab'; // OLD
import GenericPOSView from '../views/GenericPOSView';
import AgroLogisticsView from '../views/AgroLogisticsView';
import OrdersTab from '../OrdersTab';
import { BulkUploadTab } from '../BulkUploadTab';
import FinancialsTab from '../FinancialsTab';
import AdminTab from '../AdminTab'; // Equipo / Trabajadores
import StoreSettingsTab from '../views/StoreSettingsTab'; // Standardized Base Component
import StoreCustomersTab from '../views/StoreCustomersTab'; // Standardized Base Component

import { useAgroStore } from '@/stores/useAgroStore';

const AgriculturalDashboard = memo(({ store }) => {
  const tabs = [
    { path: '', label: 'Admin Finca', icon: LayoutDashboard, element: <OverviewTab storeId={store.id} /> },
    { path: 'caja', label: 'Caja (Venta Directa)', icon: CreditCard, element: <GenericPOSView useStore={useAgroStore} title="Finca - Venta Directa" /> },
    { path: 'cosechas', label: 'Cosechas', icon: Sprout, element: <AgroCropsView /> }, // Specialized Tab
    { path: 'logistica', label: 'Logística / Envíos', icon: Truck, element: <AgroLogisticsView /> },
    { path: 'pedidos', label: 'Pedidos Marketplace', icon: ShoppingBag, element: <OrdersTab storeId={store.id} /> },
    { path: 'clientes', label: 'Clientes', icon: Users, element: <StoreCustomersTab /> }, // Standardized Base
    { path: 'trazabilidad', label: 'Trazabilidad (QR)', icon: QrCode, element: <div className="p-8 text-center text-muted-foreground">Módulo de Trazabilidad y QR en desarrollo...</div> },
    { path: 'importar', label: 'Importar', icon: Upload, element: <BulkUploadTab storeId={store.id} onProductsUploaded={() => { }} /> },
    { path: 'clima', label: 'Clima', icon: CloudSun, element: <div className="p-8 text-center text-muted-foreground">Módulo de clima en desarrollo...</div> },
    { path: 'finanzas', label: 'Finanzas', icon: DollarSign, element: <FinancialsTab storeId={store.id} /> },
    { path: 'equipo', label: 'Trabajadores', icon: Users, element: <AdminTab storeId={store.id} /> },
    { path: 'configuracion', label: 'Configuración', icon: Settings, element: <StoreSettingsTab /> },
  ];

  return <BaseStoreDashboard store={store} tabs={tabs} />;
});

export default AgriculturalDashboard;
