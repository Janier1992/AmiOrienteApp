/**
 * Utilidades para el manejo de Progressive Web App (PWA)
 * Encapsula la lógica de registro de Service Worker y debugging
 */

const DEBUG_PWA = true;

/**
 * Loguea mensajes con estilo si el modo debug está activo
 * @param {string} msg - Mensaje principal
 * @param {any} data - Datos adicionales opcionales
 */
const logPWA = (msg, data = '') => {
    if (DEBUG_PWA) {
        console.log(
            `%c📱 PWA: ${msg}`,
            'background: #16a34a; color: white; padding: 2px 5px; border-radius: 2px;',
            data
        );
    }
};

/**
 * Verifica la disponibilidad y tipo de contenido del Manifest
 */
export const checkManifest = () => {
    if (DEBUG_PWA) {
        fetch('/manifest.json')
            .then(res => {
                logPWA(`Manifest HTTP Status: ${res.status}`);
                const contentType = res.headers.get("content-type");
                logPWA(`Manifest Content-Type: ${contentType}`);

                if (!res.ok) {
                    console.error('❌ Manifest not reachable!');
                    return null;
                }
                if (contentType && contentType.includes('text/html')) {
                    console.error('❌ Manifest returned HTML instead of JSON! File is likely missing from build.');
                    return null;
                }
                return res.json();
            })
            .then(data => {
                if (data) logPWA('Manifest loaded successfully', data);
            })
            .catch(err => console.error('❌ Manifest fetch failed:', err));
    }
};

/**
 * Registra el Service Worker de la aplicación
 */
export const registerServiceWorker = () => {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            // We strictly use ./sw.js to match the file in public/
            navigator.serviceWorker.register('./sw.js', { scope: './' })
                .then(registration => {
                    logPWA('ServiceWorker registered ✅', { scope: registration.scope });

                    registration.onupdatefound = () => {
                        const installingWorker = registration.installing;
                        if (installingWorker == null) return;

                        installingWorker.onstatechange = () => {
                            if (installingWorker.state === 'installed') {
                                if (navigator.serviceWorker.controller) {
                                    logPWA('New content available - Refresh to update 🔄');
                                } else {
                                    logPWA('Content cached for offline use ✅');
                                }
                            }
                        };
                    };
                })
                .catch(error => {
                    console.error('❌ ServiceWorker registration failed:', error);

                    // Detailed error logging
                    if (error.message.includes('MIME')) {
                        console.error('❌ MIME type error: The server returned HTML instead of JS. The sw.js file is missing from the build output.');
                    }
                });
        });
    } else {
        console.warn('⚠️ Service Worker not supported in this browser');
    }
};
