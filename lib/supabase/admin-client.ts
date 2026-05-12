import "server-only"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

import { getSupabaseAdminEnv } from "@/lib/supabase/env"
import { getServiceRoleKeyConfigurationError } from "@/lib/supabase/service-role-key"

export type TryCreateSupabaseAdminResult =
  | { ok: true; client: SupabaseClient }
  | { ok: false; error: string }

const clientOpts = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
}

export function tryCreateSupabaseAdminClient(): TryCreateSupabaseAdminResult {
  const env = getSupabaseAdminEnv()
  if (!env) {
    return {
      ok: false,
      error:
        "Image upload non configurée : ajoutez SUPABASE_SERVICE_ROLE_KEY sur Vercel (clé secret service_role du même projet que l’URL Supabase).",
    }
  }

  const configError = getServiceRoleKeyConfigurationError(
    env.serviceRoleKey,
    env.url,
  )
  if (configError) {
    return { ok: false, error: configError }
  }

  return {
    ok: true,
    client: createClient(env.url, env.serviceRoleKey, clientOpts),
  }
}