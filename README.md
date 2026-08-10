# Portfolio — Sven Sieber

Persönliches, **privates** Portfolio-Projekt von **Sven Sieber** (UX/UI, Dashboards, Frontend, interaktive Demos).

**Live (öffentliche Ansicht):** [https://portfolio-sven-sieber.vercel.app](https://portfolio-sven-sieber.vercel.app)

Der Quellcode kann auf GitHub einsehbar sein — das ändert nichts daran, dass es ein privates Projekt mit geschütztem Backend ist.

## Was öffentlich ist — und was nicht

| Sichtbar | Geschützt |
| --- | --- |
| Öffentliches Portfolio (Projekte, Texte, Demos) | Runtime-Daten in der Datenbank |
| Frontend-Quellcode im Repo | Admin-Bereich (Login + Auth erforderlich) |
| Öffentliche Assets unter `/public` | Inhalte hinter Auth / Row Level Security |

- **Datenbankdaten sind nicht kopierbar** aus diesem Repo. Schema-Migrationen ohne Produktivdaten ≠ Export deiner Live-Daten.
- Der **Adminbereich ist für Außenstehende nicht einsehbar**. Ohne gültige Session gibt es keinen Zugang; sensible Inhalte (u. a. interne Workflows) sind nicht Teil der öffentlichen Portfolio-Ansicht.
- Recruiter und Unternehmen, die den Code anschauen: bitte erwarten **keine** einsehbaren Bewerbungs- oder Admin-Daten. Auth, RLS und Deploy-Schutz halten Runtime-Daten getrennt vom öffentlichen Frontend.

## Tech-Stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + TypeScript
- [React Router](https://reactrouter.com/)
- [Tailwind CSS](https://tailwindcss.com/) / DaisyUI
- [Supabase](https://supabase.com/) (Auth, Datenbank, Edge Functions) — geschützt per Policies
- Deploy auf [Vercel](https://vercel.com/)

## Lokal starten

```bash
npm install
cp .env.example .env.local   # eigene Platzhalter — nie committen
npm run dev
```

Umgebungsvariablen: Namen und Hinweise in `.env.example` (u. a. `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). **Keine echten Secrets, Passwörter oder Login-Daten** in Repo, Issues, PRs oder in diese README schreiben.

## Schutz & Nutzung

- Privates Projekt; Code und Inhalte gehören Sven Sieber, sofern nicht anders gekennzeichnet.
- `.env.local` und ähnliche Dateien bleiben privat (`.gitignore`).
- Produktiv-Umgebung: Zugangsdaten nur über den jeweiligen Provider; keine Credentials hier dokumentieren.
- Source sichtbar ≠ Daten sichtbar. Öffentliches Portfolio ja; Admin und DB-Inhalte nein.
