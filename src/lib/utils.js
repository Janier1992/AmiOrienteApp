/**
 * =============================================================================
 * UTILIDADES GENERALES (utils.js)
 * =============================================================================
 * 
 * Descripción:
 *   Este módulo contiene funciones utilitarias reutilizables en toda la
 *   aplicación. Incluye utilidades de CSS, formateo de datos, y helpers
 *   para operaciones comunes.
 * 
 * Responsabilidades:
 *   - Combinar clases CSS de Tailwind de forma segura
 *   - Formatear moneda (COP)
 *   - Formatear fechas en español
 *   - Formatear estados de pedidos con colores
 *   - Validaciones comunes
 * 
 * Uso:
 *   import { cn, formatearMoneda, formatearFecha } from '@/lib/utils';
 * 
 * Autor: Equipo MiOriente
 * Última actualización: 2025-12-11
 * =============================================================================
 */

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CURRENCY_LOCALE, ORDER_STATUS, DELIVERY_STATUS } from './constants';

// =============================================================================
// UTILIDADES DE CSS
// =============================================================================

/**
 * Combina clases CSS de forma segura, manejando conflictos de Tailwind.
 * Utiliza clsx para condiciones y twMerge para resolver conflictos.
 * 
 * @param {...(string|Object|Array)} inputs - Clases CSS o condiciones
 * @returns {string} Clases combinadas sin conflictos
 * 
 * @example
 * cn('px-4 py-2', 'bg-blue-500', isActive && 'bg-green-500')
 * // Si isActive es true: 'px-4 py-2 bg-green-500' (bg-green-500 reemplaza bg-blue-500)
 */
export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

// =============================================================================
// FORMATEO DE MONEDA
// =============================================================================

/**
 * Formatea un número como moneda colombiana (COP).
 * 
 * @param {number|string} cantidad - Cantidad a formatear
 * @param {boolean} [mostrarDecimales=false] - Si mostrar centavos
 * @returns {string} Cantidad formateada como moneda
 * 
 * @example
 * formatearMoneda(25000)       // "$ 25.000"
 * formatearMoneda(25000.50, true) // "$ 25.000,50"
 * formatearMoneda(null)        // "$ 0"
 */
export function formatearMoneda(cantidad, mostrarDecimales = false) {
	const numero = Number(cantidad) || 0;

	const opciones = {
		style: 'currency',
		currency: 'COP',
		minimumFractionDigits: mostrarDecimales ? 2 : 0,
		maximumFractionDigits: mostrarDecimales ? 2 : 0
	};

	try {
		return new Intl.NumberFormat(CURRENCY_LOCALE, opciones).format(numero);
	} catch (error) {
		// Fallback si Intl no está disponible
		return `$ ${numero.toLocaleString('es-CO')}`;
	}
}

/**
 * Alias en inglés para compatibilidad.
 * @deprecated Usar formatearMoneda en su lugar
 */
export function formatCurrency(amount, showDecimals = false) {
	return formatearMoneda(amount, showDecimals);
}

// =============================================================================
// FORMATEO DE FECHAS
// =============================================================================

/**
 * Formatea una fecha en formato legible en español.
 * 
 * @param {string|Date} fecha - Fecha a formatear (ISO string o Date)
 * @param {Object} [opciones] - Opciones de formato
 * @param {boolean} [opciones.incluirHora=false] - Si incluir la hora
 * @param {boolean} [opciones.formatoCorto=false] - Formato corto (dd/mm/yyyy)
 * @returns {string} Fecha formateada
 * 
 * @example
 * formatearFecha('2025-12-11T15:30:00')           // "11 de diciembre de 2025"
 * formatearFecha('2025-12-11', { incluirHora: true }) // "11 de diciembre de 2025, 3:30 p. m."
 * formatearFecha('2025-12-11', { formatoCorto: true }) // "11/12/2025"
 */
export function formatearFecha(fecha, opciones = {}) {
	if (!fecha) return '';

	const { incluirHora = false, formatoCorto = false } = opciones;

	try {
		const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;

		// Verificar que la fecha es válida
		if (isNaN(fechaObj.getTime())) {
			return '';
		}

		if (formatoCorto) {
			return fechaObj.toLocaleDateString(CURRENCY_LOCALE, {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric'
			});
		}

		const opcionesFormato = {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		};

		if (incluirHora) {
			opcionesFormato.hour = 'numeric';
			opcionesFormato.minute = '2-digit';
		}

		return fechaObj.toLocaleDateString(CURRENCY_LOCALE, opcionesFormato);
	} catch (error) {
		console.error('[utils] Error formateando fecha:', error);
		return '';
	}
}

