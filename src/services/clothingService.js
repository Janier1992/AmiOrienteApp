import { storeService } from './storeService';

/**
 * Productos de la tienda de ropa. Las variantes (talla/color) las codifica y
 * decodifica `storeService`, por lo que aquí solo se delega.
 */
export const clothingService = {
  getClothingProducts: (storeId) => storeService.obtenerProductos(storeId),

  /** Crea el producto, o lo actualiza si trae `id`. */
  saveClothingProduct: ({ id, ...producto }) =>
    id ? storeService.actualizarProducto(id, producto) : storeService.crearProducto(producto),

  deleteClothingProduct: (id) => storeService.eliminarProducto(id),
};
