/** Shared HTML builders for A4 application PDFs (cover letter + CV). */

export type PdfCvExperience = {
  company: string
  role: string
  period?: string
  bullets?: string[]
}

export type PdfCvProject = {
  name: string
  description?: string
  tech?: string[]
}

export type PdfCvData = {
  tailored_headline?: string
  summary?: string
  highlighted_skills?: string[]
  experience?: PdfCvExperience[]
  projects?: PdfCvProject[]
}

export type PdfExportMode = 'complete' | 'cover_letter' | 'cv'

export type PdfDocumentInput = {
  company_name: string
  job_title: string
  cover_letter: string
  cv_data: PdfCvData
  candidate_name?: string
  candidate_email?: string
  /** default: complete (Anschreiben + Lebenslauf) */
  mode?: PdfExportMode
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function paragraphsHtml(text: string): string {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br />')}</p>`)
    .join('\n')
}

function listItems(items: string[]): string {
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join('\n')
}

function buildCoverSectionHtml(input: PdfDocumentInput, name: string): string {
  return `
  <section class="page cover">
    <header class="cover-meta">
      <p class="eyebrow">Anschreiben</p>
      <h1>${escapeHtml(input.job_title)}</h1>
      <p class="sub">${escapeHtml(input.company_name)} · ${escapeHtml(name)}</p>
    </header>
    <div class="cover-body">
      ${
        input.cover_letter.trim()
          ? paragraphsHtml(input.cover_letter)
          : '<p class="empty">Kein Anschreiben vorhanden.</p>'
      }
    </div>
  </section>`
}

function buildCvSectionHtml(
  input: PdfDocumentInput,
  name: string,
  email: string,
): string {
  const cv = input.cv_data ?? {}
  const skills = cv.highlighted_skills ?? []
  const experience = cv.experience ?? []
  const projects = cv.projects ?? []

  const experienceHtml = experience
    .map((exp) => {
      const bullets =
        exp.bullets && exp.bullets.length > 0
          ? `<ul class="bullets">${listItems(exp.bullets)}</ul>`
          : ''
      return `
        <article class="entry">
          <header>
            <h3>${escapeHtml(exp.role)}${exp.company ? ` · ${escapeHtml(exp.company)}` : ''}</h3>
            ${exp.period ? `<p class="meta">${escapeHtml(exp.period)}</p>` : ''}
          </header>
          ${bullets}
        </article>`
    })
    .join('\n')

  const projectsHtml = projects
    .map((project) => {
      const tech =
        project.tech && project.tech.length > 0
          ? `<p class="meta">${escapeHtml(project.tech.join(' · '))}</p>`
          : ''
      return `
        <article class="entry">
          <header>
            <h3>${escapeHtml(project.name)}</h3>
          </header>
          ${project.description ? `<p>${escapeHtml(project.description)}</p>` : ''}
          ${tech}
        </article>`
    })
    .join('\n')

  return `
  <section class="page">
    <div class="cv-grid">
      <aside class="sidebar">
        <div>
          <p class="name">${escapeHtml(name)}</p>
          ${email ? `<p class="contact">${escapeHtml(email)}</p>` : ''}
        </div>
        <div>
          <h2>Zielrolle</h2>
          <p>${escapeHtml(input.job_title)}</p>
          <p class="meta">${escapeHtml(input.company_name)}</p>
        </div>
        <div>
          <h2>Skills</h2>
          ${
            skills.length > 0
              ? `<ul class="skill-list">${listItems(skills)}</ul>`
              : '<p class="empty">—</p>'
          }
        </div>
      </aside>
      <main class="main">
        <header>
          <h1 class="headline">${escapeHtml(cv.tailored_headline || input.job_title)}</h1>
          ${cv.summary ? `<p>${escapeHtml(cv.summary)}</p>` : ''}
        </header>
        <section>
          <h2 class="section-title">Erfahrung</h2>
          ${experienceHtml || '<p class="empty">Keine Stationen.</p>'}
        </section>
        <section>
          <h2 class="section-title">Projekte</h2>
          ${projectsHtml || '<p class="empty">Keine Projekte.</p>'}
        </section>
      </main>
    </div>
  </section>`
}

export function buildApplicationPdfHtml(input: PdfDocumentInput): string {
  const name = input.candidate_name?.trim() || 'Bewerber'
  const email = input.candidate_email?.trim() || ''
  const mode: PdfExportMode = input.mode || 'complete'
  const includeCover = mode === 'complete' || mode === 'cover_letter'
  const includeCv = mode === 'complete' || mode === 'cv'

  const titlePrefix =
    mode === 'cover_letter' ? 'Anschreiben' : mode === 'cv' ? 'Lebenslauf' : 'Bewerbung'

  const bodySections = [
    includeCover ? buildCoverSectionHtml(input, name) : '',
    includeCv ? buildCvSectionHtml(input, name, email) : '',
  ]
    .filter(Boolean)
    .join('\n')

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <title>${titlePrefix} – ${escapeHtml(input.job_title)}</title>
  <style>
    @page {
      size: A4;
      margin: 14mm 12mm;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #18181b;
      font-family: "IBM Plex Sans", "Segoe UI", Helvetica, Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.45;
      background: #fff;
    }
    h1, h2, h3 {
      margin: 0;
      font-weight: 600;
      letter-spacing: -0.01em;
    }
    p { margin: 0 0 0.65em; }
    .page {
      page-break-after: always;
      min-height: 260mm;
    }
    .page:last-child { page-break-after: auto; }
    .cover {
      display: flex;
      flex-direction: column;
      gap: 18mm;
      padding-top: 8mm;
    }
    .cover-meta {
      border-bottom: 1px solid #d4d4d8;
      padding-bottom: 8mm;
    }
    .cover-meta .eyebrow {
      font-size: 8.5pt;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: #71717a;
      margin-bottom: 4mm;
    }
    .cover-meta h1 {
      font-size: 18pt;
      margin-bottom: 2mm;
    }
    .cover-meta .sub {
      color: #52525b;
      font-size: 11pt;
    }
    .cover-body p {
      text-align: justify;
      max-width: 165mm;
    }
    .cv-grid {
      display: grid;
      grid-template-columns: 58mm 1fr;
      gap: 8mm;
      min-height: 260mm;
    }
    .sidebar {
      background: #f4f4f5;
      padding: 8mm 6mm;
      display: flex;
      flex-direction: column;
      gap: 7mm;
    }
    .sidebar h2 {
      font-size: 8.5pt;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: #71717a;
      margin-bottom: 2.5mm;
    }
    .sidebar .name {
      font-size: 14pt;
      line-height: 1.2;
    }
    .sidebar .contact {
      color: #3f3f46;
      font-size: 9pt;
      word-break: break-word;
    }
    .skill-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 1.5mm;
    }
    .skill-list li {
      font-size: 9.5pt;
      color: #27272a;
      padding-left: 3mm;
      border-left: 2px solid #a1a1aa;
    }
    .main {
      padding: 6mm 2mm 6mm 0;
      display: flex;
      flex-direction: column;
      gap: 6mm;
    }
    .main .headline {
      font-size: 15pt;
      margin-bottom: 2mm;
    }
    .section-title {
      font-size: 8.5pt;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: #71717a;
      border-bottom: 1px solid #e4e4e7;
      padding-bottom: 2mm;
      margin-bottom: 3mm;
    }
    .entry + .entry { margin-top: 4mm; }
    .entry h3 {
      font-size: 11pt;
    }
    .meta {
      color: #71717a;
      font-size: 9pt;
      margin: 0.5mm 0 1.5mm;
    }
    .bullets {
      margin: 0;
      padding-left: 4.5mm;
    }
    .bullets li { margin-bottom: 1mm; }
    .empty {
      color: #a1a1aa;
      font-style: italic;
    }
  </style>
</head>
<body>
${bodySections}
</body>
</html>`
}

export function pdfFilenameForMode(companyName: string, mode: PdfExportMode): string {
  const safeCompany = companyName.replace(/[^\w\-äöüÄÖÜß]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'PDF'
  const prefix =
    mode === 'cover_letter' ? 'Anschreiben' : mode === 'cv' ? 'Lebenslauf' : 'Bewerbung'
  return `${prefix}-${safeCompany}.pdf`
}
