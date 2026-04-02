"use client"

import { Plus } from "lucide-react"

type AdminAddApartmentCardProps = {
  onAdd: () => void
}

export function AdminAddApartmentCard({ onAdd }: AdminAddApartmentCardProps) {
  return (
    <div className="h-full">
      <button
        type="button"
        onClick={onAdd}
        aria-label="Ajouter un appartement"
        className="group mx-0 flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-xl border border-border/60 bg-white/[0.02] p-0 text-left shadow-sm transition-[box-shadow,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.99] md:hover:scale-[1.01] md:hover:shadow-lg dark:border-border/50 dark:bg-white/[0.015]"
      >
        <div className="flex flex-col xl:min-h-[15rem] xl:flex-row">
          <div className="relative flex aspect-video w-full shrink-0 items-center justify-center overflow-hidden rounded-t-xl bg-gradient-to-b from-emerald-950/[0.04] via-muted/15 to-transparent transition-[filter,opacity] duration-200 ease-out xl:h-full xl:w-[17rem] xl:rounded-l-xl xl:rounded-tr-none dark:from-emerald-400/[0.06] dark:via-muted/20 dark:to-transparent">
            <Plus
              className="size-11 shrink-0 text-foreground/45 transition-colors duration-200 ease-out group-hover:text-foreground/65"
              strokeWidth={1.75}
              aria-hidden
            />
          </div>
          <div className="flex flex-1 items-center justify-center px-4 py-6 xl:px-6">
            <p className="text-center text-sm text-muted-foreground transition-colors duration-200 ease-out group-hover:text-foreground/70">
              Ajouter un appartement
            </p>
          </div>
        </div>
      </button>
    </div>
  )
}
