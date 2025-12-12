/**
 * =============================================================================
 * MANEJADOR DE ERRORES (errorHandler.js)
 * =============================================================================
 * 
 * Descripción:
 *   Este módulo centraliza el manejo de errores en toda la aplicación.
 *   Proporciona funciones para traducir errores técnicos a mensajes
 *   amigables en español y para reportar errores de forma consistente.
 * 
 * Responsabilidades:
 *   - Traducir errores de Supabase a español
 *   - Proporcionar mensajes de error amigables para el usuario
 *   - Logging consistente de errores
 *   - Clasificación de errores por severidad
 * 
 * Uso:
 *   import { manejarError, traducirError, ErrorApp } from '@/lib/errorHandler';
 *   
 *   try {
 *     await algunaOperacion();
 *   } catch (error) {
 *     manejarError(error, 'Contexto de la operación');
 *   }
 * 
 * Autor: Equipo MiOriente
 * Última actualización: 2025-12-11
 * =============================================================================
 */

// =============================================================================
// CONSTANTES DE ERRORES
// =============================================================================

/**
 * Códigos de error comunes de Supabase/PostgreSQL
 */
export const CODIGOS_ERROR = {
    // Errores de PostgreSQL
    UNIQUE_VIOLATION: '23505',      // Violación de unicidad
    FOREIGN_KEY_VIOLATION: '23503', // Violación de llave foránea
    NOT_NULL_VIOLATION: '23502',    // Violación de NOT NULL
    CHECK_VIOLATION: '23514',       // Violación de restricción CHECK

    // Errores de PostgREST
    NO_ROWS: 'PGRST116',            // No se encontraron filas

    // Errores de red
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT: 'TIMEOUT'
};

/**
 * Mensajes de error amigables en español
 */
export const MENSAJES_ERROR = {
    // Errores de autenticación
    CREDENCIALES_INVALIDAS: 'Correo electrónico o contraseña incorrectos',
    SESION_EXPIRADA: 'Tu sesión ha expirado, por favor inicia sesión nuevamente',
    USUARIO_NO_ENCONTRADO: 'No se encontró el usuario',
    EMAIL_YA_REGISTRADO: 'Este correo electrónico ya está registrado',
    PASSWORD_DEBIL: 'La contraseña debe tener al menos 6 caracteres',
    EMAIL_NO_CONFIRMADO: 'Por favor confirma tu correo electrónico',

    // Errores de datos
    NO_ENCONTRADO: 'No se encontró la información solicitada',
    YA_EXISTE: 'Ya existe un registro con esos datos',
    REFERENCIA_INVALIDA: 'Referencia a un registro que no existe',
    DATOS_INVALIDOS: 'Los datos proporcionados no son válidos',

    // Errores de red
    ERROR_CONEXION: 'Error de conexión. Por favor verifica tu internet',
    TIEMPO_AGOTADO: 'La operación tardó demasiado. Por favor intenta de nuevo',

    // Errores genéricos
    ERROR_SERVIDOR: 'Error en el servidor. Por favor intenta más tarde',
    ERROR_DESCONOCIDO: 'Ocurrió un error inesperado'
};

/**
 * Niveles de severidad de errores
 */
export const SEVERIDAD = {
    INFO: 'info',           // Información, no es un error real
    WARNING: 'warning',     // Advertencia, puede continuar
    ERROR: 'error',         // Error, operación falló
    CRITICAL: 'critical'    // Error crítico, requiere atención inmediata
};

// =============================================================================
// CLASE DE ERROR PERSONALIZADA
// =============================================================================

/**
 * Clase de error personalizada para la aplicación.
 * Extiende Error nativo con propiedades adicionales.
 * 
 * @example
 * throw new ErrorApp('Pedido no encontrado', {
 *   codigo: 'PEDIDO_NO_ENCONTRADO',
 *   severidad: 'error',
 *   contexto: { pedidoId: '123' }
 * });
 */
