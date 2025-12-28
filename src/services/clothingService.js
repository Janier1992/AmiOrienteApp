
/**
 * @deprecated
 * This service is deprecated. Its functionality has been moved to 'storeService.js'.
 * Please use 'storeService' instead.
 * 
 * Logic moved:
 * - Variant Parsing -> Automatically handled in storeService.obtenerProductos / crearProducto
 */
export const clothingService = {
    getClothingProducts: () => { throw new Error("Deprecated. Use storeService.obtenerProductos"); },
    saveClothingProduct: () => { throw new Error("Deprecated. Use storeService.crearProducto (supports variants internally)"); },
};
