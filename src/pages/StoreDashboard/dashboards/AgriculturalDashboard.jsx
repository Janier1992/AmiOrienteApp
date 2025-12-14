import React, { memo } from 'react';
import { LayoutDashboard, Sprout, Tractor, DollarSign, Settings, Users, CloudSun, Upload } from 'lucide-react';
import BaseStoreDashboard from './BaseStoreDashboard';

// Logic Components
import OverviewTab from '../OverviewTab';
import AgroCropsView from '../views/AgroCropsView'; // Specialized View
import OrdersTab from '../OrdersTab';
import { BulkUploadTab } from '../BulkUploadTab';
import FinancialsTab from '../FinancialsTab';
import AdminTab from '../AdminTab'; // Equipo / Trabajadores
import ProfileTab from '../ProfileTab';

const AgriculturalDashboard = memo(({ store }) => {
  const tabs = [
    { path: '', label: 'Admin Finca', icon: LayoutDashboard, element: <OverviewTab storeId={store.id} /> },
    { path: 'cosechas', label: 'Cosechas', icon: Sprout, element: <AgroCropsView /> }, // Specialized Tab
    { path: 'pedidos', label: 'Pedidos', icon: Tractor, element: <OrdersTab storeId={store.id} /> },
    { path: 'importar', label: 'Importar', icon: Upload, element: <BulkUploadTab storeId={store.id} onProductsUploaded={() => { }} /> },
    { path: 'clima', label: 'Clima', icon: CloudSun, element: <div className="p-8 text-center text-muted-foreground">Módulo de clima en desarrollo...</div> },
    { path: 'finanzas', label: 'Balance', icon: DollarSign, element: <FinancialsTab storeId={store.id} /> },
    { path: 'equipo', label: 'Trabajadores', icon: Users, element: <AdminTab storeId={store.id} /> },
    { path: 'configuracion', label: 'Cuenta', icon: Settings, element: <ProfileTab /> },
  ];

  return <BaseStoreDashboard store={store} tabs={tabs} />;
});

export default AgriculturalDashboard;
