type SupabasePublicEnv = {
  url: string
  anonKey: string
}

type SupabaseAdminEnv = {
  url: string
  serviceRoleKey: string
}

/** Évite les guillemets accidentels dans le dashboard Vercel. */
function stripEnvQuotes(value: string): string {
  const t = value.trim()
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    return t.slice(1, -1).trim()
  }
  return t
}

export function getSupabasePublicEnv(): SupabasePublicEnv | null {
  const url = stripEnvQuotes(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
  const anonKey = stripEnvQuotes(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "")
  if (!url || !anonKey) return null
  return { url, anonKey }
}

export function getSupabaseAdminEnv(): SupabaseAdminEnv | null {
  const url = stripEnvQuotes(
    process.env.SUPABASE_URL?.trim() ||
      process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
      "",
  )
  const serviceRoleKey = stripEnvQuotes(
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  )
  if (!url || !serviceRoleKey) return null
  return { url, serviceRoleKey }
}

export function requireSupabasePublicEnv(errorMessage: string): SupabasePublicEnv {
  const env = getSupabasePublicEnv()
  if (!env) {
    throw new Error(errorMessage)
  }
  return env
}

export function requireSupabaseAdminEnv(errorMessage: string): SupabaseAdminEnv {
  const env = getSupabaseAdminEnv()
  if (!env) {
    throw new Error(errorMessage)
  }
  return env
}
