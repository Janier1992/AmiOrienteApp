/**
 * Fotografía del domiciliario: se toma con la cámara, se recorta cuadrada y se
 * comprime a JPEG para guardarla y mostrarla al cliente. El servidor valida
 * formato (JPEG en base64) y tamaño (ver is_valid_driver_photo).
 */
export const PHOTO_SIZE = 480;
export const PHOTO_MAX_CHARS = 240000; // el servidor acepta hasta 250 000

/** Recorta al centro y escala a un cuadrado. `source` puede ser <video>, <img> o ImageBitmap. */
export const drawSquare = (source, width, height, size = PHOTO_SIZE) => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const side = Math.min(width, height);
  const sx = (width - side) / 2;
  const sy = (height - side) / 2;
  canvas.getContext('2d').drawImage(source, sx, sy, side, side, 0, 0, size, size);
  return canvas;
};

/** JPEG en base64 que cabe en el límite: baja la calidad hasta lograrlo. */
export const canvasToJpeg = (canvas, maxChars = PHOTO_MAX_CHARS) => {
  let quality = 0.82;
  let data = canvas.toDataURL('image/jpeg', quality);
  while (data.length > maxChars && quality > 0.4) {
    quality -= 0.1;
    data = canvas.toDataURL('image/jpeg', quality);
  }
  return data;
};

export const isPhotoDataUrl = (value) =>
  typeof value === 'string' && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(value) && value.length >= 2000 && value.length <= 250000;

/** Foto elegida desde un archivo (respaldo cuando no hay cámara): se reduce igual. */
export const fileToSquareJpeg = async (file) => {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('No se pudo leer la imagen.'));
      el.src = url;
    });
    return canvasToJpeg(drawSquare(img, img.naturalWidth, img.naturalHeight));
  } finally {
    URL.revokeObjectURL(url);
  }
};

export const VEHICLE_LABELS = { moto: 'Motocicleta', carro: 'Automóvil', bicicleta: 'Bicicleta', pie: 'A pie' };
