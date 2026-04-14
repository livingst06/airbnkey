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
        aria-label="Add an apartment"
        className="group mx-0 flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/85 p-0 text-left shadow-[0_12px_28px_rgba(16,18,24,0.08)] backdrop-blur-md transition-[box-shadow,background-color,border-color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background hover:bg-card"
      >
        <div className="flex flex-col xl:min-h-[15rem] xl:flex-row">
          <div className="relative flex aspect-video w-full shrink-0 items-center justify-center overflow-hidden rounded-t-2xl bg-gradient-to-b from-muted/75 via-muted/35 to-transparent transition-[filter,opacity] duration-200 ease-out xl:h-full xl:w-[17rem] xl:rounded-l-2xl xl:rounded-tr-none">
            <Plus
              className="size-11 shrink-0 text-foreground/55 transition-colors duration-200 ease-out group-hover:text-foreground/80"
              strokeWidth={1.75}
              aria-hidden
            />
          </div>
          <div className="flex flex-1 items-center justify-center px-4 py-6 xl:px-6">
            <p className="text-center text-sm text-muted-foreground transition-colors duration-200 ease-out group-hover:text-foreground/85">
              Add apartment
            </p>
          </div>
        </div>
      </button>
    </div>
  )
}
