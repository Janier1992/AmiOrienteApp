/**
 * Catálogo de todos los módulos (tabs) que puede tener un dashboard de
 * tienda, con su etiqueta legible. Usado por:
 *  - UniversalStoreDashboard: para filtrar qué tabs renderizar según
 *    store.disabled_modules.
 *  - AdminDashboard: para mostrar los checkboxes de "mostrar/ocultar"
 *    por negocio.
 *
 * Las claves deben coincidir exactamente con las de FEATURE_TABS (en
 * UniversalStoreDashboard.jsx) y con el `path` de cada entrada en
 * COMMON_TABS.
 */

// Específicos por vertical (solo aplican si esa tienda los tiene habilitados
// en su configuración de storeTypes.js).
export const FEATURE_MODULE_LABELS = {
    products: 'Productos',
    orders: 'Pedidos',
    pos: 'Punto de Venta',
    tables: 'Mesas',
    menu: 'Menú Digital',
    maintenance: 'Mantenimiento',
    inventory: 'Inventario Rápido',
    harvests: 'Cosechas',
    volume_orders: 'Pedidos Mayoristas',
    rooms: 'Habitaciones',
    bookings: 'Reservas',
    reception: 'Recepción',
    guests: 'Huéspedes',
    automation: 'Entrenador Virtual',
};

// Comunes a toda tienda (COMMON_TABS), excepto Configuración y Soporte que
// siempre permanecen visibles.
export const COMMON_MODULE_LABELS = {
    finanzas: 'Finanzas',
    clientes: 'Clientes',
    descuentos: 'Descuentos',
    analiticas: 'Analíticas',
    pagos: 'Pagos',
    equipo: 'Equipo',
    suscripcion: 'Mi Plan',
};

export const MODULE_CATALOG = {
    ...FEATURE_MODULE_LABELS,
    ...COMMON_MODULE_LABELS,
};
