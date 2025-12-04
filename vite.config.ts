import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Usar rutas relativas para Electron
  define: {
    'process.env': {},
    'process': {
      env: {}
    }
  },
  build: {
    rollupOptions: {
      external: ['googleapis', 'electron']
    }
  }
})
