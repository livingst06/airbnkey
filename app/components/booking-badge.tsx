import { cn } from "@/lib/utils"

const LABELS: Record<string, string> = {
  halldis: "Halldis",
  airbnb: "Airbnb",
  booking: "Booking.com",
}

type BookingBadgeProps = {
  provider: string
  className?: string
}

export function BookingBadge({ provider, className }: BookingBadgeProps) {
  const label = LABELS[provider] ?? provider

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-white/10 bg-neutral-800 px-2 py-0.5 text-[0.6875rem] font-semibold tracking-wide text-white shadow-sm dark:bg-neutral-900",
        className,
      )}
    >
      {label}
    </span>
  )
}