export class ErrorApp extends Error {
    /**
     * @param {string} mensaje - Mensaje de error amigable
     * @param {Object} opciones - Opciones adicionales
     * @param {string} [opciones.codigo] - Código de error interno
     * @param {string} [opciones.severidad] - Nivel de severidad
     * @param {Object} [opciones.contexto] - Datos adicionales para debugging
     * @param {Error} [opciones.errorOriginal] - Error original capturado
     */
    constructor(mensaje, opciones = {}) {
        super(mensaje);
        this.name = 'ErrorApp';
        this.codigo = opciones.codigo || 'ERROR_DESCONOCIDO';
        this.severidad = opciones.severidad || SEVERIDAD.ERROR;
        this.contexto = opciones.contexto || {};
        this.errorOriginal = opciones.errorOriginal || null;
        this.timestamp = new Date().toISOString();
    }
}

// =============================================================================
// FUNCIONES DE TRADUCCIÓN
// =============================================================================

/**
 * Traduce un error de Supabase Auth a un mensaje amigable en español.
 * 
 * @param {Error} error - Error de Supabase Auth
 * @returns {string} Mensaje en español
 * 
 * @example
 * traducirErrorAuth({ message: 'Invalid login credentials' })
 * // "Correo electrónico o contraseña incorrectos"
 */
export function traducirErrorAuth(error) {
    if (!error) return MENSAJES_ERROR.ERROR_DESCONOCIDO;

    const mensaje = error.message?.toLowerCase() || '';
    const codigo = error.code || '';

    // Mapeo de errores de autenticación
    if (mensaje.includes('invalid login credentials') || mensaje.includes('invalid email or password')) {
        return MENSAJES_ERROR.CREDENCIALES_INVALIDAS;
    }
    if (mensaje.includes('user not found') || codigo === 'user_not_found') {
        return MENSAJES_ERROR.USUARIO_NO_ENCONTRADO;
    }
    if (mensaje.includes('already registered') || mensaje.includes('already exists') || codigo === 'user_already_exists') {
        return MENSAJES_ERROR.EMAIL_YA_REGISTRADO;
    }
    if (mensaje.includes('password should be')) {
        return MENSAJES_ERROR.PASSWORD_DEBIL;
    }
    if (mensaje.includes('email not confirmed')) {
        return MENSAJES_ERROR.EMAIL_NO_CONFIRMADO;
    }
    if (mensaje.includes('refresh token')) {
        return MENSAJES_ERROR.SESION_EXPIRADA;
    }

    return error.message || MENSAJES_ERROR.ERROR_DESCONOCIDO;
}

/**
 * Traduce un error de Supabase Database/PostgREST a un mensaje amigable.
 * 
 * @param {Error} error - Error de Supabase
 * @returns {string} Mensaje en español
 */
export function traducirErrorDatabase(error) {
    if (!error) return MENSAJES_ERROR.ERROR_DESCONOCIDO;

    const codigo = error.code || '';

    // Mapeo por código de error
    switch (codigo) {
        case CODIGOS_ERROR.UNIQUE_VIOLATION:
            return MENSAJES_ERROR.YA_EXISTE;
        case CODIGOS_ERROR.FOREIGN_KEY_VIOLATION:
            return MENSAJES_ERROR.REFERENCIA_INVALIDA;
        case CODIGOS_ERROR.NOT_NULL_VIOLATION:
            return MENSAJES_ERROR.DATOS_INVALIDOS;
        case CODIGOS_ERROR.NO_ROWS:
            return MENSAJES_ERROR.NO_ENCONTRADO;
        default:
            break;
    }

    // Detección por mensaje
    const mensaje = error.message?.toLowerCase() || '';

    if (mensaje.includes('network') || mensaje.includes('fetch')) {
        return MENSAJES_ERROR.ERROR_CONEXION;
    }
    if (mensaje.includes('timeout')) {
        return MENSAJES_ERROR.TIEMPO_AGOTADO;
    }

    return error.message || MENSAJES_ERROR.ERROR_SERVIDOR;
}

