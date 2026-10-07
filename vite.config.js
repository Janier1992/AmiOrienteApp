import path from 'node:path';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite';

export default defineConfig({
	base: './', // Relative base for flexible deployment
	plugins: [
		react(),
		VitePWA({
			registerType: 'autoUpdate',
			injectRegister: 'auto',
			includeAssets: ['logo.png'], // Include the logo
			manifest: {
				name: 'AmiOriente - Servicios', // Shorter name
				short_name: 'AmiOriente',
				id: 'amioriente-app-v1', // Updated ID
				description: 'La plataforma integral de servicios, domicilios y turismo en el Oriente Antioqueño.',
				theme_color: '#16a34a',
				background_color: '#ffffff',
				display: 'standalone',
				orientation: 'portrait',
				scope: '/',
				start_url: '/',
				categories: ['shopping', 'food', 'travel', 'lifestyle'],
				icons: [
					{
						src: '/logo.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'any'
					},
					{
						src: '/logo.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any maskable'
					},
					{
						src: '/logo.png',
						sizes: '180x180',
						type: 'image/png',
						purpose: 'any'
					}
				],
				screenshots: [
					{
						src: 'https://horizons-cdn.hostinger.com/9a2f1d5f-26c5-4fa8-b3e7-17e2b7bc86a9/eaa5c3ede657a14fb3f5ca74349a2d50.jpg',
						sizes: '2070x1380',
						type: 'image/jpeg',
						form_factor: 'wide',
						label: 'Vista Panorámica de Dashboard'
					},
					{
						src: 'https://horizons-cdn.hostinger.com/9a2f1d5f-26c5-4fa8-b3e7-17e2b7bc86a9/eaa5c3ede657a14fb3f5ca74349a2d50.jpg',
						sizes: '2070x1380',
						type: 'image/jpeg',
						form_factor: 'narrow',
						label: 'Vista Móvil'
					}
				]
			},
			workbox: {
				// Precache all JS, CSS, HTML, and JSON files
				globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg,woff,woff2,json}'],

				// Runtime caching strategies
				runtimeCaching: [
					// Cache API calls with Network First strategy
					{
						urlPattern: /^https:\/\/.*supabase\.co\/rest\/v1\/.*/i,
						handler: 'NetworkFirst',
						options: {
							cacheName: 'supabase-api-cache',
							networkTimeoutSeconds: 10,
							expiration: {
								maxEntries: 100,
								maxAgeSeconds: 60 * 5 // 5 minutes
							},
							cacheableResponse: {
								statuses: [0, 200]
							}
						}
					},
					// Cache images with Cache First strategy
					{
						urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'images-cache',
							expiration: {
								maxEntries: 200,
								maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
							},
							cacheableResponse: {
								statuses: [0, 200]
							}
						}
					},
					// Cache external images (CDN)
					{
						urlPattern: /^https:\/\/horizons-cdn\.hostinger\.com\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'cdn-images-cache',
							expiration: {
								maxEntries: 100,
								maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
							},
							cacheableResponse: {
								statuses: [0, 200]
							}
						}
					},
					// Cache Google Fonts
					{
						urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'google-fonts-cache',
							expiration: {
								maxEntries: 30,
								maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
							},
							cacheableResponse: {
								statuses: [0, 200]
							}
						}
					},
					{
						urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'google-fonts-files-cache',
							expiration: {
								maxEntries: 30,
								maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
							},
							cacheableResponse: {
								statuses: [0, 200]
							}
						}
					}
				],
				// Skip waiting for new service worker
				skipWaiting: true,
				clientsClaim: true
			},
			devOptions: {
				enabled: true, // Habilitar en desarrollo para pruebas
				type: 'module'
			}
		})
	],
	server: {
		cors: true,
		headers: {
			'Cross-Origin-Embedder-Policy': 'credentialless',
		},
		allowedHosts: true,
	},
	build: {
		rollupOptions: {
			output: {
				// Separa dependencias estables para que el navegador las cachee entre despliegues
				manualChunks: {
					'vendor-react': ['react', 'react-dom', 'react-router-dom'],
					'vendor-supabase': ['@supabase/supabase-js'],
					'vendor-motion': ['framer-motion'],
				},
			},
		},
	},
	resolve: {
		extensions: ['.jsx', '.js', '.tsx', '.ts', '.json',],
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	}
});
