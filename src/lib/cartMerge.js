/**
 * Fusiona el carrito de invitado con el carrito guardado de un usuario.
 *
 * Cuando alguien arma su carrito sin sesión y luego inicia sesión para pagar,
 * no debe perder lo que había elegido. Los productos repetidos suman cantidades.
 *
 * @param {Array<{id: string, quantity: number}>} savedItems - Carrito guardado del usuario
 * @param {Array<{id: string, quantity: number}>} guestItems - Carrito de invitado
 * @returns {Array} Carrito fusionado (el orden del usuario primero)
 */
export const mergeCartItems = (savedItems = [], guestItems = []) => {
  const merged = new Map();
  for (const item of [...savedItems, ...guestItems]) {
    if (!item || item.id === undefined || item.id === null) continue;
    const quantity = Math.max(1, Number(item.quantity) || 1);
    const existing = merged.get(item.id);
    merged.set(item.id, existing ? { ...existing, quantity: existing.quantity + quantity } : { ...item, quantity });
  }
  return [...merged.values()];
};

/** Lee de forma segura los items de un carrito guardado en localStorage. */
export const readStoredCartItems = (storage, key) => {
  try {
    const parsed = JSON.parse(storage.getItem(key) || 'null');
    return Array.isArray(parsed?.items) ? parsed.items : [];
  } catch {
    return [];
  }
};
