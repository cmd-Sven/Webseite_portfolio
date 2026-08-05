import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

/** Kurzlebige Lebenslauf-URL — speichert den Storage-Pfad nicht als Dauer-Hotlink im Client. */
const SIGNED_URL_TTL_SECONDS = 120
const BUCKET = 'portfolio-public'
const OBJECT = 'lebenslauf.pdf'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')

  const supabaseUrl = (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    ''
  )
    .trim()
    .replace(/\/$/, '')

  const supabaseKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    ''
  ).trim()

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(OBJECT, SIGNED_URL_TTL_SECONDS)

    if (!error && data?.signedUrl) {
      return res.redirect(302, data.signedUrl)
    }

    // Fallback: öffentlicher Object-Pfad (Bucket muss public sein)
    return res.redirect(
      302,
      `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${OBJECT}`,
    )
  }

  return res.redirect(302, '/documents/lebenslauf.pdf')
}
