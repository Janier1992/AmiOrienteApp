import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

/**
 * HOC para proteger componentes de dashboard según la categoría del negocio.
 * 
 * @param {React.Component} WrappedComponent - Componente a proteger
 * @param {string[]} allowedCategories - Lista de categorías permitidas (ej: ['Hotel', 'Hostal'])
 * @returns {React.Component} Componente protegido
 */
export const withStoreCategory = (WrappedComponent, allowedCategories) => {
    const ProtectedComponent = (props) => {
        const navigate = useNavigate();
        const { store } = props;

        // Si no hay tienda cargada, asumimos que el padre maneja el loading/error o no renderiza esto.
        if (!store) return null;

        const category = store.category ? store.category.trim() : '';

        // Normalización básica para comparación (opcional, pero recomendada)
        // Aquí asumimos que allowedCategories viene exacto como en BD o el Router
        const isAllowed = allowedCategories.some(c =>
            c.toLowerCase() === category.toLowerCase()
        );

        if (!isAllowed) {
            return (
                <div className="h-screen flex items-center justify-center bg-red-50 p-4">
                    <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center border border-red-200">
                        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-red-700 mb-2">Acceso Restringido</h2>
                        <p className="text-gray-600 mb-6">
                            Este módulo está diseñado para negocios de tipo: <strong>{allowedCategories.join(', ')}</strong>.
                            <br />
                            Tu negocio es de tipo: <strong>{category}</strong>.
                        </p>
                        <Button onClick={() => window.location.reload()} variant="outline">
                            Volver al Inicio
                        </Button>
                    </div>
                </div>
            );
        }

        return <WrappedComponent {...props} />;
    };

    return ProtectedComponent;
};
