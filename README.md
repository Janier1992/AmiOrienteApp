# 🌄 MiOriente - Plataforma de Servicios del Oriente Antioqueño

> Del Campo a tu Mesa - Conectando campesinos y clientes directamente

[![Deploy to GitHub Pages](https://github.com/Janier1992/Plataforma-MiOriente/actions/workflows/deploy.yml/badge.svg)](https://github.com/Janier1992/Plataforma-MiOriente/actions/workflows/deploy.yml)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-green)](https://web.dev/progressive-web-apps/)
[![React](https://img.shields.io/badge/React-18.2-blue)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-orange)](https://supabase.com/)

🚀 **[Ver Aplicación en Vivo](https://janier1992.github.io/Plataforma-MiOriente/)**

---

## 📋 Descripción

**MiOriente** es una plataforma web progresiva (PWA) diseñada para conectar a los campesinos del Oriente Antioqueño directamente con los consumidores. La aplicación permite:

- 🛒 **Comprar productos agrícolas** frescos directamente de los cultivadores
- 🏪 **Gestionar tiendas virtuales** para vendedores/cultivadores
- 🚚 **Coordinar entregas** con domiciliarios de la región
- 📱 **Funcionar offline** gracias a su arquitectura PWA

---

## 🏗️ Estructura del Proyecto

```
src/
├── api/                    # Clientes API externos
│   └── EcommerceApi.js     # API de Hostinger E-commerce
│
├── components/             # Componentes React reutilizables
│   ├── ui/                 # Componentes base (shadcn/ui)
│   ├── shared/             # Componentes compartidos
│   ├── customer-dashboard/ # Dashboard del cliente
│   ├── delivery-dashboard/ # Dashboard del domiciliario
│   ├── dashboards/         # Layouts de dashboards
│   ├── pwa/                # Componentes PWA
│   └── tourism/            # Componentes de turismo
│
├── contexts/               # Contextos React
│   └── SupabaseAuthContext.jsx  # Contexto de autenticación
│
├── data/                   # Datos estáticos
│   └── tourismData.js      # Puntos turísticos
│
├── hooks/                  # Hooks personalizados
│   ├── useCart.js          # Estado del carrito
│   └── use-pwa-install.js  # Instalación PWA
│
├── lib/                    # Utilidades y configuraciones
│   ├── customSupabaseClient.js  # Cliente Supabase
│   ├── utils.js            # Funciones utilitarias
│   └── route-utils.js      # Utilidades de rutas
│
├── pages/                  # Vistas de páginas
│   ├── StoreDashboard/     # Dashboard de tienda
│   ├── CustomerDashboard/  # Dashboard de cliente
│   └── DeliveryDashboard/  # Dashboard de domiciliario
│
├── services/               # Capa de servicios (Supabase)
│   ├── authService.js      # Autenticación
│   ├── storeService.js     # Operaciones de tienda
│   ├── customerService.js  # Operaciones de cliente
│   └── deliveryService.js  # Operaciones de domicilios
│
├── stores/                 # Estado global (Zustand)
│   └── useStoreDashboard.js # Estado del dashboard
│
├── App.jsx                 # Componente raíz con rutas
├── main.jsx                # Punto de entrada
└── index.css               # Estilos globales
```

---

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 18+ 
- npm o yarn
- Cuenta en [Supabase](https://supabase.com/) (para backend)

### Pasos de Instalación

```bash
# 1. Clonar el repositorio
git clone [https://github.com/Janier1992/Plataforma-MiOriente.git]
cd MiOriente

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno (opcional)
# Las credenciales de Supabase ya están configuradas en el código

# 4. Iniciar servidor de desarrollo
npm run dev
```

### Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia servidor de desarrollo en puerto 3000 |
| `npm run build` | Genera build de producción con PWA |
| `npm run preview` | Previsualiza build de producción |
| `npm run lint` | Ejecuta ESLint para verificar código |

---

## 🔑 Variables de Entorno

El proyecto usa las siguientes variables (ya configuradas):

```env
# Supabase
VITE_SUPABASE_URL=https://vgpvczyeyqmicuwjkczh.supabase.co
VITE_SUPABASE_ANON_KEY=[CLAVE_ANONIMA]

# E-commerce API
VITE_ECOMMERCE_API_URL=https://api-ecommerce.hostinger.com
VITE_ECOMMERCE_STORE_ID=store_01K2SZGQJYA4YS6YG3EJDKWRE7
```

---

## 👥 Roles de Usuario

| Rol | Descripción | Ruta del Dashboard |
|-----|-------------|-------------------|
| `cliente` | Compradores de productos | `/cliente/dashboard` |
| `tienda` | Vendedores/Cultivadores | `/tienda/dashboard` |
| `domiciliario` | Repartidores de pedidos | `/domiciliario/dashboard` |

---

## 📱 Características PWA

- ✅ Instalable en dispositivos móviles y escritorio
- ✅ Funciona sin conexión a internet
- ✅ Actualización automática del Service Worker
- ✅ Iconos y splash screen personalizados

---

## 📦 Dependencias Principales

| Paquete | Versión | Uso |
|---------|---------|-----|
| react | 18.2.0 | Framework UI |
| react-router-dom | 6.16.0 | Enrutamiento |
| @supabase/supabase-js | 2.30.0 | Backend as a Service |
| zustand | 4.4.6 | Estado global |
| framer-motion | 10.16.4 | Animaciones |
| lucide-react | 0.292.0 | Iconos |
| tailwindcss | 3.3.3 | Estilos CSS |
| vite-plugin-pwa | 1.2.0 | Generación PWA |

---

## 🧪 Testing

```bash
# Ejecutar tests (cuando estén implementados)
npm test
```

---

## 📝 Convenciones de Código

- **Documentación**: Todos los servicios están documentados con JSDoc en español
- **Nombres de variables**: Descriptivos y en español para lógica de negocio
- **Componentes**: PascalCase (ej: `ProductsList.jsx`)
- **Hooks**: camelCase con prefijo `use` (ej: `useCart.js`)
- **Servicios**: camelCase con sufijo `Service` (ej: `storeService.js`)

---

## 🤝 Contribución

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

## 📞 Contacto

Para soporte o consultas sobre el proyecto, contactar al equipo de desarrollo.

---

**Desarrollado con ❤️ para el Oriente Antioqueño**
