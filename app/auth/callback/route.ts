import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { getSupabasePublicEnv } from "@/lib/supabase/env"

function safeNextPath(nextParam: string | null): string {
  if (!nextParam || !nextParam.startsWith("/")) return "/"
  if (nextParam.startsWith("//")) return "/"
  if (nextParam.includes("\\")) return "/"
  return nextParam
}

function getPublicSiteOrigin(): string | null {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (!siteUrl) return null
  try {
    return new URL(siteUrl).origin
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const nextPath = safeNextPath(requestUrl.searchParams.get("next"))
  const siteOrigin = getPublicSiteOrigin()
  const redirectBase = siteOrigin ?? requestUrl.origin
  const redirectUrl = new URL(nextPath, redirectBase)
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
