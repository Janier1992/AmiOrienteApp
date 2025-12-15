
import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { X, Download, Share, PlusSquare, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export const PWAInstallPrompt = () => {
  const { isInstallable, isIOS, isStandalone, promptInstall } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if user dismissed recently (within 3 days)
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const oneMinute = 60 * 1000; // 1 minute for testing purposes
      if (Date.now() - dismissedTime < oneMinute) {
        return; // Don't show - dismissed recently
      }
    }

    // Show prompt after 2 seconds if not installed
    let timeout;
    if ((isInstallable || (isIOS && !isStandalone)) && !isStandalone) {
      timeout = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
    }
    return () => clearTimeout(timeout);
  }, [isInstallable, isIOS, isStandalone]);

  const handleInstallClick = () => {
    if (isIOS) {
      setShowIOSInstructions(true);
    } else {
      promptInstall();
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Save dismissal to localStorage to suppress for 3 days
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (isStandalone) return null;
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Mobile/Desktop Banner - Fixed at Top or Bottom */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className={cn(
              "fixed z-[100] left-4 right-4 md:left-auto md:right-4 md:w-96", // Higher Z-index
              "bottom-4 safe-area-bottom", // Standard bottom spacing
              "bg-white dark:bg-slate-900 border border-green-500/20 shadow-2xl p-4", // Added border highlight
              "rounded-xl backdrop-blur-sm",
              "flex flex-col gap-3"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center shrink-0">
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/3081/3081559.png"
                    alt="App Icon"
                    className="h-8 w-8 object-contain"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">
                    Instalar App MiOriente
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-tight mt-1">
                    Instala nuestra app para acceso más rápido y uso sin internet.
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {showIOSInstructions ? (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-sm space-y-2 animate-in fade-in slide-in-from-top-2">
                <p className="font-medium text-slate-900 dark:text-slate-200">Para instalar en iOS:</p>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <span className="bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border shadow-sm"><Share className="h-3 w-3 inline" /></span>
                  <span>1. Toca el botón <strong>Compartir</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <span className="bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border shadow-sm"><PlusSquare className="h-3 w-3 inline" /></span>
                  <span>2. Selecciona <strong>"Agregar al Inicio"</strong></span>
                </div>
              </div>
            ) : (
              <Button
                onClick={handleInstallClick}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg shadow-green-600/20"
              >
                <Download className="mr-2 h-4 w-4" />
                Instalar Ahora
              </Button>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
