import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendTarget = (env.VITE_DEV_BACKEND_URL || 'http://localhost:8000').replace(/\/+$/, '')

  return {
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          about: resolve(__dirname, 'about.html'),
          volunteer: resolve(__dirname, 'volunteer.html'),
          donate: resolve(__dirname, 'donate.html'),
          completedStory: resolve(__dirname, 'completed-story.html'),
          noindex: resolve(__dirname, 'noindex.html'),
        },
      },
    },
    server: {
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/media': {
          target: backendTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
