import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

const JSON_SCHEMA_RULES = `Antworte AUSSCHLIESSLICH mit gültigem JSON (kein Markdown) in dieser Form:
{
  "cover_letter": "string (vollständiges Anschreiben, Absätze mit \\n\\n)",
  "cv_data": {
    "tailored_headline": "string",
    "summary": "string",
    "highlighted_skills": ["string"],
    "experience": [
      {
        "company": "string",
        "role": "string",
        "period": "string",
        "bullets": ["string"]
      }
    ],
    "projects": [
      {
        "name": "string",
        "description": "string",
        "tech": ["string"]
      }
    ]
  }
}

Gemeinsame Regeln:
- Beziehe dich auf echte Angaben aus Master-Profil, Pool-Feldern und ggf. geladenen Seiteninhalten.
- Betone passende Skills; erfinde keine Arbeitgeber, Titel oder Abschlüsse.
- Anschreiben: 3–5 kurze Absätze, Anrede „Sehr geehrte Damen und Herren,“ falls kein Name bekannt.
- CV: priorisiere relevante Stationen/Projekte, max. 4 Experience-Einträge, max. 3 Projekte, max. 10 highlighted_skills.
- Keine generischen KI-Floskeln („leidenschaftlich“, „dynamisches Umfeld“, „Synergien“, „hochmotiviert“).
- Sprache: Deutsch.`

const SYSTEM_PROMPT_REGULAR = `Du bist ein Assistent für maßgeschneiderte Bewerbungsunterlagen auf Deutsch.
Kontext: REGULÄRE Bewerbung auf eine AUSGESCHRIEBENE Stelle.

Ton und Inhalt:
- Beziehe dich klar auf die Anforderungen und Formulierungen der Stellenanzeige.
- Zeige Passung zu must-/nice-Skills und konkreten Aufgaben.
- Formuliere als Antwort auf die Ausschreibung (nicht als Blind-/Initiativbewerbung).
- Nutze geladene Seiteninhalte (Karriere-/Unternehmensseite) nur zur Präzisierung, nicht als Hauptquelle statt der Anzeige.

${JSON_SCHEMA_RULES}`

const SYSTEM_PROMPT_INITIATIVE = `Du bist ein Assistent für maßgeschneiderte Bewerbungsunterlagen auf Deutsch.
Kontext: INITIATIVBEWERBUNG auf eine PRAKTIKUMSSTELLE (oft Pflichtpraktikum / WBS-Rahmen).

Ton und Inhalt:
- Kein „Antwort auf Ausschreibung“-Ton: es gibt typischerweise keine konkrete Stellenanzeige.
- Stelle klar den Mehrwert für das Unternehmen heraus (was der Bewerber konkret beitragen kann).
- Nutze Unternehmensinformationen, Zielbereich-Notizen, Kontaktnotizen und geladene Unternehmens-/Karriereseiten.
- Wenn WBS/Pflichtpraktikum erwähnt ist: Rahmen (Ausbildung, Praktikumsziel) sachlich einbinden, ohne bürokratisch zu wirken.
- Formuliere als proaktive Initiativbewerbung für ein Praktikum / einen Einstieg.

${JSON_SCHEMA_RULES}`

const FETCH_TIMEOUT_MS = 8_000
const MAX_PAGE_CHARS = 4_000
const MAX_TOTAL_FETCHED_CHARS = 12_000
const MAX_URLS = 5

type ApplicationType = "regular" | "initiative"

type JobPoolLink = {
  label?: string
  url: string
}

type PoolContext = {
  application_type?: ApplicationType
  title?: string | null
  company_name?: string | null
  source_url?: string | null
  links?: JobPoolLink[] | null
  notes?: string | null
  job_description?: string | null
  company_info?: string | null
  target_notes?: string | null
  wbs_certificate_path?: string | null
}

type RequestBody = {
  application_id?: string
  tone?: number
  application_type?: ApplicationType
  pool?: PoolContext | null
}

type GeneratedCvData = {
  tailored_headline?: string
  summary?: string
  highlighted_skills?: string[]
  experience?: Array<{
    company: string
    role: string
    period?: string
    bullets?: string[]
  }>
  projects?: Array<{
    name: string
    description?: string
    tech?: string[]
  }>
}

