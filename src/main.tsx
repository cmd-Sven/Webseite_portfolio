import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import './index.css'
import App from './App.tsx'

// Einmalig beim Boot — nicht bei jedem Render. Hallo, neugieriger Dev 👋
console.log(
  "🕵️‍♂️ Detektiv-Modus aktiv! Danke, dass du dir den Code anschaust. Wenn dir ein Bug auffällt, ist das kein Fehler, sondern ein ‚ungewöhnliches Feature‘.",
)
console.log(
  '🚀 Systemstatus: Entwickler läuft stabil auf Koffein. Keine Hamster wurden bei der Erstellung verletzt.',
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
