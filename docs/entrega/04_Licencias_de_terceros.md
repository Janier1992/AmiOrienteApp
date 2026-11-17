# Inventario de licencias de terceros

Qué componentes de otros autores usa AmiOriente y bajo qué licencia. Sirve para la entrega (el cliente debe saber qué recibe
y qué condiciones traen) y para el abogado que redacte la cesión de derechos.

> Las dependencias se pueden volver a medir en cualquier momento con **`node tools/licencias.js`** (requiere `npm ci`).
> Cifras tomadas el 12 de noviembre de 2026.

## 1. Dependencias de producción (las que viajan en el código que descarga el navegador)

**266 paquetes** en total (directos y transitivos):

| Licencia | Paquetes | ¿Qué implica? |
|---|---|---|
| MIT | 224 | Permisiva: se puede usar, modificar y vender conservando el aviso de derechos |
| ISC | 27 | Equivalente a MIT |
| Apache-2.0 | 3 | Permisiva, con cláusula de patentes y obligación de conservar avisos |
| BSD-3-Clause / BSD-2-Clause | 5 | Permisivas |
| BlueOak-1.0.0 | 3 | Permisiva |
| 0BSD | 1 | Sin condiciones |
| MIT AND ISC | 1 | Ambas son permisivas |
| **Hippocratic-2.1** | **2** | **A revisar** (ver 2) |

Dependencias directas: React 18, React Router, Supabase JS, Radix UI, Tailwind (utilidades), Zustand, Recharts, Framer Motion,
Leaflet y lucide-react, entre otras; **todas permisivas salvo `react-leaflet`**. El detalle por paquete sale del script.

Las herramientas de desarrollo (Vite, Vitest, ESLint, etc.) **no** viajan en la app publicada, por lo que sus licencias no se
distribuyen al usuario final.

## 2. Punto a revisar con el abogado: Hippocratic License 2.1

Los paquetes **`react-leaflet`** (4.2.1) y **`@react-leaflet/core`** (2.1.0), que dibujan los mapas, usan la *Hippocratic
License 2.1*. Es una licencia de «código ético»: permite usar, modificar y distribuir, pero **condiciona el uso al respeto de
estándares de derechos humanos** y **no es una licencia de código abierto aprobada por la OSI**. No impide vender la app, pero
conviene que un abogado confirme si sus condiciones afectan la cesión o reventa del software.

Alternativa técnica si hace falta: usar **Leaflet** directamente (licencia BSD-2, permisiva) sin `react-leaflet`. Es un cambio
acotado, porque los mapas están en tres componentes (seguimiento del cliente, entrega del domiciliario y sitio turístico).

## 3. Otros componentes que no son paquetes de código

| Componente | Uso | Licencia / condiciones | Acción |
|---|---|---|---|
| **Tipografía Inter** | Texto de toda la app, cargada desde Google Fonts | SIL Open Font License 1.1 (libre, uso comercial permitido) | Opcional: alojarla en la propia app para no depender de Google |
| **Datos de OpenStreetMap** | Mapas y direcciones | ODbL: obliga a **atribuir** («© OpenStreetMap contributors»), ya incluida en el mapa | Mantener la atribución |
| **Servidores públicos de teselas y de Nominatim** | Mapas y nombre del municipio | Tienen **política de uso**: no admiten tráfico intensivo; para producción conviene proveedor comercial o servidor propio | Configurable con `VITE_MAP_TILE_URL` y `VITE_GEOCODER_URL` (ver 02) |
| **Imágenes de marcadores de Leaflet** | Alfiler por defecto del mapa turístico | BSD-2 (van en el paquete de Leaflet) | Ninguna |
| **Íconos de los mapas** (alfileres y moto) | Mapas de seguimiento y entrega | Propios (SVG dibujado en el proyecto) | Ninguna |
| **lucide-react** | Íconos de la interfaz | ISC | Ninguna |
| **Imágenes de ejemplo (Unsplash)** | 21 imágenes en datos de demostración (`src/data/sample-data.js` y algunas páginas) | Licencia de Unsplash: uso comercial permitido, sin atribución obligatoria, pero no se pueden revender como fotos sueltas | Reemplazar por imágenes propias antes de la puesta en marcha, o quitar el modo demostración |
| **Imágenes de relleno (placehold.co)** | Cuando un producto no tiene foto | Servicio externo gratuito | Opcional: sustituir por una imagen local |
| **Logo de AmiOriente** (`public/logo.png`, `logo.svg`) y colibrí de SynflowIA | Identidad visual | **Confirmar autoría y titularidad** | Dejar por escrito quién es el titular y qué se cede al cliente |
| **Enlaces a Google Maps** | Botones «Navegar» | Solo enlaces; no se usa la API de Google | Ninguna |

## 4. Licencia del propio proyecto
El repositorio **no tiene un archivo `LICENSE`** y hoy es **público** en GitHub, lo que no equivale a una licencia de uso:
sin una licencia expresa, el código queda con todos los derechos reservados al autor. Antes de entregar:
1. Pasar el repositorio a **privado** (o publicarlo con la licencia que el contrato defina).
2. Agregar un aviso de derechos acorde a lo pactado (titular, año y condiciones).
3. Dejar en el contrato qué se cede (el código desarrollado) y qué sigue siendo de terceros (las licencias de la sección 1 y 3).
