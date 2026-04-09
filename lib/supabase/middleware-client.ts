import { createServerClient } from "@supabase/ssr"
import type { NextRequest, NextResponse } from "next/server"

import { getSupabasePublicEnv } from "@/lib/supabase/env"

export function createSupabaseMiddlewareClient(
  request: NextRequest,
  response: NextResponse,
) {
  const env = getSupabasePublicEnv()
  if (!env) return null

  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const cookie of cookiesToSet) {
          request.cookies.set(cookie.name, cookie.value)
          response.cookies.set(cookie.name, cookie.value, cookie.options)
        }
      },
    },
  })
}
