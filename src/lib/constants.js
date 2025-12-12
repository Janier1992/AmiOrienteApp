/**
 * =============================================================================
 * CONSTANTES DE LA APLICACIÓN (constants.js)
 * =============================================================================
 * 
 * Descripción:
 *   Este módulo centraliza todas las constantes y configuraciones estáticas
 *   de la aplicación MiOriente. Definir valores aquí evita "magic numbers"
 *   y strings dispersos en el código.
 * 
 * Categorías:
 *   - Información de la aplicación
 *   - Configuración de moneda y localización
 *   - Estados de pedidos y entregas
 *   - Categorías de negocios
 *   - Tarifas y comisiones
 * 
 * Uso:
 *   import { ORDER_STATUS, CURRENCY_LOCALE, SERVICE_FEE } from '@/lib/constants';
 * 
 * Autor: Equipo MiOriente
 * Última actualización: 2025-12-11
 * =============================================================================
 */

// =============================================================================
// INFORMACIÓN DE LA APLICACIÓN
// =============================================================================

/** Nombre de la aplicación */
export const APP_NAME = "MiOriente";

/** Descripción corta para SEO y metadatos */
export const APP_DESCRIPTION = "Servicios y Domicilios en el Oriente Antioqueño";

/** Versión actual de la aplicación */
export const APP_VERSION = "1.0.0";

// =============================================================================
// CONFIGURACIÓN DE MONEDA Y LOCALIZACIÓN
// =============================================================================

/** Código de moneda ISO 4217 */
export const CURRENCY = "COP";

/** Locale para formateo de números y fechas */
export const CURRENCY_LOCALE = "es-CO";

/** Símbolo de moneda */
export const CURRENCY_SYMBOL = "$";

// =============================================================================
// ESTADOS DE PEDIDOS
// =============================================================================

/**
 * Estados posibles de un pedido.
 * El flujo normal es: PENDING → CONFIRMED → PREPARING → READY → IN_TRANSIT → DELIVERED
 */
export const ORDER_STATUS = {
    /** Pedido creado, esperando confirmación de la tienda */
    PENDING: 'Pendiente',

    /** Pedido con pago en efectivo al recibir */
    PENDING_CASH: 'Pendiente de pago en efectivo',

    /** Tienda confirmó el pedido */
    CONFIRMED: 'Confirmado',

    /** Tienda está preparando el pedido */
    PREPARING: 'En preparación',

    /** Pedido listo, esperando domiciliario */
    READY: 'Listo para recogida',

    /** Domiciliario está en camino al cliente */
    IN_TRANSIT: 'En curso',

    /** Pedido entregado exitosamente */
    DELIVERED: 'Entregado',

    /** Pedido cancelado */
    CANCELLED: 'Cancelado'
};

/**
 * Lista ordenada de estados para progreso visual.
 * Útil para mostrar pasos en la UI.
 */
export const ORDER_STATUS_FLOW = [
    ORDER_STATUS.PENDING,
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.PREPARING,
    ORDER_STATUS.READY,
    ORDER_STATUS.IN_TRANSIT,
    ORDER_STATUS.DELIVERED
];

// =============================================================================
// ESTADOS DE ENTREGAS
// =============================================================================

/**
 * Estados posibles de una entrega (desde la perspectiva del domiciliario).
 */
export const DELIVERY_STATUS = {
    /** Buscando domiciliario disponible */
    SEARCHING: 'Buscando',

    /** Domiciliario asignado, en camino a la tienda */
    ASSIGNED: 'Asignado',

    /** Domiciliario recogió el pedido */
    PICKED_UP: 'Recogido',

    /** En camino al cliente */
    IN_TRANSIT: 'En camino',

    /** Entrega completada */
    DELIVERED: 'Entregado'
};

// =============================================================================
// CATEGORÍAS DE NEGOCIOS
// =============================================================================

/**
 * Categorías disponibles para tiendas/negocios.
 * Estas deben coincidir con los valores en la tabla service_categories.
 */
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

/**
 * Iconos asociados a cada categoría (para usar con Lucide React).
 */
export const CATEGORY_ICONS = {
    'Restaurante': 'UtensilsCrossed',
    'Mercado': 'ShoppingBasket',
    'Farmacia': 'Pill',
    'Licores': 'Wine',
    'Mascotas': 'PawPrint',
    'Tecnología': 'Smartphone',
    'Moda': 'Shirt',
    'Servicios': 'Wrench',
    'Turismo': 'MapPin',
    'Cultivador': 'Leaf'
};

// =============================================================================
// ROLES DE USUARIO
// =============================================================================

/**
 * Roles de usuario en la plataforma.
 */
export const USER_ROLES = {
    /** Usuario que realiza pedidos */
    CUSTOMER: 'cliente',

    /** Propietario de tienda/negocio */
    STORE: 'tienda',

    /** Repartidor/domiciliario */
    DELIVERY: 'domiciliario',

    /** Administrador del sistema */
    ADMIN: 'admin'
};

// =============================================================================
// TARIFAS Y COMISIONES
// =============================================================================

/**
 * Tarifa base del servicio de la plataforma (en COP).
 * Se cobra en cada pedido.
 */
export const SERVICE_FEE = 2000;

/**
 * Tarifa base de envío/domicilio (en COP).
 * Puede variar según distancia en implementaciones futuras.
 */
export const DELIVERY_BASE_FEE = 4000;

/**
 * Porcentaje de comisión para el domiciliario (del total del pedido).
 */
export const DELIVERY_COMMISSION_PERCENT = 0.10; // 10%

/**
 * Porcentaje de comisión de la plataforma (del subtotal).
 */
export const PLATFORM_COMMISSION_PERCENT = 0.05; // 5%

// =============================================================================
// CONFIGURACIÓN DE TIEMPOS
// =============================================================================

/**
 * Tiempo de caché por defecto en milisegundos (2 minutos).
 */
export const DEFAULT_CACHE_DURATION = 120000;

/**
 * Tiempo de timeout para operaciones de red (15 segundos).
 */
export const NETWORK_TIMEOUT = 15000;

/**
 * Intervalo de actualización de ubicación del domiciliario (30 segundos).
 */
export const LOCATION_UPDATE_INTERVAL = 30000;

// =============================================================================
// CONFIGURACIÓN DE UI
// =============================================================================

/**
 * Tamaño de página por defecto para paginación.
 */
export const DEFAULT_PAGE_SIZE = 20;

/**
 * Número máximo de items en el carrito.
 */
export const MAX_CART_ITEMS = 50;

/**
 * Longitud mínima de contraseña.
 */
export const MIN_PASSWORD_LENGTH = 6;
