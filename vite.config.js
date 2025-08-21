import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(() => {
  // 👇 Legge la variabile d'ambiente o usa fallback
  const basePath = process.env.VITE_BASE_PATH || '/'

  return {
    base: basePath,   // 👈 fondamentale per gli asset
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icons/apple-touch-icon.png', 'vite.svg'],
        manifest: {
          name: 'Roby Club',
          short_name: 'RobyClub',
          description: 'Roby Club - Gestione corsi e pagamenti',
          // 👇 entrambi con basePath per funzionare in sottocartella
          start_url: `${basePath}`,
          scope: `${basePath}`,
          display: 'standalone',
          theme_color: '#4f46e5',
          background_color: '#000000',
          orientation: 'portrait-primary',
          icons: [
            { src: `${basePath}icons/pwa-192.png`, sizes: '192x192', type: 'image/png' },
            { src: `${basePath}icons/pwa-512.png`, sizes: '512x512', type: 'image/png' },
            { src: `${basePath}icons/pwa-maskable-192.png`, sizes: '192x192', type: 'image/png', purpose: 'maskable' },
            { src: `${basePath}icons/pwa-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' }
          ]
        },
        workbox: {
          skipWaiting: true,      // 👈 forza update immediato
    clientsClaim: true,     // 👈 prende controllo delle schede aperte
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.destination === 'document',
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'pages-cache' }
            },
            {
              urlPattern: ({ url }) => url.origin === self.location.origin,
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'same-origin-cache' }
            },
            {
              urlPattern: ({ url }) => url.hostname.includes('supabase.co'),
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'supabase-api-cache',
                expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 }
              }
            },
            {
              urlPattern: ({ request }) => request.destination === 'image',
              handler: 'CacheFirst',
              options: {
                cacheName: 'images-cache',
                expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }
              }
            }
          ]
        }
      })
    ],
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom']
          }
        }
      }
    }
  }
})
