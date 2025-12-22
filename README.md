# AmiOriente - Plataforma Multiservicios

![AmiOriente Logo](https://raw.githubusercontent.com/Janier1992/AmiOrienteApp/main/public/logo.svg)

**AmiOriente** es una plataforma integral de comercio electrónico y servicios diseñada para el Oriente Antioqueño. Funciona como una **Progressive Web App (PWA)**, permitiendo su instalación en dispositivos móviles y de escritorio como si fuera una aplicación nativa, con soporte offline y alto rendimiento.

---

## 🚀 Stack Tecnológico

La aplicación está construida sobre una arquitectura moderna, escalable y mantenible:

### Frontend Core
*   **[React 18](https://react.dev/)**: Biblioteca principal para la construcción de interfaces de usuario interactivas.
*   **[Vite](https://vitejs.dev/)**: Entorno de desarrollo ultrarrápido y empaquetador (Bundler) optimizado.
*   **[React Router DOM](https://reactrouter.com/)**: Manejo de rutas y navegación (SPA).

### Estilos y UI
*   **[Tailwind CSS](https://tailwindcss.com/)**: Framework de utilidades CSS para diseño rápido y responsivo.
*   **[Shadcn/ui](https://ui.shadcn.com/)**: Colección de componentes UI reutilizables y accesibles (basados en Radix UI).
*   **[Lucide React](https://lucide.dev/)**: Librería de iconos vectoriales ligeros y consistentes.
*   **[Framer Motion](https://www.framer.com/motion/)**: Biblioteca para animaciones complejas y transiciones de layout.

### Estado y Datos
*   **[Zustand](https://github.com/pmndrs/zustand)**: Gestión de estado global ligera y escalable (usada para Carrito, Autenticación, Datos de Tienda).
*   **[Supabase](https://supabase.com/)**: Backend-as-a-Service (BaaS) que provee Base de Datos PostgreSQL, Autenticación y Almacenamiento.

### Funcionalidades Especiales
*   **[Leaflet](https://leafletjs.com/)**: Mapas interactivos para geolocalización de pedidos y tiendas.
*   **[Vite PWA Plugin](https://vite-pwa-org.netlify.app/)**: Configuración automatizada de Service Workers y Manifiestos para capacidades offline e instalabilidad.

---

## 📂 Estructura del Proyecto y Archivos Clave

El proyecto sigue una estructura modular para facilitar el mantenimiento y la escalabilidad:

```bash
src/
├── components/          # Bloques de construcción de UI
│   ├── pwa/             # Componentes específicos de PWA (Banner de instalación)
│   ├── shared/          # Componentes compartidos entre módulos (ProductCard, MapView)
│   └── ui/              # Átomos de diseño (Botones, Inputs, Modales - Shadcn)
│
├── contexts/            # Contextos de React para estado global compartido (AuthContext)
│
├── data/                # Datos estáticos o mockups para desarrollo y pruebas
│
├── hooks/               # Custom Hooks (Lógica reutilizable)
│   └── use-pwa-install.js # Lógica para controlar el banner de instalación PWA
│
├── lib/                 # Librerías y utilidades de configuración
│   └── customSupabaseClient.js # Cliente de conexión a Supabase
│
├── pages/               # Vistas principales (Rutas)
│   ├── StoreDashboard/  # Módulo COMPLEJO: Panel de Administración de Tiendas
│   │   ├── dashboards/  # Dashboards especializados (Hotel, Farmacia, Ropa, Agro)
│   │   └── views/       # Vistas internas (Productos, Pedidos, Configuración)
│   ├── CheckoutPage.jsx # Flujo final de compra
│   ├── DeliveryDashboard.jsx # Panel para repartidores
│   └── ...
│
├── services/            # Capa de Lógica de Negocio (¡CRÍTICO!)
│   ├── authService.js   # Login, Registro, Roles
│   ├── deliveryService.js # Lógica de repartidores (Aceptar pedidos, Rutas)
│   ├── orderService.js  # Creación y gestión de pedidos
│   └── storeService.js  # CRUD de tiendas y productos
│
├── stores/              # Gestores de Estado Global (Zustand)
│   ├── useAuth.js       # Estado del usuario logueado
│   ├── useCartStore.js  # Estado del carrito de compras
│   └── useStoreDashboard.js # Estado de la tienda activa
│
└── main.jsx             # Punto de entrada de la aplicación
```

---

## 📐 Arquitectura: Modelo Base + Extensiones

Para manejar la diversidad de negocios (Hoteles vs Farmacias vs Restaurantes), el sistema utiliza un patrón de **"Modelo Base con Extensiones"**:

1.  **Dashboard Genérico (`BaseStoreDashboard`)**:
    *   Provee la estructura común: Sidebar, Header, Navegación.
    *   Maneja funcionalidades universales: "Configuración", "Clientes".

2.  **Dashboards Especializados**:
    *   Cada tipo de negocio tiene su propio componente (ej. `PharmacyDashboard`, `HotelDashboard`).
    *   Estos inyectan vistas específicas (ej. "Habitaciones" para hoteles, "Recetas" para farmacias) en el layout base.
    *   Utilizan un **Service Registry** para cargar la lógica de datos correcta según el tipo de tienda.

---

## 📱 PWA (Progressive Web App)

La aplicación es completamente instalable.
*   **Manifest**: Configurado en `vite.config.js` y generado en `dist/manifest.json`. Define nombre, iconos y colores.
*   **Service Worker**: Generado por Workbox. Cachea recursos estáticos (JS, CSS, HTML, JSON) para carga instantánea y funcionamiento offline.
*   **Prompt de Instalación**: Componente personalizado `PWAInstallPrompt` que detecta si la app es instalable y guía al usuario (con instrucciones especiales para iOS).

---

## 🛠️ Guía de Desarrollo y Despliegue

### Requisitos Previos
*   Node.js (v18+)
*   NPM

### 1. Instalación Local
```bash
git clone https://github.com/Janier1992/AmiOrienteApp.git
cd AmiOrienteApp
npm install
```

### 2. Ejecución en Desarrollo
```bash
npm run dev
# Abre http://localhost:5173
```

### 3. Construcción (Build)
Para generar la versión optimizada para producción:
```bash
npm run build
# Genera la carpeta 'dist' con archivos minificados y el Service Worker.
```

### 4. Despliegue en GitHub Pages
El proyecto está configurado para desplegarse en GitHub Pages usando rutas absolutas.
1.  Asegúrate de que `vite.config.js` tenga `base: '/AmiOrienteApp/'`.
2.  Ejecuta el script de despliegue manual (o usa Actions):
    ```bash
    cd dist
    git init
    git add .
    git commit -m "Deploy"
    git push -f https://github.com/Janier1992/AmiOrienteApp.git HEAD:gh-pages
    ```

---

## 🔒 Variables de Entorno
El proyecto requiere un archivo `.env` en la raíz para conectar con Supabase:
```env
VITE_SUPABASE_ANON_KEY=tu_clave_anonima
```

---

## 💰 Modelo de Negocio y Proyección Financiera

### Proyección de Costos Operativos
Para mantener la plataforma en funcionamiento, se estiman los siguientes costos mensuales:

*   **Infraestructura (Hosting)**: $0 COP. GitHub Pages provee hosting gratuito ilimitado para el frontend.
*   **Base de Datos (Supabase)**:
    *   *Fase Inicial*: $0 COP (Plan Free - Hasta 500MB y 50k usuarios mensuales).
    *   *Fase Pro*: ~$25 USD/mes (Plan Pro) cuando se supere el límite de usuarios o almacenamiento.
*   **Dominio y SSL**: ~$15 USD/año (AmiOriente.com).
*   **Mantenimiento**: Costos variables de desarrollo para nuevas funcionalidades.

### Modelo de Suscripción para Negocios
Se establece un modelo híbrido obligatorio para todos los comercios registrados:

1.  **Plan Básico (Comisión por Venta)**
    *   **Costo de Entrada**: GRATIS.
    *   **Modelo**: Cobro del **8-10%** sobre cada pedido exitoso gestionado por la app.
    *   *Ideal para*: Pequeños negocios o emprendimientos que están arrancando.

2.  **Plan Profesional (Suscripción Mensual)**
    *   **Costo**: $50,000 - $80,000 COP / mes.
    *   **Beneficio**: 0% de comisión en ventas.
    *   **Extras**: Posicionamiento destacado en la app y soporte prioritario.
    *   *Ideal para*: Restaurantes o tiendas con alto volumen de ventas diaria.

---

## 📈 Estrategia de Crecimiento y Marketing

Para lograr la máxima visibilidad en el Oriente Antioqueño, se ejecutará la siguiente estrategia:

### 1. Marketing Digital Hiper-Local
*   **SEO Local**: Optimización de palabras clave como "Domicilios Rionegro", "Restaurantes Marinilla", "Turismo Guatapé".
*   **Redes Sociales**: Campañas en Instagram y Facebook segmentadas por geolocalización (Radio de 20km en el Oriente).
*   **Influencer Marketing**: Alianzas con micro-influencers de comida y turismo de la región.

### 2. Marketing Físico (Activación)
*   **Stickers "Pídelo por AmiOriente"**: Entrega gratuita de calcomanías con código QR de la app para que los comercios las peguen en sus mesas y vitrinas.
*   **Alianzas Estratégicas**: Acuerdos con gremios de taxistas y hoteles para que recomienden la app a turistas.

### 3. Programa de Referidos
*   **Incentivo**: Ofrecer un cupón de $5,000 COP al usuario que invite a un amigo (y el amigo haga su primer pedido).
*   **Gamificación**: Badges y niveles para usuarios frecuentes ("Explorador del Oriente").

---
**Desarrollado con ❤️ por el Equipo de Tecnología de AmiOriente**
*Última actualización: Diciembre 2025*
