/**
 * Definición de los pasos para las guías de Onboarding.
 * targetId: ID del elemento HTML a resaltar (sin el #).
 * position: Preferencia de posición del tooltip ('top', 'bottom', 'left', 'right').
 */

export const ONBOARDING_GUIDES = {
    // ===========================================================================
    // PERFIL CLIENTE (Home)
    // ===========================================================================
    client_home: [
        {
            targetId: 'site-header-logo',
            title: '¡Bienvenido a AmiOriente!',
            content: 'Esta es tu nueva plataforma para pedir lo que quieras, cuando quieras. Desde comida hasta reservas de hotel.',
            position: 'bottom'
        },
        {
            targetId: 'hero-explore-btn',
            title: 'Empieza aquí',
            content: 'Explora todos los productos disponibles en el Oriente Antioqueño con un solo clic.',
            position: 'bottom'
        },
        {
            targetId: 'features-section',
            title: 'Todo lo que necesitas',
            content: 'Descubre restaurantes, hoteles, mercados campesinos y más servicios en nuestra sección destacada.',
            position: 'top'
        }
    ],

    // ===========================================================================
    // PERFIL NEGOCIO (Dashboard)
    // ===========================================================================
    store_dashboard: [
        {
            targetId: 'dashboard-sidebar-menu',
            title: 'Tu Centro de Control',
            content: 'Desde este menú lateral tienes acceso a todas las herramientas: Productos, Pedidos y Configuración.',
            position: 'right'
        },
        {
            targetId: 'nav-productos',
            title: 'Gestiona tus Productos',
            content: 'Entra aquí para crear, editar o pausar tus productos. ¡Mantén tu catálogo actualizado!',
            position: 'right'
        },
        {
            targetId: 'nav-pedidos',
            title: 'Tus Pedidos',
            content: 'Aquí llegarán las notificaciones de nuevos pedidos. ¡Debes estar atento!',
            position: 'right'
        },
        {
            targetId: 'nav-ajustes',
            title: 'Configuración',
            content: 'Horarios, métodos de pago y estado de tu tienda.',
            position: 'right'
        }
    ],

    // ===========================================================================
    // PERFIL DOMICILIARIO (Dashboard)
    // ===========================================================================
    delivery_dashboard: [
        {
            targetId: 'delivery-status-card',
            title: 'Tu Estado',
            content: 'Mantente activo para recibir notificaciones de nuevas entregas.',
            position: 'bottom'
        },
        {
            targetId: 'delivery-available-list',
            title: 'Zona de Pedidos',
            content: 'Aquí verás la lista de pedidos listos para recoger cercanos a tu ubicación.',
            position: 'top'
        },
        {
            targetId: 'delivery-active-map',
            title: 'Ruta Activa',
            content: 'El mapa te mostrará la ruta óptima para recoger y entregar.',
            position: 'top'
        }
    ]
};

export const ROLE_WELCOME_MESSAGES = {
    cliente: {
        title: '¡Te damos la bienvenida a AmiOriente!',
        message: 'Descubre los mejores comercios del Oriente Antioqueño en un solo lugar. Pide comida, mercado, farmacia y más.',
        action: 'Explorar la App'
    },
    tienda: {
        title: '¡Bienvenido, Aliado!',
        message: 'Tu negocio ahora tiene un alcance digital completo. Vamos a mostrarte cómo gestionar tus pedidos y productos fácilmente.',
        action: 'Ver Tour del Negocio'
    },
    domiciliario: {
        title: '¡Bienvenido al Equipo!',
        message: 'Empieza a generar ingresos entregando pedidos. Te explicaremos cómo aceptar y completar entregas.',
        action: 'Iniciar Tutorial'
    }
};
