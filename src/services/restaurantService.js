
/**
 * @deprecated
 * This service is deprecated. Its functionality has been moved to 'storeService.js'.
 * Please use 'storeService' instead.
 * 
 * Logic moved:
 * - getTables -> storeService.getTables
 * - createPOSTransaction -> storeService.createPOSTransaction
 */
export const restaurantService = {
    getTables: () => { throw new Error("Deprecated. Use storeService.getTables"); },
    createTable: () => { throw new Error("Deprecated. Use storeService.createTable"); },
    createPOSTransaction: () => { throw new Error("Deprecated. Use storeService.createPOSTransaction"); }
};
