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
      // Redirigir llamadas de Axios (/api)
      '/api': {
        target: 'http://10.60.0.21:3000',
        changeOrigin: true,
        secure: false, // Ignorar certificados autofirmados si los hubiera
      },
      // Redirigir llamadas de Websockets (/socket.io)
      '/socket.io': {
        target: 'http://10.60.0.21:3000',
        ws: true,
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
