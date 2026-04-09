import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

import { requireSupabasePublicEnv } from "@/lib/supabase/env"

const SUPABASE_AUTH_ERROR =
  "Authentication unavailable: configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."

let browserClient: SupabaseClient | null = null

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient
  const { url, anonKey } = requireSupabasePublicEnv(SUPABASE_AUTH_ERROR)
  browserClient = createBrowserClient(url, anonKey)
  return browserClient
}
