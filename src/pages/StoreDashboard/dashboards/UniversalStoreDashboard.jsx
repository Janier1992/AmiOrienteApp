
import React, { lazy, useMemo } from 'react';
import { useStoreDashboard } from '@/stores/useStoreDashboard';
import BaseStoreDashboard from './BaseStoreDashboard';
import { getStoreTypeConfig } from '@/config/storeTypes';
import {
    LayoutDashboard,
    ShoppingBag,
    FileText,
    Settings,
    CreditCard,
    Truck,
    BarChart3,
    Store,
    Calendar,
    Hammer // For Maintenance
} from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

// Lazy Load Views
const OverviewTab = lazy(() => import('../OverviewTab'));
const ProductsTab = lazy(() => import('../ProductsTab')); // Generic Product Tab
const OrdersManagementTab = lazy(() => import('../OrdersManagementTab')); // Generic Orders Tab
const GenericPOSView = lazy(() => import('../views/GenericPOSView')); // Generic POS
const StoreConfigTab = lazy(() => import('../StoreConfigTab'));
// Feature specific views
const KitchenMaintenanceView = lazy(() => import('../views/KitchenMaintenanceView'));

/**
 * Tab Registry
 * Maps feature strings (from config) to Component/Route definitions.
 */
/**
 * Tab Registry
 * Maps feature strings (from config) to Component/Route definitions.
 */
const FEATURE_TABS = {
    'overview': {
        path: '',
        label: 'Resumen',
        icon: LayoutDashboard,
        component: OverviewTab
    },
    'products': {
        path: 'productos',
        label: 'Productos', // Can be overridden by terminology
        icon: ShoppingBag,
        component: ProductsTab
    },
    'orders': {
        path: 'pedidos',
        label: 'Pedidos',
        icon: FileText,
        component: OrdersManagementTab
    },
    'pos': {
        path: 'caja',
        label: 'Punto de Venta',
        icon: CreditCard,
        component: GenericPOSView
    },
    'maintenance': {
        path: 'mantenimiento',
        label: 'Mantenimiento',
        icon: Hammer,
        component: KitchenMaintenanceView
    },
    'inventory': {
        path: 'inventario',
        label: 'Inventario',
        icon: BarChart3,
        component: ProductsTab // Reusing Products View for pure inventory for now, or could vary
    },
    // New Business Type Mappings
    'harvests': {
        path: 'cosechas',
        label: 'Cosechas',
        icon: Wheat, // Ensure Wheat is imported or use fallback
        component: ProductsTab // Maps to Products but with "Cosecha" terminology
    },
    'volume_orders': {
        path: 'pedidos-mayorista',
        label: 'Pedidos',
        icon: Truck,
        component: OrdersManagementTab
    },
    'rooms': {
        path: 'habitaciones',
        label: 'Habitaciones',
        icon: Store, // Or Bed icon if available
        component: ProductsTab
    },
    'bookings': {
        path: 'reservas',
        label: 'Reservas',
        icon: Calendar,
        component: OrdersManagementTab
    }
};

/**
 * Common Tabs that all stores get
 */
const COMMON_TABS = [
    {
        path: 'configuracion',
        label: 'Configuración',
        icon: Settings,
        component: StoreConfigTab,
        bottom: true
    }
];

const UniversalStoreDashboard = () => {
    const { store, isLoading } = useStoreDashboard();

    // Derive Configuration
    const dashboardConfig = useMemo(() => {
        if (!store) return null;
        // Determine type based on service_categories name or stored type
        const categoryName = store.service_categories?.name || 'general';
        return getStoreTypeConfig(categoryName);
    }, [store]);

    const tabs = useMemo(() => {
        if (!dashboardConfig || !store) return [];

        const { features, terminology } = dashboardConfig;

        // Map enabled features to Tab definitions
        const featureTabs = features.map(featureKey => {
            const tabDef = FEATURE_TABS[featureKey];
            if (!tabDef) return null;

            // Apply terminology overrides (e.g., "Platos" instead of "Productos")
            let label = tabDef.label;
            if (featureKey === 'products' && terminology?.product) label = `${terminology.product}s`;
            if (featureKey === 'orders' && terminology?.order) label = `${terminology.order}s`;
            if (featureKey === 'inventory' && terminology?.inventory) label = terminology.inventory;

            // Instantiate Component with Props
            const Element = tabDef.component;
            return {
                ...tabDef,
                label,
                // Pass configuration down to the view
                element: <Element storeId={store.id} terminology={terminology} />
            };
        }).filter(Boolean);

        // Process Common Tabs
        const commonTabs = COMMON_TABS.map(tab => {
            const Element = tab.component;
            return {
                ...tab,
                element: <Element storeId={store.id} />
            };
        });

        // Always add Overview at start and Settings at end
        // Instantiate Overview manually to match pattern
        const Overview = FEATURE_TABS.overview.component;
        const overviewTab = {
            ...FEATURE_TABS.overview,
            element: <Overview storeId={store.id} />
        };

        return [
            overviewTab,
            ...featureTabs,
            ...commonTabs
        ];
    }, [dashboardConfig, store]);

    if (isLoading) return <LoadingSpinner />;
    if (!store) return <div>No se encontró la tienda.</div>;

    return (
        <BaseStoreDashboard
            store={store}
            tabs={tabs}
            title={`Dashboard - ${store.name}`}
        />
    );
};

export default UniversalStoreDashboard;
