/**
 * Utilidades de navegación para autenticación.
 *
 * Centraliza tres decisiones que antes estaban repetidas (y mal resueltas) en
 * cada página de login/registro:
 *   - a qué panel enviar a cada rol,
 *   - qué ruta de retorno (?redirect=) es segura de respetar,
 *   - qué URL usar en los enlaces de confirmación enviados por correo.
 */

/** Panel principal de cada rol. */
export const ROLE_HOME_ROUTES = {
  cliente: '/cliente/dashboard',
  tienda: '/tienda/dashboard',
  domiciliario: '/domiciliario/dashboard',
};

/**
 * Devuelve la ruta a la que debe ir un usuario tras iniciar sesión.
 * @param {object|null} user - Usuario de Supabase
 * @param {boolean} [isAdmin=false] - Si es administrador de la plataforma
 * @returns {string}
 */
export const getHomeRouteForUser = (user, isAdmin = false) => {
  if (isAdmin) return '/admin';
  return ROLE_HOME_ROUTES[user?.user_metadata?.role] || '/';
};

/**
 * Lee el parámetro ?redirect= y solo lo acepta si es una ruta interna
 * (evita open-redirect hacia sitios externos).
 * @param {string} search - location.search
 * @returns {string|null}
 */
export const getSafeRedirect = (search) => {
  const target = new URLSearchParams(search || '').get('redirect');
  if (!target) return null;
  if (!target.startsWith('/') || target.startsWith('//') || target.startsWith('/\\')) return null;
  return target;
};

/**
 * Destino final tras un login exitoso: respeta ?redirect= si es seguro; si no,
 * el panel del rol.
 */
export const getPostLoginRoute = (user, isAdmin, search) =>
  isAdmin ? '/admin' : getSafeRedirect(search) || getHomeRouteForUser(user, false);

/**
 * URL absoluta de una ruta de la app para usar en enlaces de correo.
 * La app usa HashRouter y puede estar en un subdirectorio (GitHub Pages:
 * /AmiOrienteApp/), por eso no basta con `origin + path`.
 * @param {string} path - Ruta interna, p. ej. '/auth/confirm'
 * @param {Location} [loc=window.location]
 */
export const buildAuthRedirectUrl = (path, loc = window.location) =>
  `${loc.origin}${loc.pathname}#${path}`;

/**
 * Supabase no devuelve error al registrar un correo ya confirmado (para no
 * revelar qué correos existen): responde un usuario sin identidades.
 */
export const isExistingUserResponse = (user) =>
  Array.isArray(user?.identities) && user.identities.length === 0;
