import { cn } from "@/lib/utils"

/** Sous-titres de section (filtres, blocs « Équipements », etc.) */
export const listingSectionLabel =
  "block text-[15px] font-medium leading-snug tracking-tight text-muted-foreground"

/** Titre principal listing / fiche */
export const listingDetailTitle =
  "text-[1.75rem] font-semibold leading-[1.15] tracking-tight text-foreground sm:text-[2rem] md:text-[2.125rem]"

/** Méta sous-titre (couchages, salles de bain) */
export const listingDetailMeta =
  "mt-3 text-[0.8125rem] font-normal leading-normal text-muted-foreground"

/** Corps de texte description */
export const listingDetailBody =
  "text-base font-normal leading-[1.65] tracking-tight text-foreground md:text-[1.0625rem] md:leading-[1.7]"

/** Pastilles équipements / tags (filtres & cards) */
export const listingTagBadgeClass =
  "h-auto border-border/70 bg-muted/25 px-2 py-0.5 text-[11px] font-normal leading-tight text-muted-foreground shadow-none dark:border-white/12 dark:bg-white/[0.05] dark:text-muted-foreground max-sm:px-2.5 max-sm:py-1 max-sm:text-[12px]"

/** CTA Halldis — discret, aligné cartes / filtres */
export function listingHalldisCtaClassName(className?: string) {
  return cn(
    "inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-muted/30 px-5 py-3 text-base font-medium text-foreground transition-colors duration-200 ease-out hover:border-border/80 hover:bg-muted/50 dark:border-white/12 dark:bg-white/[0.06] dark:hover:border-white/18 dark:hover:bg-white/[0.1]",
    className,
  )
}
