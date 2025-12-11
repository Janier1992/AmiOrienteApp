/**
 * =============================================================================
 * SERVICIO DE AUTENTICACIÓN (authService)
 * =============================================================================
 * 
 * Este módulo maneja todas las operaciones de autenticación de usuarios
 * en la plataforma MiOriente utilizando Supabase Auth.
 * 
 * @module services/authService
 * @requires @/lib/customSupabaseClient
 * 
 * FUNCIONES DISPONIBLES:
 * ----------------------
 * 1. iniciarSesion        - Autentica usuario con email y contraseña
 * 2. registrarUsuario     - Crea una nueva cuenta de usuario
 * 3. cerrarSesion         - Termina la sesión activa
 * 4. obtenerUsuarioActual - Retorna el usuario autenticado
 * 5. obtenerSesion        - Retorna la sesión activa
 * 6. actualizarPerfil     - Modifica datos del perfil del usuario
 * 
 * ROLES DE USUARIO:
 * -----------------
 * - 'cliente'     : Compradores de productos
 * - 'tienda'      : Vendedores/cultivadores
 * - 'domiciliario': Repartidores de pedidos
 * 
 * EJEMPLO DE USO:
 * ---------------
 * import { authService } from '@/services/authService';
 * const usuario = await authService.signIn('correo@ejemplo.com', 'contraseña');
 * =============================================================================
 */

import { supabase } from '@/lib/customSupabaseClient';

export const authService = {
  /**
   * Inicia sesión con email y contraseña.
   * Valida credenciales contra Supabase Auth.
   * 
   * @async
   * @function iniciarSesion
   * @param {string} email - Correo electrónico del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Promise<Object>} Objeto con user y session
   * @throws {Error} Si las credenciales son inválidas
   * 
   * @example
   * const { user, session } = await authService.signIn('user@mail.com', '123456');
   */
  async signIn(email, password) {
    if (!email || !password) {
      throw new Error('Email y contraseña son requeridos');
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error('[authService.signIn] Error:', error.message);
      throw error;
    }
    return data;
  },

  /**
   * Registra un nuevo usuario en la plataforma.
   * Crea la cuenta en Supabase Auth y guarda metadata adicional.
   * 
   * @async
   * @function registrarUsuario
   * @param {string} email - Correo electrónico único
   * @param {string} password - Contraseña (mínimo 6 caracteres)
   * @param {Object} metaData - Datos adicionales del usuario
   * @param {string} metaData.role - Rol: 'cliente', 'tienda', o 'domiciliario'
   * @param {string} metaData.full_name - Nombre completo
   * @param {string} [metaData.phone] - Teléfono de contacto
   * @returns {Promise<Object>} Usuario creado con metadata
   * @throws {Error} Si el email ya existe o datos inválidos
   * 
   * @example
   * const nuevoUsuario = await authService.signUp(
   *   'nuevo@mail.com',
   *   'contraseña123',
   *   { role: 'cliente', full_name: 'Juan Pérez' }
   * );
   */
  async signUp(email, password, metaData) {
    if (!email || !password) {
      throw new Error('Email y contraseña son requeridos');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metaData }
    });

    if (error) {
      console.error('[authService.signUp] Error:', error.message);
      throw error;
    }
    return data;
  },

  /**
   * Cierra la sesión del usuario actual.
   * Invalida el token de acceso en Supabase.
   * 
   * @async
   * @function cerrarSesion
   * @returns {Promise<void>}
   * @throws {Error} Si no hay sesión activa
   * 
   * @example
   * await authService.signOut();
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('[authService.signOut] Error:', error.message);
      throw error;
    }
  },

  /**
   * Obtiene el usuario autenticado actual.
   * Útil para verificar el estado de autenticación.
   * 
   * @async
   * @function obtenerUsuarioActual
   * @returns {Promise<Object|null>} Usuario actual o null si no está autenticado
   * 
   * @example
   * const usuario = await authService.getCurrentUser();
   * if (usuario) console.log('Rol:', usuario.user_metadata.role);
   */
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.warn('[authService.getCurrentUser] Sin usuario activo');
      return null;
    }
    return user;
  },

  /**
   * Obtiene la sesión activa del usuario.
   * Incluye tokens de acceso y refresh.
   * 
   * @async
   * @function obtenerSesion
   * @returns {Promise<Object|null>} Sesión activa o null
   * 
   * @example
   * const sesion = await authService.getSession();
   * console.log('Token expira en:', sesion?.expires_at);
   */
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.warn('[authService.getSession] Sin sesión activa');
      return null;
    }
    return session;
  },

  /**
   * Actualiza el perfil del usuario en la tabla 'profiles'.
   * 
   * @async
   * @function actualizarPerfil
   * @param {string} userId - UUID del usuario
   * @param {Object} updates - Campos a actualizar
   * @param {string} [updates.full_name] - Nombre completo
   * @param {string} [updates.phone] - Teléfono
   * @param {string} [updates.avatar_url] - URL de foto de perfil
   * @returns {Promise<Object>} Perfil actualizado
   * @throws {Error} Si el usuario no existe
   * 
   * @example
   * await authService.updateUserProfile('user-uuid', { phone: '3001234567' });
   */
  async updateUserProfile(userId, updates) {
    if (!userId) {
      throw new Error('Se requiere el ID del usuario');
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('[authService.updateUserProfile] Error:', error.message);
      throw error;
    }
    return data;
  }
};
