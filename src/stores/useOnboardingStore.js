import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Store para gestionar el estado del Onboarding (Guías interactivas).
 * Utiliza persistencia para recordar qué guías ya completó el usuario.
 */
export const useOnboardingStore = create(
    persist(
        (set, get) => ({
            // Estado UI
            isActive: false,           // Si el tour está activo
            currentGuideId: null,      // ID de la guía actual (ej: 'client_home', 'store_dashboard')
            currentStepIndex: 0,       // Paso actual dentro de la guía
            isWelcomeVisible: false,   // Si mostrar el modal de bienvenida inicial

            // Estado de Progreso (Persistente)
            completedGuides: [],       // Lista de IDs de guías completadas
            skippedGuides: [],         // Lista de IDs de guías saltadas

            // Acciones
            startGuide: (guideId) => {
                const { completedGuides, skippedGuides } = get();
                // Si ya completó o saltó, no iniciar automáticamente (salvo forzado)
                // Pero aquí asumimos que el componente controlador decide eso.
                set({
                    isActive: true,
                    currentGuideId: guideId,
                    currentStepIndex: 0,
                    isWelcomeVisible: false
                });
            },

            stopGuide: (completed = false) => {
                const { currentGuideId, completedGuides } = get();
                const updates = {
                    isActive: false,
                    currentGuideId: null,
                    currentStepIndex: 0
                };

                if (completed && currentGuideId) {
                    updates.completedGuides = [...new Set([...completedGuides, currentGuideId])];
                }

                set(updates);
            },

            skipGuide: () => {
                const { currentGuideId, skippedGuides } = get();
                if (currentGuideId) {
                    set({
                        isActive: false,
                        currentGuideId: null,
                        skippedGuides: [...new Set([...skippedGuides, currentGuideId])]
                    });
                }
            },

            nextStep: () => {
                set((state) => ({ currentStepIndex: state.currentStepIndex + 1 }));
            },

            prevStep: () => {
                set((state) => ({ currentStepIndex: Math.max(0, state.currentStepIndex - 1) }));
            },

            showWelcome: () => set({ isWelcomeVisible: true }),
            hideWelcome: () => set({ isWelcomeVisible: false }),

            resetProgress: () => set({ completedGuides: [], skippedGuides: [] })
        }),
        {
            name: 'amioriente-onboarding-storage', // Nombre en localStorage
            getStorage: () => localStorage,        // Usar localStorage
            partialize: (state) => ({              // Solo persistir lo importante
                completedGuides: state.completedGuides,
                skippedGuides: state.skippedGuides,
                version: state.version
            }),
            version: 2, // Incrementamos versión para forzar limpieza
            migrate: (persistedState, version) => {
                if (version < 2) {
                    // Si la versión es vieja, reseteamos el progreso
                    return {
                        completedGuides: [],
                        skippedGuides: [],
                        version: 2
                    };
                }
                return persistedState;
            }
        }
    )
);
