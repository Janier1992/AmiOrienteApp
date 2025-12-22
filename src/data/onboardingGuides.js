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
            content: 'Tu super app para domicilios, compras y turismo en el Oriente Antioqueño.',
            position: 'bottom'
        },
        {
            targetId: 'hero-explore-btn',
            title: 'Empieza a Explorar',
            content: 'Entra aquí para ver todo nuestro catálogo de productos ordenado para ti.',
            position: 'bottom'
        },
        {
            targetId: 'features-section',
            title: 'Nuestros Servicios',
            content: 'Descubre restaurantes, hoteles, mercados campesinos y servicios especiales.',
            position: 'top'
        },
        {
            targetId: 'cart-button',
            title: 'Tu Carrito de Compras',
            content: 'Aquí verás los productos que agregues. ¡Puedes pedir de múltiples tiendas a la vez!',
            position: 'left'
        }
    ],

    // ===========================================================================
    // PERFIL NEGOCIO (Dashboard)
    // ===========================================================================
    store_dashboard: [
        {
            targetId: 'dashboard-sidebar-menu',
            title: 'Panel de Control',
            content: 'Tu centro de mando. Desde aquí gestionas cada aspecto de tu negocio.',
            position: 'right'
        },
        {
            targetId: 'nav-home',
            title: 'Resumen Diario',
            content: 'Visualiza tus ventas del día, pedidos pendientes y métricas clave de un vistazo.',
            position: 'right'
        },
        {
            targetId: 'dashboard-stats-cards',
            title: 'Tus Métricas',
            content: 'Analiza el rendimiento de tu tienda en tiempo real: ventas, pedidos y productos.',
            position: 'bottom'
        },
        {
            targetId: 'nav-productos',
            title: 'Inventario',
            content: 'Agrega, edita o pausa productos. Sube fotos y ajusta precios en segundos.',
            position: 'right'
        },
        {
            targetId: 'nav-caja',
            title: 'Punto de Venta (POS)',
            content: '¿Tienes tienda física? Usa esta herramienta para registrar ventas presenciales.',
            position: 'right'
        },
        {
            targetId: 'nav-pedidos',
            title: 'Gestión de Pedidos',
            content: 'Recibe, prepara y despacha tus pedidos online desde aquí.',
            position: 'right'
        },
        {
            targetId: 'nav-configuracion',
            title: 'Configuración',
            content: 'Ajusta tus horarios de atención, logo y métodos de pago.',
            position: 'right'
        }
    ],

    // ===========================================================================
    // PERFIL DOMICILIARIO (Dashboard)
    // ===========================================================================
    delivery_dashboard: [
        {
            targetId: 'delivery-status-card',
            title: 'Tu Estado de Conexión',
            content: '¡Recuerda conectarte! Debes estar "En Línea" para recibir notificaciones de pedidos.',
            position: 'bottom'
        },
        {
            targetId: 'tab-trigger-disponibles',
            title: 'Pedidos Disponibles',
            content: 'Revisa esta pestaña frecuentemente para encontrar nuevos pedidos en tu zona.',
            position: 'bottom'
        },
        {
            targetId: 'delivery-available-list',
            title: 'Acepta tu Misión',
            content: 'Toca un pedido para ver detalles y aceptarlo. ¡El más rápido se lo lleva!',
            position: 'top'
        },
        {
            targetId: 'tab-trigger-curso',
            title: 'En Curso',
            content: 'Aquí gestionas tu pedido actual: ver mapa, contactar al cliente y marcar como entregado.',
            position: 'bottom'
        },
        {
            targetId: 'tab-trigger-historial',
            title: 'Tus Ganancias',
            content: 'Consulta tu historial de entregas realizadas y ganancias acumuladas.',
            position: 'bottom'
        }
    ]
};

export const ROLE_WELCOME_MESSAGES = {
    cliente: {
        title: '¡Descubre el Oriente!',
        message: 'Te guiamos para que encuentres los mejores productos y servicios de la región.',
        action: 'Iniciar Tour'
    },
    tienda: {
        title: 'Potencia tu Negocio',
        message: 'Explora tu nuevo panel de administración. Todo lo que necesitas para vender más.',
        action: 'Ver Tutorial'
    },
    domiciliario: {
        title: '¡Vamos a Rodar!',
        message: 'Aprende a usar tu app de repartidor para maximizar tus entregas y ganancias.',
        action: 'Empezar'
    },
    invitado: {
        title: '¡Bienvenido a AmiOriente!',
        message: 'Explora nuestra plataforma y descubre todo lo que el Oriente Antioqueño tiene para ti.',
        action: 'Dar un vistazo'
    }
};
