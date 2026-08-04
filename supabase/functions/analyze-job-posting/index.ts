import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

const SYSTEM_PROMPT = `Du bist ein Assistent für Bewerbungsanalyse. Extrahiere aus Stellenanzeigen strukturierte Daten.

Antworte AUSSCHLIESSLICH mit gültigem JSON (kein Markdown, keine Erklärung) in dieser Form:
{
  "company_name": "string",
  "job_title": "string",
  "requirements": [
    { "skill": "string", "type": "hard" | "soft", "priority": "must" | "nice" }
  ]
}

Regeln:
- company_name: Firmenname aus der Anzeige; leer wenn unbekannt
- job_title: Stellenbezeichnung
- requirements: relevante Hard- und Soft-Skills (max. 25 Einträge)
- type "hard" = technische/fachliche Skills, "soft" = persönliche Kompetenzen
- priority "must" = Pflicht, "nice" = wünschenswert
- Sprache der Skill-Namen: wie in der Anzeige (meist Deutsch oder Englisch)
- Optional geladene Seiteninhalte (source_url) nur als Zusatzkontext nutzen; Primärquelle bleibt der Anzeigentext.`

const FETCH_TIMEOUT_MS = 8_000
const MAX_PAGE_CHARS = 4_000

type SkillRequirement = {
  skill: string
  type: "hard" | "soft"
  priority: "must" | "nice"
}

type ParsedJob = {
  company_name: string
  job_title: string
  requirements: SkillRequirement[]
}

type RequestBody = {
  job_description_raw?: string
  company_name?: string
  source_url?: string
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

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value)
    return u.protocol === "http:" || u.protocol === "https:"
  } catch {
    return false
  }
}

function stripHtmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
}

async function fetchSourcePageText(url: string): Promise<string | null> {
  if (!isHttpUrl(url)) return null
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
    if (!res.ok) return null
    const contentType = res.headers.get("content-type") ?? ""
    if (
      contentType &&
      !/text\/html|text\/plain|application\/xhtml/i.test(contentType)
    ) {
      return null
    }
    const raw = await res.text()
    const text = stripHtmlToText(raw).slice(0, MAX_PAGE_CHARS)
    return text || null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

function normalizeParsed(raw: unknown, fallbackCompany: string): ParsedJob {
  if (!raw || typeof raw !== "object") {
    throw new Error("Ungültiges Analyse-Ergebnis")
  }

  const obj = raw as Record<string, unknown>
  const company =
    (typeof obj.company_name === "string" && obj.company_name.trim()) ||
    fallbackCompany ||
    ""
  const title =
    (typeof obj.job_title === "string" && obj.job_title.trim()) || "Unbekannte Stelle"

  const requirementsRaw = Array.isArray(obj.requirements) ? obj.requirements : []
  const requirements: SkillRequirement[] = []

  for (const item of requirementsRaw) {
    if (!item || typeof item !== "object") continue
    const r = item as Record<string, unknown>
    const skill = typeof r.skill === "string" ? r.skill.trim() : ""
    if (!skill) continue
    const type = r.type === "soft" ? "soft" : "hard"
    const priority = r.priority === "nice" ? "nice" : "must"
    requirements.push({ skill, type, priority })
  }

  return {
    company_name: company,
    job_title: title,
    requirements: requirements.slice(0, 25),
  }
}

async function analyzeWithOpenAI(
  apiKey: string,
  jobText: string,
  hints: { company_name?: string; source_url?: string; page_text?: string | null },
): Promise<ParsedJob> {
  const userParts = [
    "Analysiere diese Stellenanzeige:",
    jobText,
  ]
  if (hints.company_name?.trim()) {
    userParts.push(`Hinweis Unternehmensname (vom Nutzer): ${hints.company_name.trim()}`)
  }
  if (hints.source_url?.trim()) {
    userParts.push(`Hinweis URL: ${hints.source_url.trim()}`)
  }
  if (hints.page_text?.trim()) {
    userParts.push(
      "Zusätzlicher Seiteninhalt von source_url (best-effort, gekürzt):",
      hints.page_text.trim(),
    )
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userParts.join("\n\n") },
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

  return normalizeParsed(extractJsonObject(content), hints.company_name?.trim() || "")
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

    const jobText = body.job_description_raw?.trim() ?? ""
    if (jobText.length < 40) {
      return jsonResponse(
        { error: "Stellenanzeige ist zu kurz (mind. ca. 40 Zeichen)" },
        400,
      )
    }

    const sourceUrl = body.source_url?.trim() || ""
    const pageText = sourceUrl ? await fetchSourcePageText(sourceUrl) : null

    const parsed = await analyzeWithOpenAI(openaiKey, jobText, {
      company_name: body.company_name,
      source_url: body.source_url,
      page_text: pageText,
    })

    const companyName =
      body.company_name?.trim() || parsed.company_name || "Unbekanntes Unternehmen"

    const { data: application, error: insertError } = await supabase
      .from("applications")
      .insert({
        user_id: user.id,
        company_name: companyName,
        job_title: parsed.job_title,
        job_description_raw: jobText,
        status: "Gefunden",
        parsed_requirements: parsed.requirements,
      })
      .select("*")
      .single()

    if (insertError) {
      console.error("Insert error:", insertError)
      return jsonResponse(
        { error: "Speichern der Bewerbung fehlgeschlagen", details: insertError.message },
        500,
      )
    }

    return jsonResponse({ application, parsed })
  } catch (error) {
    console.error("analyze-job-posting failed:", error)
    const message = error instanceof Error ? error.message : "Unbekannter Fehler"
    return jsonResponse({ error: message }, 500)
  }
})
