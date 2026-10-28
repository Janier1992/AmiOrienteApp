/**
 * Manejo de errores común de los servicios de datos.
 *
 * Cada servicio crea su propio manejador con su nombre (para que el registro diga de
 * dónde viene el error) y todos se comportan igual: registran el error original y lanzan
 * un `Error` cuyo mensaje es el del servidor o, si no lo hay, el contexto dado. Las
 * pantallas muestran ese mensaje y no necesitan conocer a Supabase.
 */

/**
 * @param {string} nombreServicio Prefijo para el registro, p. ej. `orderService`.
 * @param {object} [opciones]
 * @param {(error: object) => (string|undefined)} [opciones.traducirCodigo]
 *   Convierte un error conocido (por ejemplo, un código de PostgreSQL) en un mensaje
 *   amigable. Si devuelve `undefined` se usa el mensaje original.
 * @returns {(error: object, contexto: string) => never}
 */
export const crearManejadorDeErrores = (nombreServicio, { traducirCodigo } = {}) =>
  (error, contexto) => {
    console.error(`[${nombreServicio}] ${contexto}:`, error);
    throw new Error(traducirCodigo?.(error) || error?.message || contexto);
  };
