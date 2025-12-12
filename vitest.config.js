/**
 * =============================================================================
 * CONFIGURACIÓN DE VITEST
 * =============================================================================
 * 
 * Descripción:
 *   Configuración del framework de testing Vitest para el proyecto MiOriente.
 *   Integrado con Vite para aprovechar la misma configuración de build.
 * 
 * Uso:
 *   npm run test        # Ejecutar tests una vez
 *   npm run test:watch  # Ejecutar en modo watch
 * 
 * Autor: Equipo MiOriente
 * Última actualización: 2025-12-11
 * =============================================================================
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],

    test: {
        // Entorno de prueba (jsdom para simular DOM)
        environment: 'jsdom',

        // Incluir archivos de test
        include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],

        // Excluir node_modules y carpetas de build
        exclude: ['node_modules', 'dist', 'build'],

        // Habilitar variables globales de test (describe, it, expect)
        globals: true,

        // Configuración de cobertura
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            exclude: [
                'node_modules/',
                'src/**/*.test.{js,jsx}',
                'src/**/*.spec.{js,jsx}'
            ]
        },

        // Setup files (si necesitas configuración global)
        // setupFiles: ['./src/test/setup.js'],
    },

    // Resolver aliases (igual que en vite.config.js)
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
