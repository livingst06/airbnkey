import { z } from "zod"

const bookingUrlField = z
  .string()
  .optional()
  .transform((s) => {
    const t = (s ?? "").trim()
    return t === "" ? null : t
  })
  .refine(
    (v) =>
      v === null ||
      v.startsWith("http://") ||
      v.startsWith("https://"),
    {
      message:
        "Le lien doit commencer par http:// ou https://",
    },
  )

const optionalReviewsCountField = z
  .union([z.number(), z.null(), z.undefined()])
  .transform((value) => (value === undefined ? null : value))
  .refine((value) => value === null || (Number.isInteger(value) && value >= 0), {
    message: "Le nombre d'avis doit être un entier positif ou nul",
  })

const optionalRatingAverageField = z
  .union([z.number(), z.null(), z.undefined()])
  .transform((value) => (value === undefined ? null : value))
  .refine((value) => value === null || (Number.isFinite(value) && value >= 0 && value <= 5), {
    message: "La note moyenne doit être comprise entre 0 et 5",
  })

const optionalTrimmedTextField = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = (value ?? "").trim()
    return trimmed === "" ? null : trimmed
  })

export const apartmentFormSchema = z.object({
  title: z.string().min(1, "Titre requis"),
  description: z.string(),
  city: optionalTrimmedTextField,
  street: optionalTrimmedTextField,
  guests: z.coerce.number().int().min(0).max(99),
  beds: z.coerce.number().int().min(0).max(99),
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
      message: "Renseignez à la fois le nombre d'avis et la note moyenne",
    })
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["ratingAverage"],
      message: "Renseignez à la fois le nombre d'avis et la note moyenne",
    })
  }

  if (value.city === null && value.street !== null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["city"],
      message: "Renseignez la ville pour afficher une rue",
    })
  }
})

export type ApartmentFormParsed = z.infer<typeof apartmentFormSchema>

/** Données formulaire admin / API (aligné sur le schéma Zod). */
export type ApartmentFormInput = ApartmentFormParsed
