# 🛵 MiOriente - Plataforma de Domicilios

**MiOriente** es una plataforma de servicios y domicilios para el Oriente Antioqueño, Colombia. Conecta clientes, tiendas/negocios y domiciliarios en un ecosistema digital moderno.

---

## 📋 Tabla de Contenidos

- [Descripción](#descripción)
- [Tecnologías](#tecnologías)
- [Arquitectura](#arquitectura)
- [Instalación](#instalación)
- [Scripts Disponibles](#scripts-disponibles)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Convenciones de Código](#convenciones-de-código)
- [Testing](#testing)
- [Contribución](#contribución)

---

## 📝 Descripción

MiOriente es una Progressive Web App (PWA) que ofrece tres roles principales:

| Rol | Descripción |
|-----|-------------|
| **🛒 Cliente** | Busca productos, realiza pedidos y rastrea entregas en tiempo real |
| **🏪 Tienda** | Gestiona catálogo, recibe y procesa pedidos, ve estadísticas |
| **🏍️ Domiciliario** | Recibe ofertas de entrega, gestiona rutas y gana comisiones |

### Funcionalidades Principales

- ✅ Autenticación con múltiples roles
- ✅ Catálogo de productos por tienda
- ✅ Carrito de compras persistente
- ✅ Seguimiento de pedidos en tiempo real
- ✅ Dashboard para cada rol
- ✅ Mapas interactivos con Leaflet
- ✅ Pagos con Stripe
- ✅ Diseño responsive y modo oscuro

---

## 🛠️ Tecnologías

| Categoría | Tecnología |
|-----------|------------|
| **Frontend** | React 18, Vite |
| **Estilos** | Tailwind CSS, shadcn/ui (Radix) |
| **Estado** | Zustand, React Context |
| **Backend** | Supabase (PostgreSQL, Auth, Realtime) |
| **Mapas** | Leaflet, React-Leaflet |
| **Pagos** | Stripe |
| **Testing** | Vitest, Testing Library |
| **Animaciones** | Framer Motion |

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ Pages   │  │ Comps   │  │ Hooks   │  │ Contexts│        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│       │            │            │            │              │
│       └────────────┴────────────┴────────────┘              │
│                          │                                   │
│  ┌───────────────────────┴───────────────────────┐         │
│  │              STORES (Zustand)                  │         │
│  │  cartStore │ useStoreDashboard │ useClientStore│         │
│  └───────────────────────┬───────────────────────┘         │
│                          │                                   │
│  ┌───────────────────────┴───────────────────────┐         │
│  │              SERVICES (Capa de Datos)          │         │
│  │  storeService │ authService │ customerService  │         │
│  └───────────────────────┬───────────────────────┘         │
└──────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                     SUPABASE (Backend)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Database │  │   Auth   │  │ Realtime │  │ Storage  │    │
│  │ (Postgres)│  │          │  │          │  │          │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Instalación

### Prerrequisitos

- Node.js 18+ (ver `.nvmrc`)
- npm o yarn

### Pasos

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd AplicacionMiOriente_UltAct
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno** (si es necesario)
   - El cliente de Supabase está configurado en `src/lib/customSupabaseClient.js`

4. **Iniciar en desarrollo**
   ```bash
   npm run dev
   ```

5. **Abrir en el navegador**
   - http://localhost:3000

---

## 📜 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo en puerto 3000 |
| `npm run build` | Genera la build de producción |
| `npm run preview` | Previsualiza la build de producción |
| `npm run lint` | Ejecuta ESLint para verificar el código |
| `npm run test` | Ejecuta los tests una vez |
| `npm run test:watch` | Ejecuta tests en modo watch |
| `npm run test:coverage` | Ejecuta tests con reporte de cobertura |

---

## 📁 Estructura del Proyecto

```
src/
├── api/               # Endpoints de API (si aplica)
├── components/        # Componentes reutilizables
│   ├── ui/           # Componentes base (shadcn/ui)
│   ├── shared/       # Componentes compartidos
│   ├── customer-dashboard/
│   ├── delivery-dashboard/
│   └── tourism/
├── contexts/          # React Contexts
│   ├── CartContext.jsx
│   ├── SupabaseAuthContext.jsx
│   └── ThemeContext.jsx
├── hooks/             # Custom React Hooks
├── lib/               # Utilidades y configuración
│   ├── constants.js   # Constantes de la app
│   ├── errorHandler.js# Manejo de errores
│   ├── utils.js       # Funciones utilitarias
│   └── customSupabaseClient.js
├── pages/             # Páginas/Vistas
│   ├── StoreDashboard/
│   ├── CustomerDashboard.jsx
│   ├── DeliveryDashboard.jsx
│   └── ...
├── services/          # Capa de servicios (acceso a datos)
│   ├── authService.js
│   ├── storeService.js
│   ├── customerService.js
│   ├── deliveryService.js
│   └── orderService.js
├── stores/            # Zustand stores (estado global)
│   ├── cartStore.js
│   ├── useStoreDashboard.js
│   ├── useClientStore.js
│   └── useDeliveryStore.js
├── App.jsx            # Componente raíz con rutas
├── main.jsx           # Punto de entrada
└── index.css          # Estilos globales
```

---

## 📏 Convenciones de Código

### Nomenclatura

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Componentes | PascalCase | `ProductCard.jsx` |
| Funciones | camelCase | `obtenerPedidos()` |
| Constantes | UPPER_SNAKE_CASE | `ORDER_STATUS` |
| Archivos de servicio | camelCase | `storeService.js` |
| Archivos de store | camelCase con use | `useStoreDashboard.js` |

### Idioma

- **Comentarios**: Español
- **Nombres de funciones públicas**: Español (con alias en inglés para compatibilidad)
- **Variables y nombres de archivos**: Inglés/Español según contexto

### Estructura de Servicios

Cada servicio sigue esta estructura:
```javascript
/**
 * Descripción del módulo
 */
import { supabase } from '@/lib/customSupabaseClient';

// Constantes
// Funciones auxiliares privadas
// Objeto de servicio exportado
export const nombreService = {
  async funcionEnEspañol() { /* ... */ },
  async functionEnIngles() { return this.funcionEnEspañol(); } // Alias
};
```

---

## 🧪 Testing

El proyecto usa **Vitest** como framework de testing.

### Ejecutar Tests

```bash
# Ejecutar todos los tests
npm run test

# Modo watch (re-ejecuta al cambiar archivos)
npm run test:watch

# Con cobertura
npm run test:coverage
```

### Ubicación de Tests

Los archivos de test se ubican en carpetas `__tests__` junto a los archivos que prueban:

```
src/
├── lib/
│   ├── __tests__/
│   │   └── utils.test.js
│   └── utils.js
├── stores/
│   ├── __tests__/
│   │   └── cartStore.test.js
│   └── cartStore.js
```

### Escribir Tests

```javascript
import { describe, it, expect } from 'vitest';

describe('Nombre del módulo', () => {
  it('debería hacer algo específico', () => {
    // Arrange
    const entrada = 'valor';
    
    // Act
    const resultado = funcionAProbar(entrada);
    
    // Assert
    expect(resultado).toBe('esperado');
  });
});
```

---

## 🤝 Contribución

1. Crear una rama desde `main`: `git checkout -b feature/nueva-funcionalidad`
2. Hacer commits descriptivos en español
3. Asegurar que los tests pasan: `npm run test`
4. Crear Pull Request

### Checklist Pre-Commit

- [ ] ¿El código tiene comentarios donde es necesario?
- [ ] ¿Las funciones tienen nombres descriptivos?
- [ ] ¿Se manejan los errores correctamente?
- [ ] ¿Se agregaron tests para la nueva funcionalidad?
- [ ] ¿El lint pasa sin errores? (`npm run lint`)

---

## 📄 Licencia

Este proyecto es privado y propietario del equipo MiOriente.

---

**Última actualización:** 2025-12-11
