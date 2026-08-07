import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), vue()],
  // Dev-Passwörter nie in Production-Bundles einbetten (auch wenn VITE_* gesetzt wäre).
  define:
    mode === 'production'
      ? {
          'import.meta.env.VITE_ADMIN_DEV_PASSWORD': JSON.stringify(''),
          'import.meta.env.VITE_MONITOR_DEV_PASSWORD': JSON.stringify(''),
        }
      : undefined,
}))
