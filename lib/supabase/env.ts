type SupabasePublicEnv = {
  url: string
  anonKey: string
}

type SupabaseAdminEnv = {
  url: string
  serviceRoleKey: string
}

export function getSupabasePublicEnv(): SupabasePublicEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!url || !anonKey) return null
  return { url, anonKey }
}

export function getSupabaseAdminEnv(): SupabaseAdminEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
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