type GeneratedPayload = {
  cover_letter: string
  cv_data: GeneratedCvData
}

type FetchedPage = {
  url: string
  label?: string
  text: string
  error?: string
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
    if (fenced?.[1]) {
      return JSON.parse(fenced[1].trim())
    }
    const start = trimmed.indexOf("{")
    const end = trimmed.lastIndexOf("}")
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1))
    }
    throw new Error("Kein JSON im Modell-Output gefunden")
  }
}

function clampTone(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(n)) return 60
  return Math.min(100, Math.max(0, Math.round(n)))
}

function toneDescription(tone: number): string {
  if (tone <= 20) {
    return "locker, nahbar, klare Alltagssprache, trotzdem respektvoll"
  }
  if (tone <= 40) {
    return "locker-professionell, freundlich und konkret"
  }
  if (tone <= 60) {
    return "ausgewogen: professionell, aber ohne steifen Amtsstil"
  }
  if (tone <= 80) {
    return "professionell, präzise, zurückhaltend"
  }
  return "formell und distanziert, klassisches Bewerbungsschreiben"
}

function normalizeApplicationType(value: unknown): ApplicationType {
  return value === "initiative" ? "initiative" : "regular"
}

function normalizeLinks(raw: unknown): JobPoolLink[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null
      const url =
        typeof (item as { url?: unknown }).url === "string"
          ? (item as { url: string }).url.trim()
          : ""
      if (!url) return null
      const label =
        typeof (item as { label?: unknown }).label === "string"
          ? (item as { label: string }).label.trim()
          : undefined
      return { url, ...(label ? { label } : {}) }
    })
    .filter((item): item is JobPoolLink => item != null)
}

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value)
    return u.protocol === "http:" || u.protocol === "https:"
  } catch {
    return false
  }
}

function stripHtmlToText(html: string): string {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
  text = text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
  return text
}

async function fetchPageText(
  url: string,
  label?: string,
): Promise<FetchedPage> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (compatible; PortfolioATS/1.0; +https://supabase.com)",
      },
    })
    if (!res.ok) {
      return { url, label, text: "", error: `HTTP ${res.status}` }
    }
    const contentType = res.headers.get("content-type") ?? ""
    if (
      contentType &&
      !/text\/html|text\/plain|application\/xhtml/i.test(contentType)
    ) {
      return {
        url,
        label,
        text: "",
        error: `Nicht-Text Content-Type: ${contentType}`,
      }
    }
    const raw = await res.text()
    const text = stripHtmlToText(raw).slice(0, MAX_PAGE_CHARS)
    if (!text) {
      return { url, label, text: "", error: "Leerer Seiteninhalt" }
    }
    return { url, label, text }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fetch fehlgeschlagen"
    return { url, label, text: "", error: message }
  } finally {
    clearTimeout(timer)
  }
}

function collectUrls(pool: PoolContext | null): Array<{ url: string; label?: string }> {
  const out: Array<{ url: string; label?: string }> = []
  const seen = new Set<string>()

  const push = (url: string, label?: string) => {
    const trimmed = url.trim()
    if (!isHttpUrl(trimmed)) return
    const key = trimmed.replace(/\/$/, "").toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    out.push({ url: trimmed, ...(label ? { label } : {}) })
  }

  if (pool?.source_url) push(pool.source_url, "source_url")
  for (const link of normalizeLinks(pool?.links)) {
    push(link.url, link.label || "link")
  }

  return out.slice(0, MAX_URLS)
}

async function fetchLinkedPages(
  pool: PoolContext | null,
): Promise<FetchedPage[]> {
  const urls = collectUrls(pool)
  if (urls.length === 0) return []

  const pages = await Promise.all(
    urls.map(({ url, label }) => fetchPageText(url, label)),
  )

  let total = 0
  const capped: FetchedPage[] = []
  for (const page of pages) {
    if (!page.text) {
      capped.push(page)
      continue
    }
    const remaining = MAX_TOTAL_FETCHED_CHARS - total
    if (remaining <= 0) {
      capped.push({
        ...page,
        text: "",
        error: page.error || "Längen-Limit erreicht",
      })
      continue
    }
    const text = page.text.slice(0, remaining)
    total += text.length
    capped.push({ ...page, text })
  }
  return capped
}

