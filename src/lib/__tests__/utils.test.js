/**
 * =============================================================================
 * TESTS PARA utils.js
 * =============================================================================
 * 
 * Descripción:
 *   Tests unitarios para las funciones utilitarias de la aplicación.
 *   Verifica el correcto funcionamiento de formateo de moneda, fechas,
 *   validaciones y utilidades de texto.
 * 
 * Ejecución:
 *   npm run test
 * 
 * Autor: Equipo MiOriente
 * =============================================================================
 */

import { describe, it, expect } from 'vitest';
import {
    cn,
    formatearMoneda,
    formatearFecha,
    formatearTiempoRelativo,
    obtenerConfiguracionEstado,
    esEmailValido,
    esTelefonoValido,
    estaVacio,
    capitalizar,
    truncar,
    calcularDistancia
} from '../utils';

// =============================================================================
// TESTS DE cn() - Combinación de clases CSS
// =============================================================================

describe('cn() - Combinación de clases CSS', () => {
    it('debería combinar clases simples', () => {
        const resultado = cn('px-4', 'py-2');
        expect(resultado).toBe('px-4 py-2');
    });

    it('debería manejar clases condicionales', () => {
        const isActive = true;
        const resultado = cn('base', isActive && 'active');
        expect(resultado).toContain('active');
    });

    it('debería resolver conflictos de Tailwind', () => {
        const resultado = cn('bg-red-500', 'bg-blue-500');
        expect(resultado).toBe('bg-blue-500');
    });

    it('debería manejar valores falsy', () => {
        const resultado = cn('base', false, null, undefined, 'extra');
        expect(resultado).toBe('base extra');
    });
});

// =============================================================================
// TESTS DE formatearMoneda() - Formateo de moneda
// =============================================================================

describe('formatearMoneda() - Formateo de moneda COP', () => {
    it('debería formatear un número positivo', () => {
        const resultado = formatearMoneda(25000);
        expect(resultado).toContain('25');
        expect(resultado).toContain('000');
    });

    it('debería manejar cero', () => {
        const resultado = formatearMoneda(0);
        expect(resultado).toContain('0');
    });

    it('debería manejar null/undefined', () => {
        expect(formatearMoneda(null)).toContain('0');
        expect(formatearMoneda(undefined)).toContain('0');
    });

    it('debería manejar strings numéricos', () => {
        const resultado = formatearMoneda('15000');
        expect(resultado).toContain('15');
    });

    it('debería mostrar decimales cuando se solicita', () => {
        const resultado = formatearMoneda(25000.50, true);
        expect(resultado).toContain('50');
    });
});

// =============================================================================
// TESTS DE formatearFecha() - Formateo de fechas
// =============================================================================

describe('formatearFecha() - Formateo de fechas', () => {
    it('debería formatear una fecha ISO', () => {
        // Usar fecha con hora explícita para evitar problemas de timezone
        const resultado = formatearFecha('2025-06-15T12:00:00');
        expect(resultado).toContain('junio');
        expect(resultado).toContain('2025');
    });

    it('debería manejar formato corto', () => {
        const resultado = formatearFecha('2025-06-15T12:00:00', { formatoCorto: true });
        expect(resultado).toContain('15');
        expect(resultado).toContain('2025');
    });

    it('debería manejar fechas vacías', () => {
        expect(formatearFecha(null)).toBe('');
        expect(formatearFecha('')).toBe('');
        expect(formatearFecha(undefined)).toBe('');
    });

    it('debería manejar fechas inválidas', () => {
        expect(formatearFecha('invalid-date')).toBe('');
    });
});

// =============================================================================
// TESTS DE formatearTiempoRelativo()
// =============================================================================

describe('formatearTiempoRelativo() - Tiempo relativo', () => {
    it('debería retornar "ahora" para fechas recientes', () => {
        const resultado = formatearTiempoRelativo(new Date());
        expect(resultado).toBe('ahora');
    });

    it('debería formatear minutos', () => {
        const hace5Minutos = new Date(Date.now() - 5 * 60 * 1000);
        const resultado = formatearTiempoRelativo(hace5Minutos);
        expect(resultado).toBe('hace 5 minutos');
    });

    it('debería formatear horas', () => {
        const hace3Horas = new Date(Date.now() - 3 * 60 * 60 * 1000);
        const resultado = formatearTiempoRelativo(hace3Horas);
        expect(resultado).toBe('hace 3 horas');
    });

    it('debería retornar "ayer" para el día anterior', () => {
        const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const resultado = formatearTiempoRelativo(ayer);
        expect(resultado).toBe('ayer');
    });
});

