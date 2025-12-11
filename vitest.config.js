/**
 * =============================================================================
 * CONFIGURACIÓN DE VITEST
 * =============================================================================
 * 
 * Este archivo configura el framework de testing Vitest para el proyecto.
 * Incluye soporte para JSX, alias de rutas y jsdom para tests de componentes.
 * 
 * @see https://vitest.dev/config/
 * =============================================================================
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
    plugins: [react()],
    test: {
        // Entorno de ejecución para tests de componentes React
        environment: 'jsdom',

        // Archivos de setup que se ejecutan antes de cada test
        setupFiles: ['./src/__tests__/setup.js'],

        // Patrones para encontrar archivos de test
        include: ['src/**/*.{test,spec}.{js,jsx}'],

        // Reportero de resultados
        reporter: 'verbose',

        // Variables globales disponibles en tests
        globals: true
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    }
});
