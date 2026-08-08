# Portfolio — Sven Sieber

Öffentliches Portfolio von **Sven Sieber** (UX/UI, Dashboards, Frontend, interaktive Demos).

**Live:** [https://portfolio-sven-sieber.vercel.app](https://portfolio-sven-sieber.vercel.app)

## Tech-Stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + TypeScript
- [React Router](https://reactrouter.com/)
- [Tailwind CSS](https://tailwindcss.com/) / DaisyUI
- [Supabase](https://supabase.com/) (Auth, Datenbank, Edge Functions)
- Deploy auf [Vercel](https://vercel.com/)

## Lokal starten

```bash
npm install
cp .env.example .env.local   # Werte lokal setzen — nie committen
npm run dev
```

Benötigte Umgebungsvariablen (Namen, keine Werte): siehe `.env.example`, u. a.

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- weitere optionale `VITE_*`- und Server-Variablen je nach Feature

Keine echten Secrets, Passwörter oder API-Keys in dieses Repo, in Issues oder in die README schreiben.

## Code & Umgebung schützen

Hier läuft eine **aktive Produktiv-Umgebung**. Bitte:

- **Keine Secrets committen** — `.env.local` und ähnliche Dateien bleiben privat und stehen in `.gitignore`
- **Keine Credentials** (Passwörter, Tokens, Login-Daten) in README, Issues, PRs oder Chat-Logs
- Repo-Sichtbarkeit und Deploy-Protection (z. B. Vercel) bei Bedarf einschränken; Zugangsdaten nur über den jeweiligen Provider verwalten
- Für lokale Entwicklung nur eigene Platzhalter-/Testwerte in `.env.local` verwenden

## Lizenz / Nutzung

Persönliches Portfolio-Projekt. Code und Inhalte gehören Sven Sieber, sofern nicht anders gekennzeichnet.
