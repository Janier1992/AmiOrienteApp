
import React, { memo } from 'react';
import { LayoutDashboard, Pill, ShoppingBag, DollarSign, Settings, Users, Upload } from 'lucide-react';
import BaseStoreDashboard from './BaseStoreDashboard';

// Views
import OverviewTab from '../OverviewTab';
import PharmacyProductsView from '../views/PharmacyProductsView'; // Specialized View
import OrdersTab from '../OrdersTab';
import { BulkUploadTab } from '../BulkUploadTab';
import FinancialsTab from '../FinancialsTab';
import AdminTab from '../AdminTab';
import ProfileTab from '../ProfileTab';

const PharmacyDashboard = memo(({ store }) => {
  const tabs = [
    { path: '', label: 'Resumen', icon: LayoutDashboard, element: <OverviewTab storeId={store.id} /> },
    { path: 'inventario', label: 'Medicamentos', icon: Pill, element: <PharmacyProductsView /> }, // Specialized
    { path: 'pedidos', label: 'Pedidos', icon: ShoppingBag, element: <OrdersTab storeId={store.id} /> },
    { path: 'importar', label: 'Importar', icon: Upload, element: <BulkUploadTab storeId={store.id} onProductsUploaded={() => { }} /> },
    { path: 'finanzas', label: 'Caja', icon: DollarSign, element: <FinancialsTab storeId={store.id} /> },
    { path: 'equipo', label: 'Farmacéuticos', icon: Users, element: <AdminTab storeId={store.id} /> },
    { path: 'configuracion', label: 'Farma Ajustes', icon: Settings, element: <ProfileTab /> },
  ];

  return <BaseStoreDashboard store={store} tabs={tabs} />;
});

export default PharmacyDashboard;
