"use client"

import { RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { listingSectionLabel } from "@/lib/listing-ui"
import { cn } from "@/lib/utils"

export type FilterTagOption = {
  key: string
  label: string
}

export type ApartmentSort = "default" | "beds_asc" | "beds_desc"

const SORT_OPTIONS: { value: ApartmentSort; label: string }[] = [
  { value: "default", label: "Par défaut" },
  { value: "beds_asc", label: "Couchages (croissant)" },
  { value: "beds_desc", label: "Couchages (décroissant)" },
]

const BED_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: "Tous" },
  { value: 2, label: "2+ lits" },
  { value: 4, label: "4+ lits" },
  { value: 6, label: "6+ lits" },
]

const CHIP_BASE =
  "inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-solid px-[14px] text-sm font-normal leading-none tracking-tight shadow-none box-border outline-none transition-[color,background-color,border-color] duration-200 ease-out"

const chipToggleClasses = (active: boolean) =>
  cn(
    CHIP_BASE,
    active
      ? "border-primary/30 bg-primary/12 text-foreground dark:border-primary/35 dark:bg-primary/18"
      : "border-transparent bg-muted/40 text-foreground/90 hover:bg-muted/55 dark:bg-white/[0.06] dark:text-foreground/88 dark:hover:bg-white/[0.1]",
  )

type FilterBarProps = {
  search: string
  onSearchChange: (value: string) => void
  bedsMin: number | null
  onBedsMinChange: (value: number | null) => void
  selectedTags: string[]
  onToggleTag: (normalizedKey: string) => void
  availableTags: FilterTagOption[]
  sort: ApartmentSort
  onSortChange: (value: ApartmentSort) => void
  onReset: () => void
}

export function FilterBar({
  search,
  onSearchChange,
  bedsMin,
  onBedsMinChange,
  selectedTags,
  onToggleTag,
  availableTags,
  sort,
  onSortChange,
  onReset,
}: FilterBarProps) {
  const hasActiveFilters =
    search.trim() !== "" ||
    bedsMin !== null ||
    selectedTags.length > 0 ||
    sort !== "default"

  return (
    <div
      className={cn(
        "flex flex-col gap-6 rounded-2xl border border-solid border-transparent p-5 shadow-none transition-[background-color,border-color] duration-200 md:flex-row md:flex-wrap md:items-start md:gap-x-8 md:gap-y-6 md:p-6 lg:gap-x-10",
        hasActiveFilters &&
          "border-border/50 bg-muted/20 dark:border-white/[0.08] dark:bg-white/[0.03]",
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2.5 md:min-w-[260px] md:max-w-md">
        <label htmlFor="apartment-search" className={listingSectionLabel}>
          Recherche
        </label>
        <input
          id="apartment-search"
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher un appartement…"
          aria-label="Rechercher un appartement"
          className="min-h-12 w-full rounded-xl border border-border bg-background px-4 py-3 text-base font-normal leading-normal tracking-tight text-foreground shadow-none placeholder:text-muted-foreground/50 focus:border-border focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-white/12 dark:bg-background/80 dark:placeholder:text-muted-foreground/45 dark:focus:ring-primary/25"
          autoComplete="off"
        />
      </div>

      <div className="flex min-w-0 flex-col gap-2.5">
        <span className={listingSectionLabel}>Couchages</span>
        <div className="flex flex-wrap gap-x-2 gap-y-2.5">
          {BED_OPTIONS.map(({ value, label }) => {
            const active = bedsMin === value
            return (
              <button
                key={label}
                type="button"
                onClick={() => onBedsMinChange(value)}
                className={chipToggleClasses(active)}
                aria-pressed={active}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex min-w-0 w-full flex-col gap-2.5 md:w-auto md:min-w-[220px]">
        <span className={listingSectionLabel}>Trier par</span>
        <div className="flex flex-wrap gap-x-2 gap-y-2.5">
          {SORT_OPTIONS.map(({ value, label }) => {
            const active = sort === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => onSortChange(value)}
                className={chipToggleClasses(active)}
                aria-pressed={active}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {availableTags.length > 0 ? (
        <div className="flex min-w-0 flex-col gap-2.5 md:max-w-xl">
          <span className={listingSectionLabel}>Équipements</span>
          <div className="flex flex-wrap gap-x-2 gap-y-2.5">
            {availableTags.map(({ key, label }) => {
              const active = selectedTags.includes(key)
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onToggleTag(key)}
                  className={chipToggleClasses(active)}
                  aria-pressed={active}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      <div className="flex w-full basis-full flex-col gap-1 border-t border-border/40 pt-6 dark:border-white/[0.08]">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!hasActiveFilters}
          onClick={onReset}
          aria-label="Réinitialiser tous les filtres"
          className="h-10 w-full shrink-0 justify-center gap-2 rounded-xl border border-transparent text-sm font-medium text-muted-foreground hover:border-border/60 hover:bg-muted/30 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-[0.35] disabled:hover:border-transparent disabled:hover:bg-transparent dark:hover:border-white/[0.08] dark:hover:bg-white/[0.05] dark:disabled:hover:bg-transparent md:h-9 md:w-auto md:px-4"
        >
          <RotateCcw
            className="size-3.5 shrink-0 opacity-70"
            aria-hidden
          />
          Réinitialiser
        </Button>
      </div>
    </div>
  )
}
