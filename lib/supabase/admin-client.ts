import "server-only"

import { createClient } from "@supabase/supabase-js"

import { getSupabaseAdminEnv } from "@/lib/supabase/env"

export function createSupabaseAdminClient() {
  const env = getSupabaseAdminEnv()
  if (!env) return null

  return createClient(env.url, env.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
