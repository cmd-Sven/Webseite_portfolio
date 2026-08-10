/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_ADMIN_EMAIL: string
  /** Öffentliche Site-URL für Bookmarklets (Fallback: portfolio-sven-sieber.vercel.app). */
  readonly VITE_PUBLIC_SITE_URL?: string
  /** Monitor-Zugang (Caro); Default caro@sven-sieber.de. */
  readonly VITE_MONITOR_EMAIL?: string
  /** Nur lokal (Dev) — nie in Production setzen/committen. */
  readonly VITE_ADMIN_DEV_PASSWORD?: string
  /** Nur lokal (Dev) — Monitor-Passwort, nie committen. */
  readonly VITE_MONITOR_DEV_PASSWORD?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
