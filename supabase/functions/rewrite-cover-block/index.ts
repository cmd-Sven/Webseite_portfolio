import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

const SYSTEM_PROMPT = `Du überarbeitest einzelne Absätze eines deutschen Bewerbungsanschreibens.
Antworte AUSSCHLIESSLICH mit gültigem JSON: { "rewritten": "string" }

Regeln:
- Behalte Inhalt und Fakten; erfinde nichts.
- Keine KI-Floskeln („leidenschaftlich“, „dynamisch“, „synergien“).
- Länge ähnlich zum Original (±20 %), ein Absatz.
- Sprache: Deutsch, Ton wie im Original (oder laut Hinweis).`

type RequestBody = {
  text?: string
  instruction?: string
  company_name?: string
  job_title?: string
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
    if (fenced?.[1]) return JSON.parse(fenced[1].trim())
    const start = trimmed.indexOf("{")
    const end = trimmed.lastIndexOf("}")
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1))
    }
    throw new Error("Kein JSON im Modell-Output gefunden")
  }
}

async function rewriteWithOpenAI(
  apiKey: string,
  payload: {
    text: string
    instruction?: string
    company_name?: string
    job_title?: string
  },
): Promise<string> {
  const userContent = JSON.stringify({
    paragraph: payload.text,
    instruction: payload.instruction || "Klarer, natürlicher und präziser formulieren.",
    company_name: payload.company_name || "",
    job_title: payload.job_title || "",
  })

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`OpenAI-Fehler (${res.status}): ${errText.slice(0, 400)}`)
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error("Leere OpenAI-Antwort")

  const parsed = extractJsonObject(content) as { rewritten?: unknown }
  if (typeof parsed.rewritten !== "string" || !parsed.rewritten.trim()) {
    throw new Error("Ungültige Rewrite-Antwort")
  }
  return parsed.rewritten.trim()
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Nur POST erlaubt" }, 405)
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

    const text = body.text?.trim()
    if (!text) {
      return jsonResponse({ error: "text fehlt" }, 400)
    }
    if (text.length > 4000) {
      return jsonResponse({ error: "Absatz zu lang (max. 4000 Zeichen)" }, 400)
    }

    const rewritten = await rewriteWithOpenAI(openaiKey, {
      text,
      instruction: body.instruction?.trim(),
      company_name: body.company_name?.trim(),
      job_title: body.job_title?.trim(),
    })

    return jsonResponse({ rewritten })
  } catch (error) {
    console.error("rewrite-cover-block failed:", error)
    const message = error instanceof Error ? error.message : "Unbekannter Fehler"
    return jsonResponse({ error: message }, 500)
  }
})
