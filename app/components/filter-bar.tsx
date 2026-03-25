"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type FilterTagOption = {
  key: string
  label: string
}

const BED_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: "Tous" },
  { value: 2, label: "2+ lits" },
  { value: 4, label: "4+ lits" },
  { value: 6, label: "6+ lits" },
]

type FilterBarProps = {
  search: string
  onSearchChange: (value: string) => void
  bedsMin: number | null
  onBedsMinChange: (value: number | null) => void
  selectedTags: string[]
  onToggleTag: (normalizedKey: string) => void
  availableTags: FilterTagOption[]
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
  onReset,
}: FilterBarProps) {
  const hasActiveFilters =
    search.trim() !== "" || bedsMin !== null || selectedTags.length > 0

  return (
    <div className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:flex-wrap md:items-end md:gap-x-4 md:gap-y-3">
      <div className="min-w-0 flex-1 md:min-w-[240px] md:max-w-md">
        <label htmlFor="apartment-search" className="sr-only">
          Rechercher un appartement
        </label>
        <input
          id="apartment-search"
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher un appartement…"
          aria-label="Rechercher un appartement"
          className="w-full rounded-xl border border-border bg-background/80 px-4 py-2.5 text-sm shadow-sm backdrop-blur placeholder:text-muted-foreground/80 focus:outline-none focus:ring-2 focus:ring-primary/25"
          autoComplete="off"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">
          Couchages
        </span>
        <div className="flex flex-wrap gap-2">
          {BED_OPTIONS.map(({ value, label }) => {
            const active = bedsMin === value
            return (
              <button
                key={label}
                type="button"
                onClick={() => onBedsMinChange(value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "border-primary bg-primary/15 text-primary shadow-sm dark:bg-primary/20"
                    : "border-border/80 bg-muted/40 text-foreground/90 hover:bg-muted/70 dark:bg-muted/30",
                )}
                aria-pressed={active}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {availableTags.length > 0 ? (
        <div className="flex flex-col gap-1.5 md:max-w-xl">
          <span className="text-xs font-medium text-muted-foreground">
            Équipements & tags
          </span>
          <div className="flex flex-wrap gap-2">
            {availableTags.map(({ key, label }) => {
              const active = selectedTags.includes(key)
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onToggleTag(key)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "border-primary ring-2 ring-primary/30 bg-primary/12 text-primary dark:bg-primary/18"
                      : "border-border/80 bg-muted/40 text-foreground/90 hover:bg-muted/70 dark:bg-muted/30",
                  )}
                  aria-pressed={active}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      <div className="flex items-end pt-1 md:pt-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!hasActiveFilters}
          onClick={onReset}
          className="rounded-xl text-xs font-medium shrink-0"
        >
          Réinitialiser
        </Button>
      </div>
    </div>
  )
}
