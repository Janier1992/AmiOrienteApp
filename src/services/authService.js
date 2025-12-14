/**
 * =============================================================================
 * SERVICIO DE AUTENTICACIÓN (authService.js)
 * =============================================================================
 * 
 * Descripción:
 *   Este módulo centraliza todas las operaciones de autenticación de usuarios
 *   en la plataforma MiOriente. Utiliza Supabase Auth como proveedor.
 * 
 * Responsabilidades:
 *   - Iniciar sesión de usuarios
 *   - Registrar nuevos usuarios
 *   - Cerrar sesión
 *   - Obtener información del usuario actual
 *   - Gestionar sesiones
 *   - Actualizar perfiles de usuario
 * 
 * Uso:
 *   import { authService } from '@/services/authService';
 *   const usuario = await authService.iniciarSesion(email, password);
 * 
 * Roles de Usuario:
 *   - 'cliente': Usuarios que realizan pedidos
 *   - 'tienda': Propietarios de negocios/tiendas
 *   - 'domiciliario': Personas que realizan entregas
 * 
 * Dependencias:
 *   - Supabase Client (@/lib/customSupabaseClient)
 * 
 * Autor: Equipo MiOriente
 * Última actualización: 2025-12-11
 * =============================================================================
 */

import { supabase } from '@/lib/customSupabaseClient';

/**
 * @typedef {Object} UserMetadata
 * @property {string} role - Rol del usuario (cliente, tienda, domiciliario)
 * @property {string} [full_name] - Nombre completo
 * @property {string} [phone] - Número de teléfono
 */

/**
 * @typedef {Object} AuthResponse
 * @property {Object|null} user - Objeto de usuario de Supabase
 * @property {Object|null} session - Objeto de sesión de Supabase
 * @property {Error|null} [error] - Error si ocurrió
 */

// =============================================================================
// CONSTANTES DEL MÓDULO
// =============================================================================

/** Mensajes de error en español */
const ERRORES = {
  CREDENCIALES_INVALIDAS: 'Correo electrónico o contraseña incorrectos',
  USUARIO_NO_ENCONTRADO: 'No se encontró el usuario',
  SESION_EXPIRADA: 'Tu sesión ha expirado, por favor inicia sesión nuevamente',
  REGISTRO_FALLIDO: 'No se pudo completar el registro',
  ERROR_SERVIDOR: 'Error de conexión con el servidor'
};

// =============================================================================
// FUNCIONES AUXILIARES PRIVADAS
// =============================================================================

/**
 * Valida que el email tenga un formato correcto.
 * 
 * @param {string} email - Email a validar
 * @returns {boolean} True si el email es válido
 */
function esEmailValido(email) {
  const patronEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && patronEmail.test(email);
}

/**
 * Transforma errores de Supabase Auth a mensajes amigables en español.
 * 
 * @param {Error} error - Error original de Supabase
 * @returns {string} Mensaje de error en español
 */
function traducirErrorAuth(error) {
  if (!error) return ERRORES.ERROR_SERVIDOR;

  const mensaje = error.message?.toLowerCase() || '';
  const codigo = error.code || '';

  // Mapeo de errores comunes
  if (mensaje.includes('invalid login credentials') || mensaje.includes('invalid email or password')) {
    return ERRORES.CREDENCIALES_INVALIDAS;
  }
  if (mensaje.includes('user not found') || codigo === 'user_not_found') {
    return ERRORES.USUARIO_NO_ENCONTRADO;
  }
  if (mensaje.includes('email already registered') || mensaje.includes('user already registered')) {
    return 'Este correo electrónico ya está registrado';
  }
  if (mensaje.includes('password should be')) {
    return 'La contraseña debe tener al menos 6 caracteres';
  }
  if (mensaje.includes('email not confirmed')) {
    return 'Por favor confirma tu correo electrónico antes de continuar';
  }
  if (mensaje.includes('refresh token')) {
    return ERRORES.SESION_EXPIRADA;
  }

  return error.message || ERRORES.ERROR_SERVIDOR;
}

// =============================================================================
// SERVICIO PRINCIPAL DE AUTENTICACIÓN
// =============================================================================

