import "server-only"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import { getSupabasePublicEnv } from "@/lib/supabase/env"

export async function createSupabaseServerClient() {
  const env = getSupabasePublicEnv()
  if (!env) return null

  const cookieStore = await cookies()
  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const cookie of cookiesToSet) {
            cookieStore.set(cookie.name, cookie.value, cookie.options)
          }
        } catch {
          // Some server contexts (e.g. Server Components) cannot mutate cookies.
        }
      },
    },
  })
}
