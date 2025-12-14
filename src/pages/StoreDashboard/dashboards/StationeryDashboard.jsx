import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboards/DashboardLayout';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Upload,
    DollarSign,
    Users,
    Settings
} from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

// Logic Components
import StationeryProductsView from '../views/StationeryProductsView';

// Lazy Load Tabs
const OverviewTab = React.lazy(() => import('../OverviewTab'));
const OrdersTab = React.lazy(() => import('../OrdersTab'));
const ProfileTab = React.lazy(() => import('../ProfileTab'));
const AdminTab = React.lazy(() => import('../AdminTab'));
const BulkUploadTab = React.lazy(() => import('../BulkUploadTab'));
const FinancialsTab = React.lazy(() => import('../FinancialsTab'));

const StationeryDashboard = ({ store }) => {
    const navItems = [
        { icon: LayoutDashboard, label: 'Resumen', path: '' },
        { icon: ShoppingCart, label: 'Pedidos', path: 'pedidos' },
        { icon: Package, label: 'Productos', path: 'productos' },
        { icon: Upload, label: 'Importar', path: 'importar' },
        { icon: DollarSign, label: 'Finanzas', path: 'finanzas' },
        { icon: Users, label: 'Equipo', path: 'equipo' },
        { icon: Settings, label: 'Configuración', path: 'configuracion' },
    ];

    return (
        <DashboardLayout title={store?.name || "Papelería Admin"} subtitle="Panel de Gestión" navItems={navItems}>
            <Suspense fallback={<div className="h-full flex items-center justify-center"><LoadingSpinner /></div>}>
                <Routes>
                    <Route path="/" element={<OverviewTab storeId={store.id} />} />
                    <Route path="pedidos" element={<OrdersTab storeId={store.id} />} />
                    {/* Use the extracted view component */}
                    <Route path="productos" element={<StationeryProductsView />} />
                    <Route path="importar" element={<BulkUploadTab storeId={store.id} />} />
                    <Route path="finanzas" element={<FinancialsTab storeId={store.id} />} />
                    <Route path="equipo" element={<AdminTab storeId={store.id} />} />
                    <Route path="configuracion" element={<ProfileTab />} />
                </Routes>
            </Suspense>
        </DashboardLayout>
    );
};

export default StationeryDashboard;
