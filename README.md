# AmiOriente - Plataforma Multiservicios

![AmiOriente Logo](https://via.placeholder.com/150)

**AmiOriente** es una plataforma web progresiva (PWA) moderna diseñada para conectar diversos sectores comerciales (restaurantes, papelerías, cultivos, ropa, etc.) con clientes y domiciliarios en la región de Oriente.

## 🚀 Tecnologías

El proyecto está construido con un stack moderno enfocado en rendimiento y escalabilidad:

*   **Frontend**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
*   **Lenguaje**: JavaScript (ES6+) con JSDoc para tipado estático ligero.
*   **Estilos**: [Tailwind CSS](https://tailwindcss.com/) + [Shadcn/ui](https://ui.shadcn.com/)
*   **Estado Global**: [Zustand](https://github.com/pmndrs/zustand)
*   **Base de Datos y Auth**: [Supabase](https://supabase.com/)
*   **Iconos**: [Lucide React](https://lucide.dev/)
*   **Routing**: React Router DOM (HashRouter para compatibilidad estática)

## 📂 Estructura del Proyecto

```bash
src/
├── components/         # Componentes UI reutilizables (Botones, Inputs, Layouts)
│   ├── ui/             # Componentes base (Shadcn)
│   └── dashboards/     # Layouts de paneles de control
├── contexts/           # Contextos de React (Auth, Carrito, Tema)
├── lib/                # Utilidades y configuración (Supabase cliente, PWA util)
├── pages/              # Vistas principales de la aplicación
│   ├── StoreDashboard/ # Módulo complejo de administración de tiendas
│   │   ├── dashboards/ # Implementaciones específicas (Papelería, Restaurante)
│   │   └── views/      # Vistas extraídas y reutilizables
│   └── ...
├── services/           # Capa de lógica de negocio y llamadas a API
│   ├── authService.js  # Gestión de usuarios y sesiones
│   └── storeService.js # Gestión de datos de tiendas
└── stores/             # Stores de Zustand (Estado global)
```

## 🛠️ Instalación y Ejecución

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/Janier1992/AmiOrienteApp.git
    cd AplicaciónMiOriente_UltAct
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Ejecutar en desarrollo:**
    ```bash
    npm run dev
    ```

4.  **Compilar para producción:**
    ```bash
    npm run build
    ```

## 📐 Arquitectura y Buenas Prácticas

### Capa de Servicios
Toda la lógica de interacción con Supabase está centralizada en `src/services/`.
*   **Importante**: No hacer llamadas directas a `supabase` desde los componentes de UI. Usar siempre el servicio correspondiente (`storeService`, `authService`).

### Manejo de Estado
Utilizamos **Zustand** (`src/stores/`) para el estado global complejo (carrito, dashboard data). El estado local de UI se maneja con `useState`.

### PWA
La lógica de Service Worker está encapsulada en `src/lib/pwaUtils.js`. El archivo `main.jsx` se mantiene limpio e importa estas utilidades.

## 🤝 Contribución

1.  Asegúrate de seguir el estilo de código existente (ESLint configurado).
2.  Documenta nuevas funciones con JSDoc en español.
3.  Crea componentes pequeños y reutilizables.

---
**Desarrollado por el Equipo MiOriente**
*Auditoría Técnica realizada el 13 de Diciembre, 2025*