// =============================================================================
// TESTS DE obtenerConfiguracionEstado()
// =============================================================================

describe('obtenerConfiguracionEstado() - Configuración de estados', () => {
    it('debería retornar configuración para Pendiente', () => {
        const config = obtenerConfiguracionEstado('Pendiente');
        expect(config.texto).toBe('Pendiente');
        expect(config.color).toBe('orange');
        expect(config.bgClass).toContain('orange');
    });

    it('debería retornar configuración para Entregado', () => {
        const config = obtenerConfiguracionEstado('Entregado');
        expect(config.texto).toBe('Entregado');
        expect(config.color).toBe('green');
    });

    it('debería retornar configuración por defecto para estado desconocido', () => {
        const config = obtenerConfiguracionEstado('EstadoInventado');
        expect(config.texto).toBe('EstadoInventado');
        expect(config.color).toBe('gray');
    });
});

// =============================================================================
// TESTS DE VALIDACIONES
// =============================================================================

describe('esEmailValido() - Validación de email', () => {
    it('debería aceptar emails válidos', () => {
        expect(esEmailValido('usuario@correo.com')).toBe(true);
        expect(esEmailValido('test@example.co.uk')).toBe(true);
    });

    it('debería rechazar emails inválidos', () => {
        expect(esEmailValido('invalid')).toBe(false);
        expect(esEmailValido('test@')).toBe(false);
        expect(esEmailValido('@test.com')).toBe(false);
        expect(esEmailValido('')).toBe(false);
        expect(esEmailValido(null)).toBe(false);
    });
});

describe('esTelefonoValido() - Validación de teléfono colombiano', () => {
    it('debería aceptar teléfonos válidos', () => {
        expect(esTelefonoValido('3001234567')).toBe(true);
        expect(esTelefonoValido('3109876543')).toBe(true);
    });

    it('debería rechazar teléfonos inválidos', () => {
        expect(esTelefonoValido('1234567890')).toBe(false); // No empieza con 3
        expect(esTelefonoValido('300123456')).toBe(false); // Muy corto
        expect(esTelefonoValido('')).toBe(false);
        expect(esTelefonoValido(null)).toBe(false);
    });
});

describe('estaVacio() - Verificación de valores vacíos', () => {
    it('debería detectar valores vacíos', () => {
        expect(estaVacio(null)).toBe(true);
        expect(estaVacio(undefined)).toBe(true);
        expect(estaVacio('')).toBe(true);
        expect(estaVacio('   ')).toBe(true);
        expect(estaVacio([])).toBe(true);
        expect(estaVacio({})).toBe(true);
    });

    it('debería detectar valores no vacíos', () => {
        expect(estaVacio('texto')).toBe(false);
        expect(estaVacio([1, 2])).toBe(false);
        expect(estaVacio({ key: 'value' })).toBe(false);
        expect(estaVacio(0)).toBe(false);
        expect(estaVacio(false)).toBe(false);
    });
});

// =============================================================================
// TESTS DE UTILIDADES DE TEXTO
// =============================================================================

describe('capitalizar() - Capitalización de texto', () => {
    it('debería capitalizar correctamente', () => {
        expect(capitalizar('hola')).toBe('Hola');
        expect(capitalizar('MUNDO')).toBe('Mundo');
        expect(capitalizar('tEST')).toBe('Test');
    });

    it('debería manejar strings vacíos', () => {
        expect(capitalizar('')).toBe('');
        expect(capitalizar(null)).toBe('');
    });
});

describe('truncar() - Truncado de texto', () => {
    it('debería truncar texto largo', () => {
        const texto = 'Este es un texto muy largo que debe ser truncado';
        const resultado = truncar(texto, 20);
        expect(resultado.length).toBeLessThanOrEqual(20);
        expect(resultado).toContain('...');
    });

    it('debería no truncar texto corto', () => {
        const texto = 'Corto';
        const resultado = truncar(texto, 20);
        expect(resultado).toBe('Corto');
    });
});

// =============================================================================
// TESTS DE CÁLCULO DE DISTANCIA
// =============================================================================

describe('calcularDistancia() - Distancia entre coordenadas', () => {
    it('debería calcular distancia entre dos puntos', () => {
        // Bogotá a Medellín (aprox. 415 km)
        const distancia = calcularDistancia(4.711, -74.0721, 6.2442, -75.5812);
        expect(distancia).toBeGreaterThan(200);
        expect(distancia).toBeLessThan(500);
    });

    it('debería retornar 0 para el mismo punto', () => {
        const distancia = calcularDistancia(4.711, -74.0721, 4.711, -74.0721);
        expect(distancia).toBe(0);
    });
});
