
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useStoreDashboard } from '@/stores/useStoreDashboard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import ErrorBoundary from '@/components/shared/ErrorBoundary';

// Dashboard Imports - Ensuring all are present and correct
// Lazy Load Dashboards to optimize bundle size and enforce separation of concerns
const RestaurantDashboard = React.lazy(() => import('./dashboards/RestaurantDashboard'));
const HotelDashboard = React.lazy(() => import('./dashboards/HotelDashboard'));
const ClothingStoreDashboard = React.lazy(() => import('./dashboards/ClothingStoreDashboard'));
const PharmacyDashboard = React.lazy(() => import('./dashboards/PharmacyDashboard'));
const BakeryDashboard = React.lazy(() => import('./dashboards/BakeryDashboard'));
const GroceryDashboard = React.lazy(() => import('./dashboards/GroceryDashboard'));
const GeneralStoreDashboard = React.lazy(() => import('./dashboards/GeneralStoreDashboard'));
const AgriculturalDashboard = React.lazy(() => import('./dashboards/AgriculturalDashboard'));
const StationeryDashboard = React.lazy(() => import('./dashboards/StationeryDashboard'));

const StoreDashboardRouter = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const { store, isLoadingStore, error, fetchStoreData } = useStoreDashboard();

    useEffect(() => {
        if (user) {
            // Paranoid check: If store exists in state but belongs to another user, 
            // FORCE nullify it before fetching.
            if (store && store.owner_id !== user.id) {
                useStoreDashboard.getState().reset();
            }
            fetchStoreData(user.id);
        }
    }, [user, fetchStoreData]);

    if (!user) {
        navigate('/tienda/login');
        return null;
    }

    // Critical fix: Ensure loading spinner has background so it doesn't look transparent/broken
    if (isLoadingStore) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <LoadingSpinner text="Cargando tu negocio..." size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center border border-red-100">
                    <h2 className="text-xl font-bold text-red-600 mb-2">Error de Carga</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Button onClick={() => window.location.reload()} className="w-full">
                        Reintentar
                    </Button>
                </div>
            </div>
        );
    }

    if (!store) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Negocio no encontrado</h2>
                    <p className="text-gray-600 mb-6">
                        No se encontró un negocio asociado a tu cuenta. ¿Deseas registrar uno nuevo?
                    </p>
                    <div className="space-y-3">
                        <Button onClick={() => navigate('/tienda/registro')} className="w-full bg-green-600 hover:bg-green-700">
                            Registrar Negocio
                        </Button>
                        <Button onClick={() => signOut()} variant="outline" className="w-full">
                            Cerrar Sesión
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Simplified render logic to prevent component re-definition
    return (
        <ErrorBoundary>
            <React.Suspense fallback={<div className="h-screen flex items-center justify-center"><LoadingSpinner text="Cargando panel..." /></div>}>
                {(() => {
                    const category = store?.category ? store.category.trim() : '';
                    // Normalize for comparison (remove accents, lowercase?) 
                    // Actually, database should be consistent, but let's be safe against trailing spaces.

                    switch (category) {
                        case 'Cultivador':
                        case 'Cultivadores':
                            return <AgriculturalDashboard store={store} />;

                        case 'Restaurante':
                            return <RestaurantDashboard store={store} />;

                        case 'Hotel':
                            return <HotelDashboard store={store} />;

                        case 'Ropa':
                        case 'Tienda de Ropa':
                            return <ClothingStoreDashboard store={store} />;

                        case 'Farmacia':
                            return <PharmacyDashboard store={store} />;

                        case 'Panadería':
                            return <BakeryDashboard store={store} />;

                        case 'Supermercado':
                            return <GroceryDashboard store={store} />;

                        case 'Papelería':
                            return <StationeryDashboard store={store} />;

                        default:
                            console.warn('Dashboard fallback for category:', category);
                            return <GeneralStoreDashboard store={store} />;
                    }
                })()}
            </React.Suspense>
        </ErrorBoundary>
    );
};

export default StoreDashboardRouter;
