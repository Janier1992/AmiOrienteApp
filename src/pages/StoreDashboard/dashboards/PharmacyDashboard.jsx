
import React, { memo } from 'react';
import { LayoutDashboard, Pill, ShoppingBag, DollarSign, Settings, Users, Upload, CreditCard } from 'lucide-react';
import BaseStoreDashboard from './BaseStoreDashboard';

// Views
import OverviewTab from '../OverviewTab';
import PharmacyProductsView from '../views/PharmacyProductsView'; // Specialized View
import OrdersTab from '../OrdersManagementTab';
import GenericPOSView from '../views/GenericPOSView';
import { BulkUploadTab } from '../BulkUploadTab';
import FinancialsTab from '../FinancialsTab';
import AdminTab from '../AdminTab';
import StoreSettingsTab from '../views/StoreSettingsTab'; // Standardized Base Component
import StoreCustomersTab from '../views/StoreCustomersTab'; // Standardized Base Component

import { usePharmacyStore } from '@/stores/usePharmacyStore';

const PharmacyDashboard = memo(({ store }) => {
  const tabs = [
    { path: '', label: 'Resumen', icon: LayoutDashboard, element: <OverviewTab storeId={store.id} /> },
    { path: 'caja', label: 'Caja (POS)', icon: CreditCard, element: <GenericPOSView useStore={usePharmacyStore} title="Farmacia - Caja" /> },
    { path: 'inventario', label: 'Medicamentos', icon: Pill, element: <PharmacyProductsView /> }, // Specialized
    { path: 'pedidos', label: 'Historial Pedidos', icon: ShoppingBag, element: <OrdersTab storeId={store.id} /> },
    { path: 'clientes', label: 'Pacientes', icon: Users, element: <StoreCustomersTab /> }, // Standardized Base
    { path: 'importar', label: 'Importar', icon: Upload, element: <BulkUploadTab storeId={store.id} onProductsUploaded={() => { }} /> },
    { path: 'finanzas', label: 'Finanzas', icon: DollarSign, element: <FinancialsTab storeId={store.id} /> },
    { path: 'equipo', label: 'Farmacéuticos', icon: Users, element: <AdminTab storeId={store.id} /> },
    { path: 'configuracion', label: 'Configuración', icon: Settings, element: <StoreSettingsTab /> },
  ];

  return <BaseStoreDashboard store={store} tabs={tabs} />;
});

export default PharmacyDashboard;
