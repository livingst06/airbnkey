import "server-only"

/**
 * Décode la partie payload d’un JWT Supabase sans vérifier la signature
 * (uniquement pour diagnostiquer la config avant les appels API).
 */
export function decodeSupabaseJwtPayload(
  jwt: string,
): Record<string, unknown> | null {
  const parts = jwt.trim().split(".")
  if (parts.length !== 3) return null
  try {
    let b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const pad = b64.length % 4
    if (pad) b64 += "=".repeat(4 - pad)
    const json = Buffer.from(b64, "base64").toString("utf8")
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

/** Retourne un message utilisateur si la clé ou l’URL sont incohérents ; sinon null. */
export function getServiceRoleKeyConfigurationError(
  serviceRoleKey: string,
  supabaseProjectUrl: string,
): string | null {
  const payload = decodeSupabaseJwtPayload(serviceRoleKey)
  if (!payload) {
    return "SUPABASE_SERVICE_ROLE_KEY invalide ou tronquée (vérifiez copie-colle sans guillemets ni espace parasite dans les variables Vercel)."
  }

  const role = payload.role
  if (role === "anon") {
    return "SUPABASE_SERVICE_ROLE_KEY doit être la clé secret service_role (Settings > API), pas la clé anon « publishable »."
  }
  if (role !== "service_role") {
    return `SUPABASE_SERVICE_ROLE_KEY doit être un JWT avec role \"service_role\" (role actuel dans le jeton : ${String(role)}).`
  }

  const ref = typeof payload.ref === "string" ? payload.ref : null
  if (!ref) return null

  let host: string
  try {
    host = new URL(supabaseProjectUrl).hostname.toLowerCase()
  } catch {
    return "NEXT_PUBLIC_SUPABASE_URL (ou SUPABASE_URL) n’est pas une URL valide."
  }

  const expectedPrefix = `${ref}.`
  if (!host.startsWith(expectedPrefix)) {
    return `La clé service_role correspond au projet Supabase "${ref}", mais l’URL configurée utilise l’hôte "${host}". Utilisez la même paire URL + service_role pour ce projet dans Vercel.`
  }

  return null
}
