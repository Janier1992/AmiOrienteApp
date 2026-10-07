/**
 * Política de contraseñas única para toda la plataforma (clientes, negocios,
 * domiciliarios y recuperación de contraseña).
 *
 * Antes cada pantalla tenía su propia regla: el negocio aceptaba 6 caracteres
 * y las demás rechazaban símbolos comunes como . _ - # (solo admitían @$!%*?&).
 */

export const PASSWORD_MIN_LENGTH = 8;

/** Texto de ayuda para mostrar bajo el campo de contraseña. */
export const PASSWORD_HINT =
  'Mínimo 8 caracteres, con mayúscula, minúscula, número y un símbolo (por ejemplo . _ - ! @ #).';

/**
 * Evalúa una contraseña contra la política.
 * @param {string} password
 * @returns {{ valid: boolean, missing: string[] }} `missing` lista lo que falta, en español
 */
export const validatePassword = (password) => {
  const value = typeof password === 'string' ? password : '';
  const missing = [];
  if (value.length < PASSWORD_MIN_LENGTH) missing.push(`al menos ${PASSWORD_MIN_LENGTH} caracteres`);
  if (!/[a-z]/.test(value)) missing.push('una minúscula');
  if (!/[A-Z]/.test(value)) missing.push('una mayúscula');
  if (!/\d/.test(value)) missing.push('un número');
  if (!/[^A-Za-z0-9\s]/.test(value)) missing.push('un símbolo');
  return { valid: missing.length === 0, missing };
};

/** Mensaje de error listo para un toast, o null si la contraseña es válida. */
export const getPasswordError = (password) => {
  const { valid, missing } = validatePassword(password);
  return valid ? null : `Tu contraseña necesita ${missing.join(', ')}.`;
};
