import React, { useEffect, useState, useRef } from 'react';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import { ONBOARDING_GUIDES } from '@/data/onboardingGuides';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

/**
 * Componente principal del Tour.
 * Renderiza:
 * 1. Overlay oscuro (fondo)
 * 2. "Spotlight" (opcional o simulado)
 * 3. Tooltip/Card con la información paso a paso
 */
export function OnboardingTour() {
    const {
        isActive,
        currentGuideId,
        currentStepIndex,
        nextStep,
        prevStep,
        stopGuide,
        skipGuide
    } = useOnboardingStore();

    const [targetRect, setTargetRect] = useState(null);
    const steps = currentGuideId ? ONBOARDING_GUIDES[currentGuideId] : [];
    const currentStep = steps[currentStepIndex];

    // Efecto para encontrar y medir el elemento objetivo
    useEffect(() => {
        if (!isActive || !currentStep) return;

        const updateRect = () => {
            const element = document.getElementById(currentStep.targetId);
            if (element) {
                // Scroll suave hacia el elemento si no está visible
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // Obtener coordenadas
                const rect = element.getBoundingClientRect();
                setTargetRect({
                    top: rect.top + window.scrollY,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                    height: rect.height,
                    bottom: rect.bottom,
                    right: rect.right
                });
            } else {
                // Si no encuentra el elemento, pasamos al siguiente automáticamente tras un delay?
                // O simplemente imprimimos error. Mejor ser resiliente.
                console.warn(`Onboarding: Elemento #${currentStep.targetId} no encontrado.`);
            }
        };

        // Pequeño delay para asegurar que el DOM esté listo (especialmente en navegaciones)
        const timeout = setTimeout(updateRect, 500);
        window.addEventListener('resize', updateRect);
        window.addEventListener('scroll', updateRect);

        return () => {
            clearTimeout(timeout);
            window.removeEventListener('resize', updateRect);
            window.removeEventListener('scroll', updateRect);
        };
    }, [isActive, currentStepIndex, currentGuideId, currentStep]);

    if (!isActive || !currentStep || !targetRect) return null;

    const isLastStep = currentStepIndex === steps.length - 1;

    // Calculo simplificado de posición del Tooltip
    // Esto se podría mejorar con librerías como Floating UI, pero lo haremos manual para 0 deps extra.
    const getTooltipStyle = () => {
        const margin = 12;
        // Base style fixed
        const style = { position: 'absolute', zIndex: 60, width: '300px' };

        // Logica basica de posicionamiento
        if (currentStep.position === 'bottom') {
            style.top = targetRect.top + targetRect.height + margin;
            style.left = targetRect.left + (targetRect.width / 2) - 150;
        } else if (currentStep.position === 'top') {
            style.top = targetRect.top - margin - 200; // aprox height
            style.left = targetRect.left + (targetRect.width / 2) - 150;
        } else if (currentStep.position === 'right') {
            style.top = targetRect.top;
            style.left = targetRect.left + targetRect.width + margin;
        } else if (currentStep.position === 'left') {
            style.top = targetRect.top;
            style.left = targetRect.left - 300 - margin;
        } else {
            // Default bottom
            style.top = targetRect.top + targetRect.height + margin;
            style.left = targetRect.left;
        }

        // Correcciones de borde de pantalla (muy rudimentario)
        if (style.left < 10) style.left = 10;
        if (style.left + 300 > window.innerWidth) style.left = window.innerWidth - 310;

        return style;
    };

    return (
        <div className="fixed inset-0 z-50 pointer-events-none">
            {/* Overlay Oscuro con "hueco" usando clip-path o borders masivos */}
            {/* Enfoque simple: Dimmer general, y resaltamos elemento elevando su z-index (requiere relative en parent) - Difícil sin modificar parent. */}
            {/* Enfoque alternativo: SVG mask */}

            <svg className="absolute inset-0 w-full h-full pointer-events-auto" style={{ zIndex: 40 }}>
                <defs>
                    <mask id="spotlight-mask">
                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                        <rect
                            x={targetRect.left}
                            y={targetRect.top - window.scrollY}
                            width={targetRect.width}
                            height={targetRect.height}
                            rx="8"
                            fill="black"
                        />
                    </mask>
                </defs>
                <rect
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                    fill="rgba(0,0,0,0.7)"
                    mask="url(#spotlight-mask)"
                />
            </svg>

            {/* Borde brillante alrededor del elemento */}
            <motion.div
                layoutId="spotlight-border"
                className="absolute border-2 border-primary rounded-lg shadow-[0_0_20px_rgba(255,255,255,0.5)] pointer-events-none"
                style={{
                    top: targetRect.top - window.scrollY,
                    left: targetRect.left,
                    width: targetRect.width,
                    height: targetRect.height,
                    zIndex: 51
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />

            {/* Tooltip Card */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStepIndex}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="pointer-events-auto"
                    style={getTooltipStyle()}
                >
                    <Card className="shadow-2xl border-2 border-primary/20 backdrop-blur-sm bg-white/95 dark:bg-slate-900/95">
                        <CardHeader className="p-4 pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg text-primary">{currentStep.title}</CardTitle>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => stopGuide(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-2">
                            <p className="text-sm text-muted-foreground">{currentStep.content}</p>
                        </CardContent>
                        <CardFooter className="p-4 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 rounded-b-lg">
                            <div className="text-xs text-muted-foreground">
                                Paso {currentStepIndex + 1} de {steps.length}
                            </div>
                            <div className="flex gap-2">
                                {currentStepIndex > 0 && (
                                    <Button variant="outline" size="sm" onClick={prevStep}>
                                        <ChevronLeft className="h-4 w-4 mr-1" /> Atrás
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    onClick={isLastStep ? () => stopGuide(true) : nextStep}
                                    className={isLastStep ? "bg-green-600 hover:bg-green-700" : ""}
                                >
                                    {isLastStep ? '¡Entendido!' : 'Siguiente'}
                                    {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
