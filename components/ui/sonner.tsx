"use client"

import { useSyncExternalStore } from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react"

import { cn } from "@/lib/utils"

function subscribeTheme(callback: () => void) {
  const el = document.documentElement
  const obs = new MutationObserver(callback)
  obs.observe(el, { attributes: true, attributeFilter: ["class"] })
  return () => obs.disconnect()
}

function getThemeSnapshot(): "light" | "dark" {
  return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

function getServerTheme(): "light" | "dark" {
  return "light"
}

/** Base neutre : glass + blur + animations (success/error via `richColors` natif Sonner) */
const defaultToastClassName =
  "rounded-2xl px-6 py-4 backdrop-blur-xl border shadow-xl transition-all duration-300 ease-out bg-white/80 dark:bg-neutral-800/80 border-neutral-200 dark:border-neutral-700 text-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:slide-in-from-top-4"

const Toaster = ({ toastOptions, ...props }: ToasterProps) => {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getServerTheme,
  )

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center"
      richColors
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        ...toastOptions,
        className: cn(defaultToastClassName, toastOptions?.className),
        classNames: {
          ...toastOptions?.classNames,
          title: cn("text-sm font-medium", toastOptions?.classNames?.title),
          description: cn(
            "text-sm opacity-80",
            toastOptions?.classNames?.description,
          ),
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
