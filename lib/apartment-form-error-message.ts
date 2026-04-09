import { APARTMENT_FIELD_LABELS } from "@/lib/apartment-field-labels"

type FlattenedFieldErrors = Record<string, string[] | undefined>

type ApartmentFlattenedError = {
  formErrors?: string[]
  fieldErrors?: FlattenedFieldErrors
}

const FALLBACK_MESSAGE =
  "Some information is invalid. Please review the form fields."

function sanitizeMessage(message: string) {
  const trimmed = message.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function formatApartmentFormErrorMessage(
  flattened: ApartmentFlattenedError | null | undefined,
): string {
  if (!flattened) return FALLBACK_MESSAGE

  const fieldErrors = flattened.fieldErrors ?? {}
  for (const [field, errors] of Object.entries(fieldErrors)) {
    const first = errors?.[0]
    const clean = first ? sanitizeMessage(first) : null
    if (!clean) continue
    const label = APARTMENT_FIELD_LABELS[field as keyof typeof APARTMENT_FIELD_LABELS] ?? field
    return `Please check ${label}: ${clean}`
  }

  const formError = flattened.formErrors?.find((item) => Boolean(sanitizeMessage(item)))
  if (formError) {
    return sanitizeMessage(formError) ?? FALLBACK_MESSAGE
  }

  return FALLBACK_MESSAGE
}

export function mapAdminActionErrorToUserMessage(
  message: string | null | undefined,
  fallback: string,
): string {
  const text = message?.trim()
  if (!text) return fallback

  switch (text) {
    case "Non autorisé":
    case "Not authorized":
      return "You do not have permission to perform this action."
    case "Introuvable":
    case "Not found":
      return "This apartment could not be found. Refresh the page and try again."
    case "Liste incomplète":
    case "Incomplete list":
      return "The list changed in the meantime. Refresh the page and try again."
    case "Identifiants invalides":
    case "Positions invalides":
    case "Invalid apartment IDs":
    case "Invalid apartment positions":
      return "Unable to save this order right now. Refresh the page and try again."
    case "Ordre non enregistré":
    case "Order not saved":
      return "The order could not be saved. Please try again in a few moments."
    case "Création impossible":
    case "Creation failed":
      return "The apartment could not be created. Please review the details and try again."
    case "Mise à jour impossible":
    case "Update failed":
      return "The update could not be saved. Please try again in a few moments."
    case "Suppression impossible":
    case "Delete failed":
      return "The apartment could not be deleted. Please try again in a few moments."
    case "Données invalides":
    case "Invalid data":
      return FALLBACK_MESSAGE
    default:
      return text
  }
}
