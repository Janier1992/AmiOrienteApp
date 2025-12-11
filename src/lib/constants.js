
export const APP_NAME = "MiOriente";
export const APP_DESCRIPTION = "Servicios y Domicilios en el Oriente Antioqueño";

export const CURRENCY = "COP";
export const CURRENCY_LOCALE = "es-CO";

export const ORDER_STATUS = {
    PENDING: 'Pendiente',
    CONFIRMED: 'Confirmado',
    PREPARING: 'En preparación',
    READY: 'Listo para recogida',
    IN_TRANSIT: 'En curso',
    DELIVERED: 'Entregado',
    CANCELLED: 'Cancelado'
};

export const DELIVERY_STATUS = {
    SEARCHING: 'Buscando',
    ASSIGNED: 'Asignado',
    PICKED_UP: 'Recogido',
    DELIVERED: 'Entregado'
};

export const STORE_CATEGORIES = [
    'Restaurante',
    'Mercado',
    'Farmacia',
    'Licores',
    'Mascotas',
    'Tecnología',
    'Moda',
    'Servicios',
    'Turismo',
    'Cultivador'
];

export const SERVICE_FEE = 2000; // Base service fee in COP
export const DELIVERY_BASE_FEE = 4000; // Base delivery fee in COP
