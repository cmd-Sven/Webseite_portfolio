import { existsSync } from 'node:fs'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'
import { createClient } from '@supabase/supabase-js'
import {
  buildApplicationPdfHtml,
  pdfFilenameForMode,
  type PdfCvData,
  type PdfDocumentInput,
  type PdfExportMode,
} from './_lib/pdfTemplate'

export const config = {
  maxDuration: 60,
  memory: 1024,
}

const VALID_MODES: PdfExportMode[] = ['complete', 'cover_letter', 'cv']

type RequestBody = {
  company_name?: string
  job_title?: string
  cover_letter?: string
  cv_data?: PdfCvData
  candidate_name?: string
  candidate_email?: string
  /** complete | cover_letter | cv — default complete */
  mode?: string
}

function parseMode(value: unknown): PdfExportMode {
  if (typeof value === 'string' && VALID_MODES.includes(value as PdfExportMode)) {
    return value as PdfExportMode
  }
  return 'complete'
}

function hasCvContent(cv: PdfCvData): boolean {
  return Boolean(
    cv.tailored_headline?.trim() ||
      cv.summary?.trim() ||
      (cv.highlighted_skills && cv.highlighted_skills.length > 0) ||
      (cv.experience && cv.experience.length > 0) ||
      (cv.projects && cv.projects.length > 0),
  )
}

function localChromePath(): string | undefined {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
  ].filter(Boolean) as string[]

  return candidates.find((path) => existsSync(path))
}

async function launchBrowser() {
  const isServerless = Boolean(
    process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION,
  )

  if (isServerless) {
    return puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 794, height: 1123 },
      executablePath: await chromium.executablePath(),
      headless: true,
    })
  }

  const executablePath = localChromePath() || (await chromium.executablePath())
  return puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
    defaultViewport: { width: 794, height: 1123 },
    executablePath,
    headless: true,
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type')
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Nur POST erlaubt' })
  }

  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Nicht authentifiziert' })
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const supabaseAnonKey =
      process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({ error: 'Supabase-Umgebung fehlt' })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const token = authHeader.replace(/^Bearer\s+/i, '')
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return res.status(401).json({ error: 'Ungültige Session' })
    }

    // Fail-closed: nur Admin (JWT app_metadata.role oder konfigurierte Admin-E-Mail).
    const jwtRole = String(user.app_metadata?.role ?? '')
      .trim()
      .toLowerCase()
    const adminEmail = (process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || '')
      .trim()
      .toLowerCase()
    const userEmail = (user.email || '').toLowerCase()
    const isAdmin =
      jwtRole === 'admin' || (Boolean(adminEmail) && userEmail === adminEmail)
    if (!isAdmin) {
      return res.status(403).json({ error: 'Kein Admin-Zugriff' })
    }

    const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as RequestBody
    const mode = parseMode(body.mode)

    const input: PdfDocumentInput = {
      company_name: (body.company_name || '').trim() || 'Unternehmen',
      job_title: (body.job_title || '').trim() || 'Stelle',
      cover_letter: body.cover_letter || '',
      cv_data: body.cv_data || {},
      candidate_name: body.candidate_name?.trim() || user.email?.split('@')[0] || 'Bewerber',
      candidate_email: body.candidate_email?.trim() || user.email || undefined,
      mode,
    }

    const hasCover = Boolean(input.cover_letter.trim())
    const hasCv = hasCvContent(input.cv_data)

    if (mode === 'cover_letter' && !hasCover) {
      return res.status(400).json({ error: 'Kein Anschreiben zum Export' })
    }
    if (mode === 'cv' && !hasCv) {
      return res.status(400).json({ error: 'Kein Lebenslauf-Inhalt zum Export' })
    }
    if (mode === 'complete' && !hasCover && !hasCv) {
      return res.status(400).json({ error: 'Kein Dokumentinhalt zum Export' })
    }

    const html = buildApplicationPdfHtml(input)
    const browser = await launchBrowser()

    try {
      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'load' })
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
      })

      const filename = pdfFilenameForMode(input.company_name, mode)

      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      res.setHeader('Cache-Control', 'no-store')
      return res.status(200).send(Buffer.from(pdf))
    } finally {
      await browser.close()
    }
  } catch (error) {
    console.error('generate-pdf failed:', error)
    const message = error instanceof Error ? error.message : 'PDF-Generierung fehlgeschlagen'
    return res.status(500).json({ error: message })
  }
}
