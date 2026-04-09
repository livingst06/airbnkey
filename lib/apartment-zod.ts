import { z } from "zod"
import { APARTMENT_FIELD_LABELS } from "@/lib/apartment-field-labels"

const bookingUrlField = z
  .string()
  .transform((value) => value.trim())
  .refine((value) => value.length > 0, {
    message: `${APARTMENT_FIELD_LABELS.bookingUrl} is required`,
  })
  .refine(
    (value) => value.startsWith("http://") || value.startsWith("https://"),
    {
      message: `${APARTMENT_FIELD_LABELS.bookingUrl} must start with http:// or https://`,
    },
  )
  .refine((value) => {
    try {
      const parsed = new URL(value)
      return parsed.protocol === "http:" || parsed.protocol === "https:"
    } catch {
      return false
    }
  }, {
    message: `${APARTMENT_FIELD_LABELS.bookingUrl} must be a valid URL`,
  })

const optionalReviewsCountField = z
  .union([z.number(), z.null(), z.undefined()])
  .transform((value) => (value === undefined ? null : value))
  .refine((value) => value === null || (Number.isInteger(value) && value >= 0), {
    message: `${APARTMENT_FIELD_LABELS.reviewsCount} must be a positive integer or zero`,
  })

const optionalRatingAverageField = z
  .union([z.number(), z.null(), z.undefined()])
  .transform((value) => (value === undefined ? null : value))
  .refine((value) => value === null || (Number.isFinite(value) && value >= 0 && value <= 5), {
    message: `${APARTMENT_FIELD_LABELS.ratingAverage} must be between 0 and 5`,
  })

const optionalTrimmedTextField = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    const trimmed = (value ?? "").trim()
    return trimmed === "" ? null : trimmed
  })

const requiredCityField = z
  .string()
  .trim()
  .min(1, `${APARTMENT_FIELD_LABELS.city} is required`)

export const apartmentFormSchema = z.object({
  title: z.string().min(1, `${APARTMENT_FIELD_LABELS.title} is required`),
  description: z.string().min(1, `${APARTMENT_FIELD_LABELS.description} is required`),
  city: requiredCityField,
  street: optionalTrimmedTextField,
  guests: z.coerce.number().int().min(1, "Enter at least 1 guest").max(99),
  beds: z.coerce.number().int().min(1, "Enter at least 1 bed").max(99),
  bathrooms: z.coerce.number().int().min(0).max(99),
  reviewsCount: optionalReviewsCountField,
  ratingAverage: optionalRatingAverageField,
  advantages: z.array(z.string()),
  latitude: z.coerce.number().finite(),
  longitude: z.coerce.number().finite(),
  images: z.array(z.string()),
  bookingUrl: bookingUrlField,
}).superRefine((value, ctx) => {
  const hasReviewsCount = value.reviewsCount !== null
  const hasRatingAverage = value.ratingAverage !== null

  if (hasReviewsCount !== hasRatingAverage) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["reviewsCount"],
      message: `Fill both ${APARTMENT_FIELD_LABELS.reviewsCount} and ${APARTMENT_FIELD_LABELS.ratingAverage}`,
    })
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["ratingAverage"],
      message: `Fill both ${APARTMENT_FIELD_LABELS.reviewsCount} and ${APARTMENT_FIELD_LABELS.ratingAverage}`,
    })
  }

})

export type ApartmentFormParsed = z.infer<typeof apartmentFormSchema>

/** Données formulaire admin / API (aligné sur le schéma Zod). */
export type ApartmentFormInput = ApartmentFormParsed
