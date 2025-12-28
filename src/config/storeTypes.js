
import {
    Utensils,
    ShoppingBag,
    Pill,
    Shirt,
    Wheat,
    Hotel,
    Package,
    Scissors,
    Store,
    BookOpen,
    Truck,
    Palette
} from 'lucide-react';

/**
 * Configuration for Store Types (Verticals)
 * Defines the features, labels, and icons for each business type.
 */
export const STORE_TYPES = {
    'restaurante': {
        label: 'Restaurante',
        icon: Utensils,
        color: 'orange',
        features: ['products', 'orders', 'pos', 'tables', 'kitchen', 'maintenance', 'menu'], // 'tables', 'kitchen' specific to restaurant
        terminology: {
            product: 'Plato',
            inventory: 'Ingredientes',
            order: 'Comanda'
        }
    },
    'farmacia': {
        label: 'Farmacia',
        icon: Pill,
        color: 'blue',
        features: ['products', 'orders', 'pos', 'inventory', 'prescriptions'],
        terminology: {
            product: 'Medicamento',
            inventory: 'Stock'
        }
    },
    'mercado': {
        label: 'Mercado',
        icon: ShoppingBag,
        color: 'green',
        features: ['products', 'orders', 'pos', 'inventory'],
        terminology: {
            product: 'Producto',
            inventory: 'Stock'
        }
    },
    'ropa': {
        label: 'Tienda de Ropa',
        icon: Shirt,
        color: 'purple',
        features: ['products', 'orders', 'pos', 'inventory', 'collections'],
        terminology: {
            product: 'Prenda',
            inventory: 'Existencias'
        }
    },
    'cultivos': {
        label: 'Agro / Cultivos',
        icon: Wheat,
        color: 'emerald',
        features: ['products', 'orders', 'harvests', 'inventory', 'volume_orders'],
        terminology: {
            product: 'Cosecha/Producto',
            inventory: 'Insumos/Semillas',
            order: 'Pedido Mayorista'
        }
    },
    hotel: {
        label: 'Hotel / Turismo',
        icon: Hotel,
        color: 'indigo',
        features: ['rooms', 'bookings', 'services', 'calendar'],
        terminology: {
            product: 'Habitación',
            inventory: 'Disponibilidad',
            order: 'Reserva'
        }
    },
    'papeleria': {
        label: 'Papelería',
        icon: BookOpen,
        color: 'yellow',
        features: ['products', 'orders', 'pos', 'inventory', 'printing'],
        terminology: {
            product: 'Artículo'
        }
    },
    'variedades': {
        label: 'Variedades',
        icon: Store,
        color: 'pink',
        features: ['products', 'orders', 'pos', 'inventory'],
        terminology: {
            product: 'Artículo'
        }
    },
    'veterinaria': {
        label: 'Veterinaria',
        icon: Scissors, // Or Paw if available
        color: 'cyan',
        features: ['products', 'services', 'appointments', 'pos'],
        terminology: {
            product: 'Producto/Servicio',
            order: 'Cita/Venta'
        }
    },
    // Fallback
    'general': {
        label: 'Comercio General',
        icon: Store,
        color: 'slate',
        features: ['products', 'orders', 'pos', 'inventory'],
        terminology: {
            product: 'Producto'
        }
    }
};

/**
 * Returns configuration for a specific store type normalized.
 */
export const getStoreTypeConfig = (type) => {
    const normalizedType = type?.toLowerCase()?.trim();
    // Simple mapping for likely variations
    if (normalizedType === 'restaurantes') return STORE_TYPES['restaurante'];
    if (normalizedType === 'farmacias') return STORE_TYPES['farmacia'];

    return STORE_TYPES[normalizedType] || STORE_TYPES['general'];
};