/**
 * Alias en inglés para compatibilidad.
 */
export function formatDate(date, options) {
	return formatearFecha(date, options);
}

/**
 * Formatea una fecha como tiempo relativo ("hace 5 minutos", "ayer", etc.).
 * 
 * @param {string|Date} fecha - Fecha a formatear
 * @returns {string} Tiempo relativo en español
 * 
 * @example
 * formatearTiempoRelativo(new Date())                  // "ahora"
 * formatearTiempoRelativo(new Date(Date.now() - 60000)) // "hace 1 minuto"
 */
export function formatearTiempoRelativo(fecha) {
	if (!fecha) return '';

	try {
		const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
		const ahora = new Date();
		const diferenciaMilisegundos = ahora.getTime() - fechaObj.getTime();
		const diferenciaSegundos = Math.floor(diferenciaMilisegundos / 1000);
		const diferenciaMinutos = Math.floor(diferenciaSegundos / 60);
		const diferenciaHoras = Math.floor(diferenciaMinutos / 60);
		const diferenciaDias = Math.floor(diferenciaHoras / 24);

		if (diferenciaSegundos < 60) {
			return 'ahora';
		}
		if (diferenciaMinutos === 1) {
			return 'hace 1 minuto';
		}
		if (diferenciaMinutos < 60) {
			return `hace ${diferenciaMinutos} minutos`;
		}
		if (diferenciaHoras === 1) {
			return 'hace 1 hora';
		}
		if (diferenciaHoras < 24) {
			return `hace ${diferenciaHoras} horas`;
		}
		if (diferenciaDias === 1) {
			return 'ayer';
		}
		if (diferenciaDias < 7) {
			return `hace ${diferenciaDias} días`;
		}

		// Más de una semana, mostrar fecha completa
		return formatearFecha(fechaObj, { formatoCorto: true });
	} catch (error) {
		return '';
	}
}

// =============================================================================
// FORMATEO DE ESTADOS
// =============================================================================

/**
 * Obtiene la configuración visual para un estado de pedido.
 * Retorna información de color y estilo para badges/etiquetas.
 * 
 * @param {string} estado - Estado del pedido
 * @returns {{texto: string, color: string, bgClass: string, textClass: string}}
 * 
 * @example
 * const config = obtenerConfiguracionEstado('En preparación');
 * // { texto: 'En preparación', color: 'yellow', bgClass: 'bg-yellow-100', textClass: 'text-yellow-800' }
 */
export function obtenerConfiguracionEstado(estado) {
	const configuraciones = {
		'Pendiente': {
			texto: 'Pendiente',
			color: 'orange',
			bgClass: 'bg-orange-100 dark:bg-orange-900/30',
			textClass: 'text-orange-800 dark:text-orange-300'
		},
		'Pendiente de pago en efectivo': {
			texto: 'Pago en efectivo',
			color: 'amber',
			bgClass: 'bg-amber-100 dark:bg-amber-900/30',
			textClass: 'text-amber-800 dark:text-amber-300'
		},
		'Confirmado': {
			texto: 'Confirmado',
			color: 'blue',
			bgClass: 'bg-blue-100 dark:bg-blue-900/30',
			textClass: 'text-blue-800 dark:text-blue-300'
		},
		'En preparación': {
			texto: 'En preparación',
			color: 'yellow',
			bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
			textClass: 'text-yellow-800 dark:text-yellow-300'
		},
		'Listo para recogida': {
			texto: 'Listo',
			color: 'purple',
			bgClass: 'bg-purple-100 dark:bg-purple-900/30',
			textClass: 'text-purple-800 dark:text-purple-300'
		},
		'En curso': {
			texto: 'En camino',
			color: 'indigo',
			bgClass: 'bg-indigo-100 dark:bg-indigo-900/30',
			textClass: 'text-indigo-800 dark:text-indigo-300'
		},
		'Entregado': {
			texto: 'Entregado',
			color: 'green',
			bgClass: 'bg-green-100 dark:bg-green-900/30',
			textClass: 'text-green-800 dark:text-green-300'
		},
		'Cancelado': {
			texto: 'Cancelado',
			color: 'red',
			bgClass: 'bg-red-100 dark:bg-red-900/30',
			textClass: 'text-red-800 dark:text-red-300'
		}
	};

	return configuraciones[estado] || {
		texto: estado || 'Desconocido',
		color: 'gray',
		bgClass: 'bg-gray-100 dark:bg-gray-800',
		textClass: 'text-gray-800 dark:text-gray-300'
	};
}

