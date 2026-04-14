import { cn } from "@/lib/utils"

/** Sous-titres de section (filtres, blocs « Équipements », etc.) */
export const listingSectionLabel =
  "block text-[0.82rem] font-medium leading-snug tracking-[0.02em] text-muted-foreground/95"

/** Titre principal listing / fiche */
export const listingDetailTitle =
  "text-[1.75rem] font-semibold leading-[1.12] tracking-[-0.02em] text-foreground sm:text-[2rem] md:text-[2.125rem]"

/** Méta sous-titre (couchages, salles de bain) */
export const listingDetailMeta =
  "mt-3 text-[0.8125rem] font-normal leading-normal text-muted-foreground"

/** Corps de texte description */
export const listingDetailBody =
  "text-base font-normal leading-[1.62] tracking-[-0.005em] text-foreground/95 md:text-[1.0625rem] md:leading-[1.68]"

/** Pastilles équipements / tags (filtres & cards) */
export const listingTagBadgeClass =
  "h-auto border-border/70 bg-muted/35 px-2 py-0.5 text-[11px] font-normal leading-tight text-muted-foreground shadow-none dark:bg-muted/55 max-sm:px-2.5 max-sm:py-1 max-sm:text-[12px]"

/** CTA Halldis — discret, aligné cartes / filtres */
export function listingHalldisCtaClassName(className?: string) {
  return cn(
    "inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-border/75 bg-muted/35 px-5 py-3 text-base font-medium text-foreground transition-colors duration-200 ease-out hover:border-border hover:bg-muted/55",
    className,
  )
}