function normalizeGenerated(raw: unknown): GeneratedPayload {
  if (!raw || typeof raw !== "object") {
    throw new Error("Ungültiges Generierungs-Ergebnis")
  }
  const obj = raw as Record<string, unknown>
  const cover =
    typeof obj.cover_letter === "string" ? obj.cover_letter.trim() : ""
  if (cover.length < 80) {
    throw new Error("Anschreiben zu kurz oder fehlt")
  }

  const cvRaw =
    obj.cv_data && typeof obj.cv_data === "object"
      ? (obj.cv_data as Record<string, unknown>)
      : {}

  const asStringArray = (v: unknown): string[] =>
    Array.isArray(v)
      ? v
        .filter((x): x is string => typeof x === "string")
        .map((s) => s.trim())
        .filter(Boolean)
      : []

  const experience = Array.isArray(cvRaw.experience)
    ? cvRaw.experience
      .filter((e): e is Record<string, unknown> => !!e && typeof e === "object")
      .map((e) => ({
        company: typeof e.company === "string" ? e.company : "",
        role: typeof e.role === "string" ? e.role : "",
        period: typeof e.period === "string" ? e.period : "",
        bullets: asStringArray(e.bullets),
      }))
      .filter((e) => e.company || e.role)
      .slice(0, 4)
    : []

  const projects = Array.isArray(cvRaw.projects)
    ? cvRaw.projects
      .filter((p): p is Record<string, unknown> => !!p && typeof p === "object")
      .map((p) => ({
        name: typeof p.name === "string" ? p.name : "",
        description: typeof p.description === "string" ? p.description : "",
        tech: asStringArray(p.tech),
      }))
      .filter((p) => p.name)
      .slice(0, 3)
    : []

  return {
    cover_letter: cover,
    cv_data: {
      tailored_headline:
        typeof cvRaw.tailored_headline === "string"
          ? cvRaw.tailored_headline.trim()
          : "",
      summary: typeof cvRaw.summary === "string" ? cvRaw.summary.trim() : "",
      highlighted_skills: asStringArray(cvRaw.highlighted_skills).slice(0, 10),
      experience,
      projects,
    },
  }
}

function mergePoolContext(
  fromBody: PoolContext | null | undefined,
  fromDb: Record<string, unknown> | null,
): PoolContext | null {
  if (!fromBody && !fromDb) return null
  const db: PoolContext = fromDb
    ? {
      application_type: normalizeApplicationType(fromDb.application_type),
      title: typeof fromDb.title === "string" ? fromDb.title : null,
      company_name:
        typeof fromDb.company_name === "string" ? fromDb.company_name : null,
      source_url:
        typeof fromDb.source_url === "string" ? fromDb.source_url : null,
      links: normalizeLinks(fromDb.links),
      notes: typeof fromDb.notes === "string" ? fromDb.notes : null,
      job_description:
        typeof fromDb.job_description === "string"
          ? fromDb.job_description
          : null,
      company_info:
        typeof fromDb.company_info === "string" ? fromDb.company_info : null,
      target_notes:
        typeof fromDb.target_notes === "string" ? fromDb.target_notes : null,
      wbs_certificate_path:
        typeof fromDb.wbs_certificate_path === "string"
          ? fromDb.wbs_certificate_path
          : null,
    }
    : {}

  const body = fromBody ?? {}
  return {
    application_type: normalizeApplicationType(
      body.application_type ?? db.application_type,
    ),
    title: body.title ?? db.title ?? null,
    company_name: body.company_name ?? db.company_name ?? null,
    source_url: body.source_url ?? db.source_url ?? null,
    links: normalizeLinks(body.links ?? db.links),
    notes: body.notes ?? db.notes ?? null,
    job_description: body.job_description ?? db.job_description ?? null,
    company_info: body.company_info ?? db.company_info ?? null,
    target_notes: body.target_notes ?? db.target_notes ?? null,
    wbs_certificate_path:
      body.wbs_certificate_path ?? db.wbs_certificate_path ?? null,
  }
}

