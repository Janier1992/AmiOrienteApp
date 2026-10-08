import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LifeBuoy } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboards/DashboardLayout';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const SupportTab = lazy(() => import('../views/SupportTab'));

/**
 * @typedef {Object} DashboardTabConfig
 * @property {string} path - Ruta relativa (ej: 'pedidos', '' para root)
 * @property {React.ReactNode} element - Componente a renderizar
 * @property {string} label - Etiqueta para la sidebar
 * @property {import('lucide-react').Icon} icon - Icono para la sidebar
 * @property {number} [badge] - Contador que se muestra junto a la etiqueta en la sidebar
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
 * @param {React.ReactNode} [props.banner] - Contenido que se muestra sobre las secciones
 */
const BaseStoreDashboard = ({ store, tabs, title, banner = null }) => {
    // Every vertical gets a "Soporte" tab automatically, so stores can
    // report a problem straight to the platform admin without each
    // dashboard having to wire it in individually.
    const allTabs = [
        ...tabs,
        {
            path: 'soporte',
            label: 'Soporte',
            icon: LifeBuoy,
            element: <SupportTab storeId={store?.id} />,
        },
    ];

    // Generate Nav Items for Sidebar
    const navItems = allTabs
        .filter(tab => !tab.hidden)
        .map(tab => ({
            label: tab.label,
            icon: tab.icon,
            path: tab.path,
            badge: tab.badge,
            // You might want to handle 'bottom' grouping logic in DashboardLayout/Sidebar if needed
        }));

    return (
        <DashboardLayout
            title={title || store?.name || 'Dashboard'}
            navItems={navItems}
        >
            {banner}
            <Suspense fallback={<div className="h-full flex items-center justify-center"><LoadingSpinner /></div>}>
                <Routes>
                    {allTabs.map((tab) => (
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
