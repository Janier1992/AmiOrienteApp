import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboards/DashboardLayout';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

/**
 * @typedef {Object} DashboardTabConfig
 * @property {string} path - Ruta relativa (ej: 'pedidos', '' para root)
 * @property {React.ReactNode} element - Componente a renderizar
 * @property {string} label - Etiqueta para la sidebar
 * @property {import('lucide-react').Icon} icon - Icono para la sidebar
 * @property {boolean} [hidden] - Si es true, no aparece en sidebar pero la ruta existe
 * @property {boolean} [bottom] - Si es true, aparece al final de la sidebar (ej: config)
 */

/**
 * Componente base para todos los dashboards de tienda.
 * Genera automáticamente la navegación y las rutas basada en la configuración.
 * 
 * @param {Object} props
 * @param {import('@/services/storeService').Store} props.store
 * @param {DashboardTabConfig[]} props.tabs
 * @param {string} [props.title] - Título opcional (por defecto usa store.name)
 */
const BaseStoreDashboard = ({ store, tabs, title }) => {
    // Generate Nav Items for Sidebar
    const navItems = tabs
        .filter(tab => !tab.hidden)
        .map(tab => ({
            label: tab.label,
            icon: tab.icon,
            path: tab.path,
            // You might want to handle 'bottom' grouping logic in DashboardLayout/Sidebar if needed
        }));

    return (
        <DashboardLayout
            title={title || store?.name || 'Dashboard'}
            navItems={navItems}
        >
            <Suspense fallback={<div className="h-full flex items-center justify-center"><LoadingSpinner /></div>}>
                <Routes>
                    {tabs.map((tab) => (
                        <Route
                            key={tab.path}
                            path={tab.path}
                            element={tab.element}
                        />
                    ))}
                    {/* Fallback route could go here */}
                </Routes>
            </Suspense>
        </DashboardLayout>
    );
};

export default BaseStoreDashboard;
