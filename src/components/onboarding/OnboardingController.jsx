import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { ROLE_WELCOME_MESSAGES } from '@/data/onboardingGuides';
import { OnboardingTour } from './OnboardingTour';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RocketIcon, CheckCircle2 } from 'lucide-react';

export function OnboardingWelcome() {
    const {
        isWelcomeVisible,
        hideWelcome,
        startGuide
    } = useOnboardingStore();
    const { user } = useAuth();
    // Si no hay usuario, asumimos rol 'invitado' para el tour de home
    const role = user?.user_metadata?.role || 'invitado';

    if (!isWelcomeVisible) return null;

    const info = ROLE_WELCOME_MESSAGES[role] || ROLE_WELCOME_MESSAGES['cliente']; // Fallback a cliente para invitado

    // Mapear rol a guía
    const getGuideId = (role) => {
        switch (role) {
            case 'tienda': return 'store_dashboard';
            case 'domiciliario': return 'delivery_dashboard';
            default: return 'client_home'; // Invitado ve home
        }
    };

    const handleStart = () => {
        hideWelcome();
        startGuide(getGuideId(role));
    };

    return (
        <Dialog open={isWelcomeVisible} onOpenChange={(open) => !open && hideWelcome()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto bg-primary/10 p-4 rounded-full mb-4">
                        <RocketIcon className="h-8 w-8 text-primary" />
                    </div>
                    <DialogTitle className="text-center text-2xl font-bold">{info.title}</DialogTitle>
                    <DialogDescription className="text-center text-base mt-2">
                        {info.message}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span>Aprende a navegar la plataforma en &lt; 1 min</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span>Conoce las funciones exclusivas</span>
                        </div>
                    </div>
                </div>
                <DialogFooter className="sm:justify-center">
                    <Button variant="outline" onClick={hideWelcome} className="w-full sm:w-auto">
                        Saltar
                    </Button>
                    <Button onClick={handleStart} className="w-full sm:w-auto bg-primary text-white">
                        {info.action}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/**
 * Controlador Lógico Principal
 * Se encarga de detectar cuándo lanzar el onboarding.
 */
export function OnboardingController() {
    const { pathname } = useLocation();
    const { user } = useAuth();
    const role = user?.user_metadata?.role || 'invitado';
    const {
        completedGuides,
        showWelcome,
        startGuide
    } = useOnboardingStore();

    useEffect(() => {
        // Lógica para lanzar guías automáticamente según la ruta
        const checkAndTrigger = (guideId, triggersWelcome = false) => {
            if (!completedGuides.includes(guideId)) {
                console.log(`[Onboarding] Triggering ${guideId} for role ${role}`);
                // Pequeño delay para asegurar carga de UI
                setTimeout(() => {
                    if (triggersWelcome) {
                        showWelcome();
                    } else {
                        startGuide(guideId);
                    }
                }, 1500); // Aumentado delay a 1.5s para asegurar render
            }
        };

        // 1. Home (Cliente o Invitado)
        if (pathname === '/' && (role === 'cliente' || role === 'invitado')) {
            checkAndTrigger('client_home', true);
        }

        // 2. Dashboard Tienda
        if (pathname.includes('/store-dashboard') && role === 'tienda') {
            checkAndTrigger('store_dashboard', true);
        }

        // 3. Dashboard Domiciliario
        if (pathname.includes('/delivery-dashboard') && role === 'domiciliario') {
            checkAndTrigger('delivery_dashboard', true);
        }

    }, [pathname, user, role, completedGuides]);

    return (
        <>
            <OnboardingWelcome />
            <OnboardingTour />
        </>
    );
}
