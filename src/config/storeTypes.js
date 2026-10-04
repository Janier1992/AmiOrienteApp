
import { lazy } from 'react';
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
 * Returns configuration for a specific store type normalized.
 */
export const getStoreTypeConfig = (type) => {
    const normalizedType = type?.toLowerCase()?.trim();
    // Simple mapping for likely variations
    if (normalizedType === 'restaurantes') return STORE_TYPES['restaurante'];
    if (normalizedType === 'farmacias') return STORE_TYPES['farmacia'];
    if (['finca', 'agro', 'cultivador', 'agricultura'].includes(normalizedType)) return STORE_TYPES['cultivos'];

    return STORE_TYPES[normalizedType] || STORE_TYPES['general'];
};
