import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/** Verify the Bearer JWT in Authorization header. Returns user id on success, sends 401 and returns null on failure. */
export async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const auth = req.headers.authorization ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return null
  }
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) {
    res.status(401).json({ error: 'Invalid or expired token' })
    return null
  }
  return data.user.id
}
