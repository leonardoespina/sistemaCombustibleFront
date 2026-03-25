// FILE: vite.config.js

import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: true, // Permite conexiones desde la red
    proxy: {
      // Proxy para llamadas HTTP de Axios (rutas /api/...)
      // El target define hacia dónde se redirigen las peticiones durante el desarrollo.
      // - Desarrollo local:  'http://localhost:3000'
      // - Desarrollo en red: 'http://10.60.0.21:3000'  (IP del servidor backend en la red)
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false, // Ignorar certificados autofirmados si los hubiera
      },
      // Proxy para conexiones WebSocket de Socket.IO
      // Debe apuntar al mismo host que /api para mantener consistencia.
      // - Desarrollo local:  'http://localhost:3000'
      // - Desarrollo en red: 'http://10.60.0.21:3000'
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,          // Habilita el soporte para WebSocket
        changeOrigin: true
      }
    }
  },
  plugins: [
    vue({
      template: { transformAssetUrls }
    }),

    // @quasar/plugin-vite options list:
    // https://github.com/quasarframework/quasar/blob/dev/vite-plugin/index.d.ts
    quasar({
      sassVariables: fileURLToPath(
        new URL('./src/quasar-variables.sass', import.meta.url)
      )
    })
  ]
})
