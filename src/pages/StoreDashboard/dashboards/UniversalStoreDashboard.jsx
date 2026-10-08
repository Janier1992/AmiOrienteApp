
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
    DollarSign,
    LayoutGrid,
    UtensilsCrossed,
    ClipboardCheck,
    Users,
    Percent,
    LineChart,
    Bot,
    Gem,
    Users2,
    CreditCard as PaymentsIcon
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
const TableManagementTab = lazy(() => import('../views/TableManagementTab'));
const RestaurantMenuView = lazy(() => import('../views/RestaurantMenuView'));
const HotelRoomsTab = lazy(() => import('../HotelRoomsTab'));
const HotelReservationsTab = lazy(() => import('../HotelReservationsTab'));
const HotelReceptionTab = lazy(() => import('../HotelReceptionTab'));
const HotelGuestsTab = lazy(() => import('../HotelGuestsTab'));
const StoreCustomersTab = lazy(() => import('../views/StoreCustomersTab'));
const DiscountsTab = lazy(() => import('../DiscountsTab'));
const AnalyticsTab = lazy(() => import('../AnalyticsTab'));
const SubscriptionTab = lazy(() => import('../SubscriptionTab'));
const TeamTab = lazy(() => import('../TeamTab'));
const PaymentsTab = lazy(() => import('../PaymentsTab'));
const AutomationTab = lazy(() => import('../AutomationTab'));

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
    'tables': {
        path: 'mesas',
        label: 'Mesas',
        icon: LayoutGrid,
        component: TableManagementTab
    },
    'menu': {
        path: 'menu',
        label: 'Menú Digital',
        icon: UtensilsCrossed,
        component: RestaurantMenuView
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
        component: HotelRoomsTab
    },
    'bookings': {
        path: 'reservas',
        label: 'Reservas',
        icon: Calendar,
        component: HotelReservationsTab
    },
    'reception': {
        path: 'recepcion',
        label: 'Recepción',
        icon: ClipboardCheck,
        component: HotelReceptionTab
    },
    'guests': {
        path: 'huespedes',
        label: 'Huéspedes',
        icon: Users,
        component: HotelGuestsTab
    },
    'automation': {
        path: 'automatizacion',
        label: 'Entrenador Virtual',
        icon: Bot,
        component: AutomationTab
    }
};

/** Secciones que solo ve el dueño del negocio (no el equipo). */
const OWNER_ONLY_TABS = ['pagos', 'suscripcion', 'configuracion'];

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
        path: 'clientes',
        label: 'Clientes',
        icon: Users,
        component: StoreCustomersTab,
    },
    {
        path: 'descuentos',
        label: 'Descuentos',
        icon: Percent,
        component: DiscountsTab,
    },
    {
        path: 'analiticas',
        label: 'Analíticas',
        icon: LineChart,
        component: AnalyticsTab,
    },
    {
        path: 'pagos',
        label: 'Pagos',
        icon: PaymentsIcon,
        component: PaymentsTab,
    },
    {
        path: 'equipo',
        label: 'Equipo',
        icon: Users2,
        component: TeamTab,
    },
    {
        path: 'suscripcion',
        label: 'Mi Plan',
        icon: Gem,
        component: SubscriptionTab,
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

        const { features, terminology, cartStore, productsComponent } = dashboardConfig;
        // Admin-controlled per-store module visibility (see Panel de
        // Administración > Módulos). Overview, Configuración and Soporte
        // are never hideable.
        const disabledModules = store.disabled_modules || [];

        // Map enabled features to Tab definitions
        const featureTabs = features.filter(featureKey => !disabledModules.includes(featureKey)).map(featureKey => {
            const tabDef = FEATURE_TABS[featureKey];
            if (!tabDef) return null;

            // Apply terminology overrides (e.g., "Platos" instead of "Productos")
            let label = tabDef.label;
            if (featureKey === 'products' && terminology?.product) label = `${terminology.product}s`;
            if (featureKey === 'orders' && terminology?.order) label = `${terminology.order}s`;
            if (featureKey === 'inventory' && terminology?.inventory) label = terminology.inventory;

            // Instantiate Component with Props
            // 'products' uses a vertical-specific view (variants, prescriptions-style
            // fields, etc) when the vertical declares one, instead of the plain
            // generic form — both are self-contained via useStoreDashboard(), so no
            // extra props are needed either way.
            const Element = featureKey === 'products' && productsComponent
                ? productsComponent
                : tabDef.component;
            // GenericPOSView needs the vertical's own cart store (useRestaurantStore,
            // useGroceryStore, etc), not storeId/terminology — it reads the store
            // itself via useStoreDashboard() and only needs to know which cart to use.
            const element = featureKey === 'pos'
                ? <Element useStore={cartStore} title="Punto de Venta" />
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
        // Pagos, plan y configuración del negocio son solo del dueño: las políticas de
        // la base de datos no dejan que el equipo los modifique.
        const isOwner = store.viewerRole === undefined || store.viewerRole === 'owner';
        const commonTabs = COMMON_TABS
            .filter(tab => isOwner || !OWNER_ONLY_TABS.includes(tab.path))
            .filter(tab => tab.path === 'configuracion' || !disabledModules.includes(tab.path))
            .map(tab => {
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
