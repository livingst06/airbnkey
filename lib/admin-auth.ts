import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase/server-client"

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function parseAdminList(raw: string | undefined): Set<string> {
  if (!raw) return new Set<string>()
  const emails = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map(normalizeEmail)
  return new Set(emails)
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const adminList = parseAdminList(process.env.ADMIN_LIST)
  if (adminList.size === 0) return false
  return adminList.has(normalizeEmail(email))
}

export async function getCurrentUserEmail(): Promise<string | null> {
  const supabase = await createSupabaseServerClient()
  if (!supabase) return null

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user?.email ? normalizeEmail(user.email) : null
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const email = await getCurrentUserEmail()
  return isAdminEmail(email)
}
