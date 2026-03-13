import { supabase } from '@/lib/supabase'

interface UserPreferences {
  panelState: Record<string, boolean>
  layout: unknown
  watchlist: string[]
  theme: string
}

const LS_KEY = 'monoth_preferences'

export async function loadPreferences(userId?: string): Promise<UserPreferences | null> {
  if (userId) {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('preferences')
      .eq('user_id', userId)
      .single()
    if (error || !data) return null
    return data.preferences as UserPreferences
  }

  const raw = localStorage.getItem(LS_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) as UserPreferences } catch { return null }
}

export async function savePreferences(prefs: Partial<UserPreferences>, userId?: string): Promise<void> {
  if (userId) {
    await supabase
      .from('user_preferences')
      .upsert({ user_id: userId, preferences: prefs }, { onConflict: 'user_id' })
    return
  }

  const existing = localStorage.getItem(LS_KEY)
  const current = existing ? JSON.parse(existing) : {}
  localStorage.setItem(LS_KEY, JSON.stringify({ ...current, ...prefs }))
}
