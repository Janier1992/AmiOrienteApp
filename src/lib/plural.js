/**
 * Plural en español para los nombres que cada tipo de negocio da a sus cosas
 * («Plato», «Pedido Mayorista», «Cita/Venta»…), ya que la interfaz los muestra
 * en plural en menús y encabezados.
 */

const pluralizarPalabra = (palabra) => {
  if (!palabra) return palabra;
  const ultima = palabra.slice(-1).toLowerCase();
  if ('aeiouáéíóú'.includes(ultima)) return `${palabra}s`;
  if (ultima === 's') return palabra; // «Lunes», «Crisis»: ya es invariable
  if (ultima === 'z') return `${palabra.slice(0, -1)}ces`;
  // «Habitación» -> «Habitaciones» (se pierde la tilde de la sílaba final)
  if (palabra.toLowerCase().endsWith('ón')) return `${palabra.slice(0, -2)}ones`;
  return `${palabra}es`;
};

/**
 * Pasa a plural cada palabra de la frase; respeta los separadores (espacio y «/»).
 * @param {string} frase Ej.: «Pedido Mayorista»
 * @returns {string} Ej.: «Pedidos Mayoristas»
 */
export const pluralizar = (frase) =>
  String(frase ?? '')
    .split(/(\s+|\/)/)
    .map((parte) => (/^(\s+|\/)$/.test(parte) ? parte : pluralizarPalabra(parte)))
    .join('');
