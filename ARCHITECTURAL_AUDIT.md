# Auditoría Arquitectónica y Plan de Refactorización - AmiOriente

**Fecha:** 13 de Diciembre, 2025
**Auditor:** Antigravity (AI Software Architect)
**Estado:** En Progreso

## 1. Resumen Ejecutivo
La aplicación "AmiOriente" es una plataforma basada en React + Vite que gestiona múltiples tipos de dashboards para tiendas (Papelería, Cultivos, etc.).
La arquitectura actual es funcional pero presenta deuda técnica en áreas clave:
- **Acoplamiento UI/Lógica:** Varios componentes de vista mezclan lógica de negocio compleja.
- **Duplicación de Código:** Existen múltiples implementaciones similares para dashboards (Retail, Stationery, etc.).
- **Punto de Entrada Saturado:** `main.jsx` contiene lógica de PWA que debería estar encapsulada.
- **Documentación:** Falta estandarización en JSDoc y comentarios en español.

## 2. Hallazgos Principales

### A. Estuctura del Proyecto
- `src/pages/StoreDashboard/` ha crecido orgánicamente. Contiene tanto layouts (`RetailDashboards.jsx`) como vistas específicas (`StationeryDashboard.jsx`) y componentes de lógica (`index.jsx` router).
- **Recomendación:** Reorganizar en FEATURES (ej: `src/features/stationery`, `src/features/dashboard`).

### B. Calidad de Código
- `main.jsx`: Contiene ~60 líneas de lógica de debugging PWA.
    - **Acción:** Mover a `src/pwa/pwaLogger.js` o similar.
- `StoreDashboard/index.jsx`: Actúa como un "God Component" para el enrutamiento.
    - **Acción:** Simplificar delegando a sub-routers.

### C. Servicios y Estado
- `useStoreDashboard.js`: Es robusto (usa Zustand), pero se debe revisar el manejo de errores para garantizar mensajes amigables al usuario ("User-friendly error messages").
- `storeService.js`: Revisar consistencia en nombres de métodos (camelCase vs español/inglés mezclado).

## 3. Plan de Acción (Roadmap)

### FASE 1: Limpieza y Estructura (Inmediato)
1.  **Refactorizar `main.jsx`:** Extraer lógica PWA.
2.  **Auditoría de Router:** Centralizar y limpiar la lógica de navegación en `App.jsx` y dashboards.

### FASE 2: Capa de Servicios
1.  **Estandarización:** Asegurar que todos los servicios (`storeService`, `authService`) retornen tipos de datos consistentes.
2.  **Documentación:** Añadir JSDoc en Español a todos los métodos exportados.

### FASE 3: UI/UX y Componentes
1.  **Refactorizar Dashboards:** Crear un `GenericDashboardLayout` más flexible para reducir la duplicación entre `RetailDashboards` y `StationeryDashboard`.
2.  **Unificar Vistas de Productos:** Evaluar si `StationeryProductsView` y `ProductsTab` pueden compartir un componente base `ProductList`.

### FASE 4: Documentación Final
1.  Crear `README.md` maestro con instrucciones de despliegue, arquitectura y guías de contribución.

---

*Este documento se actualizará a medida que progrese la refactorización.*
