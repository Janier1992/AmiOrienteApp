
import { lazy } from 'react';
import { Utensils, ShoppingBag, Pill, Shirt, Wheat, Hotel, Scissors, Store, BookOpen, Croissant } from 'lucide-react';
import { useRestaurantStore } from '@/stores/useRestaurantStore';
import { usePharmacyStore } from '@/stores/usePharmacyStore';
import { useGroceryStore } from '@/stores/useGroceryStore';
import { useClothingStore } from '@/stores/useClothingStore';
import { useStationeryStore } from '@/stores/useStationeryStore';
import { useGeneralStore } from '@/stores/useGeneralStore';

// Specialized product-management views that replace the generic ProductsTab
// for verticals that need more than a plain name/price/stock/description
// form (clothing variants, pharmacy, etc). Lazy-loaded like every other
// dashboard view.
const ClothingProductsView = lazy(() => import('@/pages/StoreDashboard/views/ClothingProductsView'));
const PharmacyProductsView = lazy(() => import('@/pages/StoreDashboard/views/PharmacyProductsView'));
const StationeryProductsView = lazy(() => import('@/pages/StoreDashboard/views/StationeryProductsView'));
const SupermarketProductsView = lazy(() => import('@/pages/StoreDashboard/views/SupermarketProductsView'));

/**
 * Configuration for Store Types (Verticals)
 * Defines the features, labels, and icons for each business type.
 */
export const STORE_TYPES = {
    'restaurante': {
        label: 'Restaurante',
        icon: Utensils,
        color: 'orange',
        features: ['products', 'orders', 'pos', 'tables', 'maintenance', 'menu'],
        cartStore: useRestaurantStore,
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
        features: ['products', 'orders', 'pos', 'inventory'],
        cartStore: usePharmacyStore,
        productsComponent: PharmacyProductsView,
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
        cartStore: useGroceryStore,
        productsComponent: SupermarketProductsView,
        terminology: {
            product: 'Producto',
            inventory: 'Stock'
        }
    },
    'ropa': {
        label: 'Tienda de Ropa',
        icon: Shirt,
        color: 'purple',
        features: ['products', 'orders', 'pos', 'inventory'],
        cartStore: useClothingStore,
        productsComponent: ClothingProductsView,
        terminology: {
            product: 'Prenda',
            inventory: 'Existencias'
        }
    },
    'cultivos': {
        label: 'Agro / Cultivos',
        icon: Wheat,
        color: 'emerald',
        features: ['products', 'orders', 'harvests', 'inventory', 'volume_orders', 'automation'],
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
        features: ['rooms', 'bookings', 'reception', 'guests'],
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
        features: ['products', 'orders', 'pos', 'inventory'],
        cartStore: useStationeryStore,
        productsComponent: StationeryProductsView,
        terminology: {
            product: 'Artículo'
        }
    },
    'panaderia': {
        label: 'Panadería',
        icon: Croissant,
        color: 'amber',
        features: ['products', 'orders', 'pos', 'inventory'],
        cartStore: useGeneralStore,
        terminology: {
            product: 'Producto',
            inventory: 'Stock'
        }
    },
    'variedades': {
        label: 'Variedades',
        icon: Store,
        color: 'pink',
        features: ['products', 'orders', 'pos', 'inventory'],
        cartStore: useGeneralStore,
        terminology: {
            product: 'Artículo'
        }
    },
    'veterinaria': {
        label: 'Veterinaria',
        icon: Scissors, // Or Paw if available
        color: 'cyan',
        features: ['products', 'orders', 'pos'],
        cartStore: useGeneralStore,
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
        cartStore: useGeneralStore,
        terminology: {
            product: 'Producto'
        }
    }
};

/**
 * service_categories.name (the real, verbose rows in the DB — see
 * handle_new_user trigger, which resolves StoreRegister's CATEGORY_DB_MAP
 * values against this table) never matched STORE_TYPES' short keys, so
 * getStoreTypeConfig() silently fell back to 'general' for every vertical
 * except Restaurante/Hotel (whose names happen to be short already).
 * Mapping confirmed directly against the live `service_categories` table.
 */
const SERVICE_CATEGORY_NAME_TO_TYPE = {
    'Restaurante': 'restaurante',
    'Restaurante / Gastronomía': 'restaurante',
    'Farmacia / Droguería': 'farmacia',
    'Supermercado / Abarrotes': 'mercado',
    'Tienda de Ropa / Moda': 'ropa',
    'Cultivadores': 'cultivos',
    'Hotel': 'hotel',
    'Hotel / Hospedaje': 'hotel',
    'Papelería / Miscelánea': 'papeleria',
    'Panadería / Repostería': 'panaderia',
    'Veterinaria / Mascotas': 'veterinaria',
    'Ferretería / Construcción': 'variedades',
    'Tecnología / Electrodomésticos': 'variedades',
    'Tienda': 'variedades',
    'Otro Comercio': 'general',
    'Domicilios': 'general',
};

/**
 * Returns configuration for a specific store type normalized.
 */
export const getStoreTypeConfig = (type) => {
    if (!type) return STORE_TYPES['general'];
    const trimmed = type.trim();

    if (SERVICE_CATEGORY_NAME_TO_TYPE[trimmed]) {
        return STORE_TYPES[SERVICE_CATEGORY_NAME_TO_TYPE[trimmed]];
    }

    // Fallback for short keys passed directly (tests, manual data, etc).
    const normalizedType = trimmed.toLowerCase();
    if (normalizedType === 'restaurantes') return STORE_TYPES['restaurante'];
    if (normalizedType === 'farmacias') return STORE_TYPES['farmacia'];
    if (['finca', 'agro', 'cultivador', 'agricultura'].includes(normalizedType)) return STORE_TYPES['cultivos'];

    return STORE_TYPES[normalizedType] || STORE_TYPES['general'];
};
