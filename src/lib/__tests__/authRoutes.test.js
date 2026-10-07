import { describe, it, expect } from 'vitest';
import {
  getHomeRouteForUser,
  getSafeRedirect,
  getPostLoginRoute,
  buildAuthRedirectUrl,
  isExistingUserResponse,
} from '../authRoutes';

const userWithRole = (role) => ({ user_metadata: { role } });

describe('getHomeRouteForUser', () => {
  it('envía a cada rol a su panel', () => {
    expect(getHomeRouteForUser(userWithRole('cliente'))).toBe('/cliente/dashboard');
    expect(getHomeRouteForUser(userWithRole('tienda'))).toBe('/tienda/dashboard');
    expect(getHomeRouteForUser(userWithRole('domiciliario'))).toBe('/domiciliario/dashboard');
  });
  it('envía a /admin si es administrador', () => {
    expect(getHomeRouteForUser(userWithRole('cliente'), true)).toBe('/admin');
  });
  it('usa / si no hay rol o usuario', () => {
    expect(getHomeRouteForUser({ user_metadata: {} })).toBe('/');
    expect(getHomeRouteForUser(null)).toBe('/');
  });
});

describe('getSafeRedirect', () => {
  it('acepta rutas internas', () => {
    expect(getSafeRedirect('?redirect=/checkout')).toBe('/checkout');
  });
  it('rechaza destinos externos o ambiguos', () => {
    expect(getSafeRedirect('?redirect=https://evil.com')).toBeNull();
    expect(getSafeRedirect('?redirect=//evil.com')).toBeNull();
    expect(getSafeRedirect('?redirect=/\\evil.com')).toBeNull();
    expect(getSafeRedirect('?redirect=javascript:alert(1)')).toBeNull();
  });
  it('devuelve null si no hay parámetro', () => {
    expect(getSafeRedirect('')).toBeNull();
    expect(getSafeRedirect(undefined)).toBeNull();
  });
});

describe('getPostLoginRoute', () => {
  it('respeta ?redirect= seguro', () => {
    expect(getPostLoginRoute(userWithRole('cliente'), false, '?redirect=/checkout')).toBe('/checkout');
  });
  it('cae al panel del rol sin redirect', () => {
    expect(getPostLoginRoute(userWithRole('tienda'), false, '')).toBe('/tienda/dashboard');
  });
  it('el administrador siempre va a /admin', () => {
    expect(getPostLoginRoute(userWithRole('cliente'), true, '?redirect=/checkout')).toBe('/admin');
  });
});

describe('buildAuthRedirectUrl', () => {
  it('conserva el subdirectorio y usa hash', () => {
    const loc = { origin: 'https://janier1992.github.io', pathname: '/AmiOrienteApp/' };
    expect(buildAuthRedirectUrl('/auth/confirm', loc)).toBe(
      'https://janier1992.github.io/AmiOrienteApp/#/auth/confirm'
    );
  });
});

describe('isExistingUserResponse', () => {
  it('detecta el registro de un correo ya existente', () => {
    expect(isExistingUserResponse({ identities: [] })).toBe(true);
    expect(isExistingUserResponse({ identities: [{ id: 1 }] })).toBe(false);
    expect(isExistingUserResponse(null)).toBe(false);
  });
});