function buildUserPrompt(input: {
  tone: number
  applicationType: ApplicationType
  company_name: string
  job_title: string
  job_description_raw: string
  parsed_requirements: unknown
  master_profile: unknown
  pool: PoolContext | null
  fetchedPages: FetchedPage[]
}): string {
  const parts: string[] = [
    `Bewerbungstyp: ${
      input.applicationType === "initiative"
        ? "initiative (Initiativ / Pflichtpraktikum / WBS)"
        : "regular (ausgeschriebene Stelle)"
    }`,
    `Tone-of-Voice (0=locker, 100=professionell): ${input.tone}`,
    `Stilvorgabe: ${toneDescription(input.tone)}`,
    "",
    `Stellen-/Bewerbungstitel: ${input.job_title}`,
    `Unternehmen: ${input.company_name}`,
  ]

  if (input.pool) {
    parts.push(
      "",
      "=== Pool-Kontext (alle verfügbaren Felder) ===",
      `application_type: ${input.pool.application_type ?? input.applicationType}`,
      `title: ${input.pool.title ?? ""}`,
      `company_name: ${input.pool.company_name ?? ""}`,
      `source_url: ${input.pool.source_url ?? ""}`,
      `links: ${JSON.stringify(normalizeLinks(input.pool.links))}`,
      `notes (Kontakt/Notizen): ${input.pool.notes ?? ""}`,
      `job_description: ${(input.pool.job_description ?? "").slice(0, 8000)}`,
      `company_info: ${(input.pool.company_info ?? "").slice(0, 4000)}`,
      `target_notes: ${(input.pool.target_notes ?? "").slice(0, 4000)}`,
      `wbs_hinterlegt: ${input.pool.wbs_certificate_path ? "ja" : "nein"}`,
    )
  } else {
    parts.push("", "Pool-Kontext: nicht verknüpft (nur Application-Felder).")
  }

  parts.push(
    "",
    "=== Application job_description_raw ===",
    input.job_description_raw.slice(0, 12000),
    "",
    "Parsed Requirements (JSON):",
    JSON.stringify(input.parsed_requirements ?? []),
  )

  if (input.fetchedPages.length > 0) {
    parts.push("", "=== Geladene Seiteninhalte (best-effort) ===")
    for (const page of input.fetchedPages) {
      const head = page.label ? `${page.label} — ${page.url}` : page.url
      if (page.text) {
        parts.push(`--- ${head} ---`, page.text)
      } else {
        parts.push(`--- ${head} ---`, `(nicht geladen: ${page.error ?? "unbekannt"})`)
      }
    }
  }

  parts.push(
    "",
    "Master-Profil (JSON):",
    JSON.stringify(input.master_profile ?? {}),
    "",
  )

  if (input.applicationType === "initiative") {
    parts.push(
      "Aufgabe: Erstelle Initiativ-Anschreiben und CV-Inhalt für ein Praktikum.",
      "Fokus: Mehrwert fürs Unternehmen, Bezug zu company_info/target_notes/Seiten, WBS nur falls relevant.",
    )
  } else {
    parts.push(
      "Aufgabe: Erstelle Anschreiben und angepassten CV-Inhalt zur ausgeschriebenen Stelle.",
      "Fokus: Bezug zu Anforderungen der Anzeige und parsed_requirements.",
    )
  }

  return parts.join("\n")
}

