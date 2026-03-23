"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"

import { cn } from "@/lib/utils"

function applyThemeClass(isDark: boolean) {
  document.documentElement.classList.toggle("dark", isDark)
}

function readStoredTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light"
  const stored = localStorage.getItem("theme")
  if (stored === "dark" || stored === "light") return stored
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

export function ThemeToggle() {
  const [state, setState] = useState<{
    mounted: boolean
    isDark: boolean
  }>({ mounted: false, isDark: false })

  useEffect(() => {
    const theme = readStoredTheme()
    const dark = theme === "dark"
    applyThemeClass(dark)
    queueMicrotask(() => {
      setState({ mounted: true, isDark: dark })
    })
  }, [])

  const toggle = () => {
    setState((prev) => {
      if (!prev.mounted) return prev
      const next = !prev.isDark
      const theme: "light" | "dark" = next ? "dark" : "light"
      localStorage.setItem("theme", theme)
      applyThemeClass(next)
      return { ...prev, isDark: next }
    })
  }

  const { mounted, isDark } = state

  return (
    <div className="relative z-[100] shrink-0 rounded-full bg-white/60 shadow-lg backdrop-blur-md dark:bg-neutral-800/60">
      <div className="relative h-8 w-14 shrink-0">
        {!mounted ? (
          <div
            className="h-full w-full rounded-full bg-neutral-200 dark:bg-neutral-600"
            aria-hidden
          />
        ) : (
          <button
            type="button"
            onClick={toggle}
            aria-label={isDark ? "Passer en thème clair" : "Passer en thème sombre"}
            aria-pressed={isDark}
            className="flex h-full w-full shrink-0 items-center rounded-full bg-neutral-200 px-1 transition-colors duration-300 dark:bg-neutral-700"
          >
            <Sun
              className={cn(
                "pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-amber-500 transition-opacity duration-300",
                isDark ? "opacity-60" : "opacity-100",
              )}
              aria-hidden
            />
            <Moon
              className={cn(
                "pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-slate-300 transition-opacity duration-300 dark:text-slate-400",
                isDark ? "opacity-100" : "opacity-60",
              )}
              aria-hidden
            />
            <span
              className={cn(
                "pointer-events-none absolute left-1 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-neutral-50 shadow-md transition-transform duration-300 dark:bg-neutral-200",
                isDark ? "translate-x-6" : "translate-x-0",
              )}
              aria-hidden
            />
          </button>
        )}
      </div>
    </div>
  )
}
