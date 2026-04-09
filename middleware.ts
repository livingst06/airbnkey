import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware-client"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createSupabaseMiddlewareClient(request, response)
  if (!supabase) return response

  await supabase.auth.getUser()
  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
