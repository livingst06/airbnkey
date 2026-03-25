"use client"

import { Plus } from "lucide-react"

type AdminAddApartmentCardProps = {
  onAdd: () => void
}

export function AdminAddApartmentCard({ onAdd }: AdminAddApartmentCardProps) {
  return (
    <div className="h-full pt-3 pr-3">
      <button
        type="button"
        onClick={onAdd}
        aria-label="Ajouter un appartement"
        className="group mx-0 flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-xl border border-white/10 bg-white/70 p-0 text-left shadow-sm backdrop-blur-md transition-all duration-200 ease-out hover:scale-[1.01] hover:bg-white/80 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.99] md:hover:scale-[1.02] dark:border-white/10 dark:bg-neutral-900/55 dark:hover:bg-neutral-900/65 dark:hover:shadow-md"
      >
        <div className="relative flex aspect-video w-full shrink-0 items-center justify-center overflow-hidden bg-gradient-to-b from-emerald-950/[0.04] via-muted/15 to-transparent transition-[filter,opacity] duration-200 ease-out dark:from-emerald-400/[0.06] dark:via-muted/20 dark:to-transparent">
          <Plus
            className="size-11 shrink-0 text-foreground/45 transition-colors duration-200 ease-out group-hover:text-foreground/65"
            strokeWidth={1.75}
            aria-hidden
          />
        </div>
        <div className="space-y-2 p-3">
          <p className="text-center text-xs text-muted-foreground transition-colors duration-200 ease-out group-hover:text-foreground/70">
            Ajouter
          </p>
        </div>
      </button>
    </div>
  )
}
