import React from 'react';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Upload,
    DollarSign,
    Users,
    Settings,
    FolderOpen
} from 'lucide-react';
import BaseStoreDashboard from './BaseStoreDashboard';

// Logic Components
import StationeryProductsView from '../views/StationeryProductsView';
import StationeryPOSView from '../views/StationeryPOSView';
// Base Model Components
import StoreSettingsTab from '../views/StoreSettingsTab';
import StoreCustomersTab from '../views/StoreCustomersTab';

// Lazy Load Tabs
const OverviewTab = React.lazy(() => import('../OverviewTab'));
const OrdersTab = React.lazy(() => import('../OrdersTab'));
// ProfileTab replaced by StoreSettingsTab
const AdminTab = React.lazy(() => import('../AdminTab'));
const BulkUploadTab = React.lazy(() => import('../BulkUploadTab'));
const FinancialsTab = React.lazy(() => import('../FinancialsTab'));

const StationeryDashboard = ({ store }) => {
    const tabs = [
        { path: '', label: 'Resumen', icon: LayoutDashboard, element: <OverviewTab storeId={store.id} /> },
        { path: 'caja', label: 'Caja / Ventas', icon: ShoppingCart, element: <StationeryPOSView /> }, // New POS Tab
        { path: 'pedidos', label: 'Historial Pedidos', icon: Package, element: <OrdersTab storeId={store.id} /> },
        { path: 'productos', label: 'Inventario', icon: FolderOpen, element: <StationeryProductsView /> },
        { path: 'importar', label: 'Importar', icon: Upload, element: <BulkUploadTab storeId={store.id} /> },
        { path: 'finanzas', label: 'Finanzas', icon: DollarSign, element: <FinancialsTab storeId={store.id} /> },
        { path: 'equipo', label: 'Equipo', icon: Users, element: <AdminTab storeId={store.id} /> },
        // Added Base Model Customers Tab if needed, but 'Equipo' is different (Staff). 
        // Let's add 'Clientes' as requested by the model.
        { path: 'clientes', label: 'Clientes', icon: Users, element: <StoreCustomersTab /> },
        { path: 'configuracion', label: 'Configuración', icon: Settings, element: <StoreSettingsTab /> }
    ];

    return <BaseStoreDashboard store={store} tabs={tabs} title="Papelería Admin" />;
};

export default StationeryDashboard;
