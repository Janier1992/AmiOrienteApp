
import React, { lazy, useMemo } from 'react';
import { useStoreDashboard } from '@/stores/useStoreDashboard';
import { useAuth } from '@/contexts/SupabaseAuthContext';
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
    Hammer, // For Maintenance
    Wheat,
    DollarSign
} from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

// Lazy Load Views
const OverviewTab = lazy(() => import('../OverviewTab'));
const ProductsTab = lazy(() => import('../ProductsTab')); // Generic Product Tab
const OrdersManagementTab = lazy(() => import('../OrdersManagementTab')); // Generic Orders Tab
const GenericPOSView = lazy(() => import('../views/GenericPOSView')); // Generic POS
const StoreConfigTab = lazy(() => import('../StoreConfigTab'));
const FinancialsTab = lazy(() => import('../FinancialsTab'));
// Feature specific views
const KitchenMaintenanceView = lazy(() => import('../views/KitchenMaintenanceView'));
const AgroCropsView = lazy(() => import('../views/AgroCropsView'));
const QuickGridProductView = lazy(() => import('../views/QuickGridProductView')); // Inventario Rápido

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
        label: 'Inventario Rápido',
        icon: BarChart3,
        component: QuickGridProductView
    },
    // New Business Type Mappings
    'harvests': {
        path: 'cosechas',
        label: 'Cosechas',
        icon: Wheat, // Ensure Wheat is imported or use fallback
        component: AgroCropsView // Maps to Products but with "Cosecha" terminology
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
        path: 'finanzas',
        label: 'Finanzas',
        icon: DollarSign,
        component: FinancialsTab,
    },
    {
        path: 'configuracion',
        label: 'Configuración',
        icon: Settings,
        component: StoreConfigTab,
        bottom: true
    }
];

const UniversalStoreDashboard = () => {
    const { store, isLoading, setStore } = useStoreDashboard();
    const { user } = useAuth();

    // Derive Configuration
    const dashboardConfig = useMemo(() => {
        if (!store) return null;
        // Determine type based on service_categories name or stored type
        const categoryName = store.service_categories?.name || 'general';
        return getStoreTypeConfig(categoryName);
    }, [store]);

    const tabs = useMemo(() => {
        if (!dashboardConfig || !store) return [];

        const { features, terminology, cartStore } = dashboardConfig;

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
            // GenericPOSView needs the vertical's own cart store (useRestaurantStore,
            // useGroceryStore, etc), not storeId/terminology — it reads the store
            // itself via useStoreDashboard() and only needs to know which cart to use.
            const element = featureKey === 'pos'
                ? <Element useStore={cartStore} title={terminology?.product ? `${terminology.product} - Punto de Venta` : 'Punto de Venta'} />
                : <Element storeId={store.id} terminology={terminology} />;

            return {
                ...tabDef,
                label,
                element,
            };
        }).filter(Boolean);

        // Process Common Tabs
        // StoreConfigTab needs the full store object + setStore + user (not just
        // storeId) to pre-fill the form and actually be able to save changes.
        const commonTabs = COMMON_TABS.map(tab => {
            const Element = tab.component;
            return {
                ...tab,
                element: <Element storeId={store.id} store={store} setStore={setStore} user={user} />
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
    }, [dashboardConfig, store, setStore, user]);

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