/**
 * Traduce cualquier error a un mensaje amigable, detectando automáticamente el tipo.
 * 
 * @param {Error} error - Error a traducir
 * @returns {string} Mensaje en español
 */
export function traducirError(error) {
    if (!error) return MENSAJES_ERROR.ERROR_DESCONOCIDO;

    // Si ya es un ErrorApp, retornar su mensaje
    if (error instanceof ErrorApp) {
        return error.message;
    }

    // Detectar si es error de Auth
    if (error.message?.toLowerCase().includes('login') ||
        error.message?.toLowerCase().includes('password') ||
        error.message?.toLowerCase().includes('email') ||
        error.message?.toLowerCase().includes('user')) {
        return traducirErrorAuth(error);
    }

    // Por defecto, tratar como error de database
    return traducirErrorDatabase(error);
}

// =============================================================================
// FUNCIONES DE MANEJO
// =============================================================================

/**
 * Maneja un error de forma centralizada: lo registra en consola y lanza
 * un error con mensaje amigable.
 * 
 * @param {Error} error - Error capturado
 * @param {string} contexto - Descripción del contexto donde ocurrió
 * @param {boolean} [lanzar=true] - Si debe lanzar el error o solo registrarlo
 * @throws {ErrorApp} Error con mensaje amigable
 * 
 * @example
 * try {
 *   await supabase.from('orders').select();
 * } catch (error) {
 *   manejarError(error, 'Obteniendo lista de pedidos');
 * }
 */
export function manejarError(error, contexto, lanzar = true) {
    const mensajeAmigable = traducirError(error);

    // Logging estructurado
    console.error(`[Error] ${contexto}:`, {
        mensaje: mensajeAmigable,
        errorOriginal: error.message,
        codigo: error.code,
        timestamp: new Date().toISOString()
    });

    if (lanzar) {
        throw new ErrorApp(mensajeAmigable, {
            codigo: error.code,
            contexto: { descripcion: contexto },
            errorOriginal: error
        });
    }
}

/**
 * Registra un error sin lanzarlo (para errores no críticos).
 * 
 * @param {Error} error - Error a registrar
 * @param {string} contexto - Contexto del error
 */
export function registrarError(error, contexto) {
    manejarError(error, contexto, false);
}

/**
 * Verifica si un error es de tipo "no encontrado" (recurso inexistente).
 * 
 * @param {Error} error - Error a verificar
 * @returns {boolean}
 */
export function esErrorNoEncontrado(error) {
    if (!error) return false;
    return error.code === CODIGOS_ERROR.NO_ROWS ||
        error.message?.toLowerCase().includes('not found');
}

/**
 * Verifica si un error es de red/conexión.
 * 
 * @param {Error} error - Error a verificar
 * @returns {boolean}
 */
export function esErrorRed(error) {
    if (!error) return false;
    const mensaje = error.message?.toLowerCase() || '';
    return mensaje.includes('network') ||
        mensaje.includes('fetch') ||
        mensaje.includes('connection') ||
        mensaje.includes('timeout');
}

/**
 * Crea un error de validación con mensaje específico.
 * 
 * @param {string} campo - Nombre del campo inválido
 * @param {string} [mensaje] - Mensaje personalizado
 * @returns {ErrorApp}
 */
export function crearErrorValidacion(campo, mensaje = null) {
    const mensajeFinal = mensaje || `El campo "${campo}" es requerido o inválido`;
    return new ErrorApp(mensajeFinal, {
        codigo: 'VALIDACION_FALLIDA',
        severidad: SEVERIDAD.WARNING,
        contexto: { campo }
    });
}

// =============================================================================
// EXPORTACIÓN POR DEFECTO
// =============================================================================

export default {
    ErrorApp,
    traducirError,
    traducirErrorAuth,
    traducirErrorDatabase,
    manejarError,
    registrarError,
    esErrorNoEncontrado,
    esErrorRed,
    crearErrorValidacion,
    MENSAJES_ERROR,
    CODIGOS_ERROR,
    SEVERIDAD
};