export const authService = {

  // ---------------------------------------------------------------------------
  // OPERACIONES DE SESIÓN
  // ---------------------------------------------------------------------------

  /**
   * Inicia sesión con correo electrónico y contraseña.
   * 
   * @param {string} email - Correo electrónico del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Promise<{user: Object, session: Object}>} Datos del usuario y sesión
   * @throws {Error} Si las credenciales son inválidas
   * 
   * @example
   * try {
   *   const { user, session } = await authService.iniciarSesion(
   *     'usuario@correo.com', 
   *     'miContraseña123'
   *   );
   *   console.log('Bienvenido', user.email);
   * } catch (error) {
   *   console.error(error.message); // "Correo electrónico o contraseña incorrectos"
   * }
   */
  async iniciarSesion(email, password) {
    // Validaciones
    if (!esEmailValido(email)) {
      throw new Error('Por favor ingresa un correo electrónico válido');
    }
    if (!password || password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      const mensajeError = traducirErrorAuth(error);
      console.error('[authService] Error en inicio de sesión:', error);
      throw new Error(mensajeError);
    }

    return data;
  },

  /** Alias para compatibilidad con código existente */
  async signIn(email, password) {
    return this.iniciarSesion(email, password);
  },

  /**
   * Registra un nuevo usuario en la plataforma.
   * 
   * @param {string} email - Correo electrónico del nuevo usuario
   * @param {string} password - Contraseña (mínimo 6 caracteres)
   * @param {Object} metadatos - Datos adicionales del perfil
   * @param {string} metadatos.role - Rol del usuario ('cliente', 'tienda', 'domiciliario')
   * @param {string} [metadatos.full_name] - Nombre completo
   * @param {string} [metadatos.phone] - Número de teléfono
   * @returns {Promise<{user: Object, session: Object}>} Datos del usuario creado
   * 
   * @example
   * const resultado = await authService.registrarUsuario(
   *   'nuevo@correo.com',
   *   'password123',
   *   { role: 'cliente', full_name: 'Juan Pérez', phone: '3001234567' }
   * );
   */
  async registrarUsuario(email, password, metadatos = {}) {
    // Validaciones
    if (!esEmailValido(email)) {
      throw new Error('Por favor ingresa un correo electrónico válido');
    }
    if (!password || password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }
    if (!metadatos.role) {
      throw new Error('El rol del usuario es requerido');
    }

    const rolesValidos = ['cliente', 'tienda', 'domiciliario'];
    if (!rolesValidos.includes(metadatos.role)) {
      throw new Error(`Rol inválido. Debe ser uno de: ${rolesValidos.join(', ')}`);
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadatos }
    });

    if (error) {
      const mensajeError = traducirErrorAuth(error);
      console.error('[authService] Error en registro:', error);
      throw new Error(mensajeError);
    }

    return data;
  },

  /** Alias para compatibilidad */
  async signUp(email, password, metaData) {
    return this.registrarUsuario(email, password, metaData);
  },

  /**
   * Cierra la sesión del usuario actual.
   * Limpia todos los datos de sesión locales y en el servidor.
   * 
   * @returns {Promise<void>}
   * 
   * @example
   * await authService.cerrarSesion();
   * // Usuario desconectado
   */
  async cerrarSesion() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      // Algunos errores son "ignorables" (usuario ya no existe, token inválido)
      const esErrorIgnorable =
        error.message?.includes('user_not_found') ||
        error.message?.includes('Invalid Refresh Token') ||
        error.status === 403;

      if (!esErrorIgnorable) {
        console.error('[authService] Error al cerrar sesión:', error);
        throw new Error('No se pudo cerrar la sesión correctamente');
      }
    }
  },

  /** Alias para compatibilidad */
  async signOut() {
    return this.cerrarSesion();
  },

  // ---------------------------------------------------------------------------
  // OPERACIONES DE USUARIO
  // ---------------------------------------------------------------------------

  /**
   * Obtiene el usuario actualmente autenticado.
   * 
   * @returns {Promise<Object|null>} Datos del usuario o null si no hay sesión
   * 
   * @example
   * const usuario = await authService.obtenerUsuarioActual();
   * if (usuario) {
   *   console.log('Usuario logueado:', usuario.email);
   * } else {
   *   console.log('No hay sesión activa');
   * }
   */
  async obtenerUsuarioActual() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        console.warn('[authService] Error obteniendo usuario:', error.message);
        return null;
      }

      return user;
    } catch (error) {
      console.error('[authService] Error inesperado:', error);
      return null;
    }
  },

  /** Alias para compatibilidad */
  async getCurrentUser() {
    return this.obtenerUsuarioActual();
  },

  /**
   * Obtiene la sesión actual del usuario.
   * 
   * @returns {Promise<Object|null>} Objeto de sesión o null
   */
  async obtenerSesion() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.warn('[authService] Error obteniendo sesión:', error.message);
        return null;
      }

      return session;
    } catch (error) {
      console.error('[authService] Error inesperado:', error);
      return null;
    }
  },

  /** Alias para compatibilidad */
  async getSession() {
    return this.obtenerSesion();
  },

  // ---------------------------------------------------------------------------
  // OPERACIONES DE PERFIL
  // ---------------------------------------------------------------------------

  /**
   * Actualiza el perfil de un usuario en la tabla 'profiles'.
   * 
   * @param {string} idUsuario - UUID del usuario
   * @param {Object} actualizaciones - Campos a actualizar
   * @param {string} [actualizaciones.full_name] - Nombre completo
   * @param {string} [actualizaciones.phone] - Teléfono
   * @param {string} [actualizaciones.avatar_url] - URL del avatar
   * @returns {Promise<Object>} Perfil actualizado
   * 
   * @example
   * const perfilActualizado = await authService.actualizarPerfil(
   *   'uuid-usuario',
   *   { full_name: 'Juan Carlos Pérez', phone: '3009876543' }
   * );
   */
  async actualizarPerfil(idUsuario, actualizaciones) {
    if (!idUsuario) {
      throw new Error('ID de usuario es requerido');
    }
    if (!actualizaciones || Object.keys(actualizaciones).length === 0) {
      throw new Error('Se requiere al menos un campo para actualizar');
    }

    const { data: perfilActualizado, error } = await supabase
      .from('profiles')
      .update(actualizaciones)
      .eq('id', idUsuario)
      .select()
      .single();

    if (error) {
      console.error('[authService] Error actualizando perfil:', error);
      throw new Error('No se pudo actualizar el perfil');
    }

    return perfilActualizado;
  },

  /** Alias para compatibilidad */
  async updateUserProfile(userId, updates) {
    return this.actualizarPerfil(userId, updates);
  }
};

// =============================================================================
// EXPORTACIÓN POR DEFECTO
// =============================================================================

export default authService;
