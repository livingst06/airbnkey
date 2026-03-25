import { z } from "zod"

export const apartmentFormSchema = z.object({
  title: z.string().min(1, "Titre requis"),
  description: z.string(),
  beds: z.coerce.number().int().min(0).max(99),
  bathrooms: z.coerce.number().int().min(0).max(99),
  advantages: z.array(z.string()),
  latitude: z.coerce.number().finite(),
  longitude: z.coerce.number().finite(),
  images: z.array(z.string()).min(1, "Au moins une image"),
})

export type ApartmentFormParsed = z.infer<typeof apartmentFormSchema>

/** Données formulaire admin / API (aligné sur le schéma Zod). */
export type ApartmentFormInput = ApartmentFormParsed
