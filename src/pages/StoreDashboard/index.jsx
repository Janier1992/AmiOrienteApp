
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useStoreDashboard } from '@/stores/useStoreDashboard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import ErrorBoundary from '@/components/shared/ErrorBoundary';

// SCALABILITY UPDATE: Using Universal Dashboard for all Vertical Types
const UniversalStoreDashboard = React.lazy(() => import('./dashboards/UniversalStoreDashboard'));

const StoreDashboardRouter = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const { store, storeUserId, isLoadingStore, error, fetchStoreData } = useStoreDashboard();

    useEffect(() => {
        if (user) {
            if (store && useStoreDashboard.getState().storeUserId !== user.id) {
                useStoreDashboard.getState().reset();
            }
            fetchStoreData(user.id);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, fetchStoreData]);

    // Una cuenta de otro rol (p. ej. cliente) solo entra si es colaboradora de un
    // negocio; si no tiene negocio, no debe ver "Negocio no encontrado, ¿registrar
    // uno?" como si pudiera convertirse en tienda desde aquí.
    const isStoreRole = !user?.user_metadata?.role || user.user_metadata.role === 'tienda';
    const hasNoAccess = !!user && storeUserId === user.id && !isLoadingStore && !store && !isStoreRole;

    useEffect(() => {
        if (!user) {
            navigate('/tienda/login');
            return;
        }
        if (hasNoAccess) {
            navigate('/');
        }
    }, [user, hasNoAccess, navigate]);

    if (!user || hasNoAccess) return null;

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
                        <Button onClick={() => navigate('/tienda/registro')} className="w-full bg-green-700 hover:bg-green-800">
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

    return (
        <ErrorBoundary>
            <React.Suspense fallback={<div className="h-screen flex items-center justify-center"><LoadingSpinner text="Cargando panel..." /></div>}>
                <UniversalStoreDashboard />
            </React.Suspense>
        </ErrorBoundary>
    );
};

export default StoreDashboardRouter;
