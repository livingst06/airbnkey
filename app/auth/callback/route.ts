import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { getSupabasePublicEnv } from "@/lib/supabase/env"

function safeNextPath(nextParam: string | null): string {
  if (!nextParam || !nextParam.startsWith("/")) return "/"
  if (nextParam.startsWith("//")) return "/"
  return nextParam
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const nextPath = safeNextPath(requestUrl.searchParams.get("next"))
  const redirectUrl = new URL(nextPath, requestUrl.origin)
  const env = getSupabasePublicEnv()

  if (!code || !env) {
    return NextResponse.redirect(redirectUrl)
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        for (const cookie of cookiesToSet) {
          cookieStore.set(cookie.name, cookie.value, cookie.options)
        }
      },
    },
  })

  await supabase.auth.exchangeCodeForSession(code)
  return NextResponse.redirect(redirectUrl)
}