async function generateWithOpenAI(
  apiKey: string,
  input: {
    tone: number
    applicationType: ApplicationType
    company_name: string
    job_title: string
    job_description_raw: string
    parsed_requirements: unknown
    master_profile: unknown
    pool: PoolContext | null
    fetchedPages: FetchedPage[]
  },
): Promise<GeneratedPayload> {
  const systemPrompt =
    input.applicationType === "initiative"
      ? SYSTEM_PROMPT_INITIATIVE
      : SYSTEM_PROMPT_REGULAR

  const userPrompt = buildUserPrompt(input)

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini",
      temperature: 0.55,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error("OpenAI error:", res.status, errText)
    throw new Error(`OpenAI-Anfrage fehlgeschlagen (${res.status})`)
  }

  const data = await res.json()
  const content = data?.choices?.[0]?.message?.content
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Leere Antwort von OpenAI")
  }

  return normalizeGenerated(extractJsonObject(content))
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Methode nicht erlaubt" }, 405)
  }

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return jsonResponse({ error: "Nicht authentifiziert" }, 401)
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")
    const openaiKey = Deno.env.get("OPENAI_API_KEY")

    if (!supabaseUrl || !supabaseAnonKey) {
      return jsonResponse({ error: "Supabase-Umgebung fehlt" }, 500)
    }
    if (!openaiKey) {
      return jsonResponse(
        { error: "OPENAI_API_KEY ist nicht als Edge Secret gesetzt" },
        500,
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const token = authHeader.replace(/^Bearer\s+/i, "")
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return jsonResponse({ error: "Ungültige Session" }, 401)
    }

    let body: RequestBody
    try {
      body = (await req.json()) as RequestBody
    } catch {
      return jsonResponse({ error: "Ungültiger JSON-Body" }, 400)
    }

    const applicationId = body.application_id?.trim()
    if (!applicationId) {
      return jsonResponse({ error: "application_id fehlt" }, 400)
    }

    const tone = clampTone(body.tone)

    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("*")
      .eq("id", applicationId)
      .maybeSingle()

    if (appError) {
      console.error("Load application:", appError)
      return jsonResponse({ error: "Bewerbung konnte nicht geladen werden" }, 500)
    }
    if (!application) {
      return jsonResponse({ error: "Bewerbung nicht gefunden" }, 404)
    }

    const { data: poolRow } = await supabase
      .from("job_pool")
      .select(
        "application_type, title, company_name, source_url, links, notes, job_description, company_info, target_notes, wbs_certificate_path",
      )
      .eq("application_id", applicationId)
      .limit(1)
      .maybeSingle()

    const pool = mergePoolContext(body.pool, poolRow as Record<string, unknown> | null)

    const applicationType = normalizeApplicationType(
      body.application_type ??
        pool?.application_type ??
        "regular",
    )

    const { data: profile, error: profileError } = await supabase
      .from("master_profile")
      .select("content")
      .eq("user_id", user.id)
      .maybeSingle()

    if (profileError) {
      console.error("Load profile:", profileError)
      return jsonResponse({ error: "Master-Profil konnte nicht geladen werden" }, 500)
    }

    const masterContent = profile?.content ?? {}

    const fetchedPages = await fetchLinkedPages(pool)

    const generated = await generateWithOpenAI(openaiKey, {
      tone,
      applicationType,
      company_name: application.company_name ?? pool?.company_name ?? "",
      job_title: application.job_title ?? pool?.title ?? "",
      job_description_raw: application.job_description_raw ?? "",
      parsed_requirements: application.parsed_requirements,
      master_profile: masterContent,
      pool,
      fetchedPages,
    })

    const nextStatus =
      application.status === "Gefunden" ? "In Bearbeitung" : application.status

    const { data: updated, error: updateError } = await supabase
      .from("applications")
      .update({
        generated_cover_letter: generated.cover_letter,
        generated_cv_data: generated.cv_data,
        status: nextStatus,
      })
      .eq("id", applicationId)
      .select("*")
      .single()

    if (updateError) {
      console.error("Update application:", updateError)
      return jsonResponse(
        {
          error: "Speichern der generierten Dokumente fehlgeschlagen",
          details: updateError.message,
        },
        500,
      )
    }

    return jsonResponse({
      application: updated,
      cover_letter: generated.cover_letter,
      cv_data: generated.cv_data,
      meta: {
        application_type: applicationType,
        fetched_urls: fetchedPages.map((p) => ({
          url: p.url,
          label: p.label ?? null,
          ok: Boolean(p.text),
          error: p.error ?? null,
        })),
      },
    })
  } catch (error) {
    console.error("generate-application-docs failed:", error)
    const message = error instanceof Error ? error.message : "Unbekannter Fehler"
    return jsonResponse({ error: message }, 500)
  }
})
