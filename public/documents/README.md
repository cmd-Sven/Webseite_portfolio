# Lebenslauf (lokal, nicht in Git)

PDFs in diesem Ordner sind **gitignored** und gehören nicht ins öffentliche Repo.

Die Live-Landingpage nutzt **`/api/resume`**, das eine kurzlebige Signed URL
aus Supabase Storage (`portfolio-public/lebenslauf.pdf`) liefert.
Beim Admin-Upload des Master-Lebenslaufs wird dorthin gespiegelt.

Optional lokal (nur Dev / Fallback ohne API):

**`lebenslauf.pdf`** hier ablegen → erreichbar als `/documents/lebenslauf.pdf`
(wenn `/api/resume` nicht läuft, z. B. reines `vite` ohne `vercel dev`).
