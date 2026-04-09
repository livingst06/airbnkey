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
        className="group mx-0 flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-xl border border-emerald-400/20 bg-emerald-400/[0.08] p-0 text-left shadow-sm backdrop-blur-md transition-[box-shadow,transform,background-color,border-color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.99] md:hover:scale-[1.01] md:hover:bg-emerald-400/[0.12] md:hover:shadow-lg dark:border-emerald-300/16 dark:bg-emerald-300/[0.08] dark:md:hover:bg-emerald-300/[0.12]"
      >
        <div className="flex flex-col xl:min-h-[15rem] xl:flex-row">
          <div className="relative flex aspect-video w-full shrink-0 items-center justify-center overflow-hidden rounded-t-xl bg-gradient-to-b from-emerald-300/18 via-emerald-200/10 to-transparent transition-[filter,opacity] duration-200 ease-out xl:h-full xl:w-[17rem] xl:rounded-l-xl xl:rounded-tr-none dark:from-emerald-300/[0.18] dark:via-emerald-200/[0.08] dark:to-transparent">
            <Plus
              className="size-11 shrink-0 text-emerald-100/80 transition-colors duration-200 ease-out group-hover:text-emerald-50"
              strokeWidth={1.75}
              aria-hidden
            />
          </div>
          <div className="flex flex-1 items-center justify-center px-4 py-6 xl:px-6">
            <p className="text-center text-sm text-emerald-50/80 transition-colors duration-200 ease-out group-hover:text-emerald-50">
              Add apartment
            </p>
          </div>
        </div>
      </button>
    </div>
  )
}
