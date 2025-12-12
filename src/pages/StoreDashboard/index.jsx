
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useStoreDashboard } from '@/stores/useStoreDashboard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import ErrorBoundary from '@/components/shared/ErrorBoundary';

// Dashboard Imports - Ensuring all are present and correct
import RestaurantDashboard from './dashboards/RestaurantDashboard';
import HotelDashboard from './dashboards/HotelDashboard';
import ClothingStoreDashboard from './dashboards/ClothingStoreDashboard';
import PharmacyDashboard from './dashboards/PharmacyDashboard';
import BakeryDashboard from './dashboards/BakeryDashboard';
import GroceryDashboard from './dashboards/GroceryDashboard';
import GeneralStoreDashboard from './dashboards/GeneralStoreDashboard';
import AgriculturalDashboard from './dashboards/AgriculturalDashboard';

const StoreDashboardRouter = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { store, isLoadingStore, error, fetchStoreData } = useStoreDashboard();

  useEffect(() => {
    if (user) {
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
        {(() => {
            const category = store?.category;
            switch(category) {
                case 'Cultivador': return <AgriculturalDashboard store={store} />;
                case 'Restaurante': return <RestaurantDashboard store={store} />;
                case 'Hotel': return <HotelDashboard store={store} />;
                case 'Ropa': return <ClothingStoreDashboard store={store} />;
                case 'Farmacia': return <PharmacyDashboard store={store} />;
                case 'Panadería': return <BakeryDashboard store={store} />;
                case 'Supermercado': return <GroceryDashboard store={store} />;
                default: return <GeneralStoreDashboard store={store} />;
            }
        })()}
    </ErrorBoundary>
  );
};

export default StoreDashboardRouter;