/**
 * Alias en inglés para compatibilidad.
 */
export function getStatusConfig(status) {
	return obtenerConfiguracionEstado(status);
}

// =============================================================================
// VALIDACIONES
// =============================================================================

/**
 * Valida si un string es un email válido.
 * 
 * @param {string} email - Email a validar
 * @returns {boolean} True si es un email válido
 * 
 * @example
 * esEmailValido('usuario@correo.com') // true
 * esEmailValido('invalido')           // false
 */
export function esEmailValido(email) {
	if (!email || typeof email !== 'string') return false;
	const patron = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return patron.test(email.trim());
}

/**
 * Valida si un string es un número de teléfono colombiano válido.
 * Acepta formatos: 3001234567, 300 123 4567, +57 300 123 4567
 * 
 * @param {string} telefono - Teléfono a validar
 * @returns {boolean} True si es un teléfono válido
 */
export function esTelefonoValido(telefono) {
	if (!telefono || typeof telefono !== 'string') return false;
	// Eliminar espacios y guiones
	let limpio = telefono.replace(/[\s\-]/g, '');
	// Eliminar prefijo +57 si existe
	if (limpio.startsWith('+57')) {
		limpio = limpio.substring(3);
	}
	// Debe ser un número de 10 dígitos que empiece con 3
	return /^3\d{9}$/.test(limpio);
}

/**
 * Verifica si un valor está vacío (null, undefined, string vacío, array vacío).
 * 
 * @param {*} valor - Valor a verificar
 * @returns {boolean} True si está vacío
 */
export function estaVacio(valor) {
	if (valor === null || valor === undefined) return true;
	if (typeof valor === 'string') return valor.trim() === '';
	if (Array.isArray(valor)) return valor.length === 0;
	if (typeof valor === 'object') return Object.keys(valor).length === 0;
	return false;
}

// =============================================================================
// UTILIDADES DE TEXTO
// =============================================================================

/**
 * Capitaliza la primera letra de un string.
 * 
 * @param {string} texto - Texto a capitalizar
 * @returns {string} Texto con primera letra mayúscula
 */
export function capitalizar(texto) {
	if (!texto || typeof texto !== 'string') return '';
	return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

/**
 * Trunca un texto a una longitud máxima, agregando "..." si es necesario.
 * 
 * @param {string} texto - Texto a truncar
 * @param {number} [longitudMaxima=50] - Longitud máxima
 * @returns {string} Texto truncado
 */
export function truncar(texto, longitudMaxima = 50) {
	if (!texto || typeof texto !== 'string') return '';
	if (texto.length <= longitudMaxima) return texto;
	return texto.substring(0, longitudMaxima - 3) + '...';
}

// =============================================================================
// UTILIDADES NUMÉRICAS
// =============================================================================

/**
 * Genera un ID único para uso temporal (no usar para base de datos).
 * 
 * @returns {string} ID único
 */
export function generarIdTemporal() {
	return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calcula la distancia en kilómetros entre dos coordenadas geográficas.
 * Utiliza la fórmula de Haversine.
 * 
 * @param {number} lat1 - Latitud punto 1
 * @param {number} lng1 - Longitud punto 1
 * @param {number} lat2 - Latitud punto 2
 * @param {number} lng2 - Longitud punto 2
 * @returns {number} Distancia en kilómetros
 */
export function calcularDistancia(lat1, lng1, lat2, lng2) {
	const R = 6371; // Radio de la Tierra en km
	const dLat = (lat2 - lat1) * Math.PI / 180;
	const dLng = (lng2 - lng1) * Math.PI / 180;
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
		Math.sin(dLng / 2) * Math.sin(dLng / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}