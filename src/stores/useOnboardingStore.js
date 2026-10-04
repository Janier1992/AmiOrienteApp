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
            // Si ya completó o saltó la guía, el controlador decide si la vuelve
            // a iniciar (ver OnboardingController.checkAndTrigger) — esta acción
            // siempre inicia cuando se le llama.
            startGuide: (guideId) => {
                set({
                    isActive: true,
                    currentGuideId: guideId,
                    currentStepIndex: 0,
                    isWelcomeVisible: false
                });
            },

            // completed=false (closed early via the X, or never finished) still
            // records the guide as skipped — otherwise it has nowhere to persist
            // that dismissal and re-triggers on every future visit.
            stopGuide: (completed = false) => {
                const { currentGuideId, completedGuides, skippedGuides } = get();
                const updates = {
                    isActive: false,
                    currentGuideId: null,
                    currentStepIndex: 0
                };

                if (currentGuideId) {
                    if (completed) {
                        updates.completedGuides = [...new Set([...completedGuides, currentGuideId])];
                    } else {
                        updates.skippedGuides = [...new Set([...skippedGuides, currentGuideId])];
                    }
                }

                set(updates);
            },

            // Para "Saltar" en el modal de bienvenida: el tour aún no inició
            // (currentGuideId sigue null), así que recibe el guideId directamente
            // en vez de leerlo del estado.
            skipGuideById: (guideId) => {
                if (!guideId) return;
                const { skippedGuides } = get();
                set({
                    isWelcomeVisible: false,
                    skippedGuides: [...new Set([...skippedGuides, guideId])]
                });
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
