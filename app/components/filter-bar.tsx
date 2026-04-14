"use client"

import { RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { APARTMENT_CHARACTERISTIC_LABELS } from "@/lib/apartment-field-labels"
import { listingSectionLabel } from "@/lib/listing-ui"
import { cn } from "@/lib/utils"

export type FilterTagOption = {
  key: string
  label: string
}

export type ApartmentSort = "default" | "beds_asc" | "beds_desc"

const SORT_OPTIONS: { value: ApartmentSort; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "beds_asc", label: "Beds (ascending)" },
  { value: "beds_desc", label: "Beds (descending)" },
]

const BED_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: "All" },
  { value: 2, label: "2+ beds" },
  { value: 4, label: "4+ beds" },
  { value: 6, label: "6+ beds" },
]

const CHIP_BASE =
  "inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-solid px-[14px] text-sm font-normal leading-none tracking-tight shadow-none box-border outline-none transition-[color,background-color,border-color] duration-200 ease-out"

const chipToggleClasses = (active: boolean) =>
  cn(
    CHIP_BASE,
    active
      ? "border-border bg-accent/70 text-foreground"
      : "border-transparent bg-muted/50 text-foreground/88 hover:bg-muted/70",
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
  compact?: boolean
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
  compact = false,
}: FilterBarProps) {
  const hasActiveFilters =
    search.trim() !== "" ||
    bedsMin !== null ||
    selectedTags.length > 0 ||
    sort !== "default"

  return (
    <div
      className={cn(
        "flex flex-col gap-6 rounded-2xl border border-solid border-border/50 bg-card/55 p-5 shadow-[0_10px_22px_rgba(16,18,24,0.06)] transition-[background-color,border-color] duration-200 md:flex-row md:flex-wrap md:items-start md:gap-x-8 md:gap-y-6 md:p-6 lg:gap-x-10",
        compact
          ? "xl:gap-4 xl:gap-x-5 xl:gap-y-4 xl:p-4"
          : null,
        hasActiveFilters && "border-border/75 bg-card/75",
      )}
    >
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col gap-2.5 md:min-w-[260px] md:max-w-md",
          compact && "xl:min-w-[220px] xl:pt-[1.9rem]",
        )}
      >
        <label htmlFor="apartment-search" className={cn(listingSectionLabel, "sr-only")}>
          Search
        </label>
        <input
          id="apartment-search"
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search apartments..."
          aria-label="Search apartments"
          className="min-h-12 w-full rounded-xl border border-border/80 bg-background/85 px-4 py-3 text-base font-normal leading-normal tracking-tight text-foreground shadow-none placeholder:text-muted-foreground/60 focus:border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
          autoComplete="off"
        />
      </div>

      <div className="flex min-w-0 flex-col gap-2.5">
        <span className={listingSectionLabel}>{APARTMENT_CHARACTERISTIC_LABELS.beds}</span>
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
        <span className={listingSectionLabel}>Sort by</span>
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
          <span className={listingSectionLabel}>Amenities</span>
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

      <div
        className={cn(
          "flex w-full basis-full flex-col gap-1 border-t border-border/45",
          compact ? "pt-6 xl:pt-4" : "pt-6",
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!hasActiveFilters}
          onClick={onReset}
          aria-label="Reset all filters"
          className={cn(
            "w-full shrink-0 justify-center gap-2 rounded-xl border border-transparent text-sm font-medium text-muted-foreground hover:border-border/60 hover:bg-muted/35 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-[0.35] disabled:hover:border-transparent disabled:hover:bg-transparent md:w-auto md:px-4",
            compact ? "h-10 md:h-9 xl:h-9" : "h-10 md:h-9",
          )}
        >
          <RotateCcw
            className="size-3.5 shrink-0 opacity-70"
            aria-hidden
          />
          Reset
        </Button>
      </div>
    </div>
  )
}
