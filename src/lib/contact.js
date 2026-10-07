/**
 * Utilidades de contacto con negocios (teléfono / WhatsApp).
 */

/**
 * Normaliza un teléfono colombiano a formato internacional sin símbolos
 * (p. ej. "315 816 99 48" -> "573158169948"). Devuelve null si no es válido.
 * @param {string|null|undefined} phone
 * @returns {string|null}
 */
export const normalizeColombianPhone = (phone) => {
  if (!phone) return null;
  let digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 10) digits = `57${digits}`; // número local sin indicativo
  if (digits.length < 11 || digits.length > 15) return null;
  return digits;
};

/**
 * URL de WhatsApp con mensaje prellenado, o null si el teléfono no es válido.
 * @param {string} phone
 * @param {string} message
 */
export const buildWhatsAppUrl = (phone, message = '') => {
  const normalized = normalizeColombianPhone(phone);
  if (!normalized) return null;
  return `https://wa.me/${normalized}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
};
