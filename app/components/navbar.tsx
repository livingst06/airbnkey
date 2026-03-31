"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from "react"
import { usePathname } from "next/navigation"

import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"

/** Toujours ancrer sur la home (`/#id`) pour que les liens restent valides depuis `/admin` ou toute autre route. */
const sectionNavLinks = [
  { id: "appartements", href: "/#appartements", label: "Appartements" },
  { id: "about", href: "/#about", label: "À propos" },
  { id: "contact", href: "/#contact", label: "Contact" },
] as const

type SectionId = (typeof sectionNavLinks)[number]["id"]
type NavId = SectionId | "admin"

export function Navbar() {
  const pathname = usePathname()
  const isAdmin = process.env.NEXT_PUBLIC_ADMIN_MODE === "true"
  const disableHomePrefetch = pathname === "/admin"

  const navLinks = useMemo(() => {
    if (!isAdmin) return sectionNavLinks
    return [
      ...sectionNavLinks,
      { id: "admin" as const, href: "/admin", label: "Modifier" },
    ] as const
  }, [isAdmin])

  const [activeSection, setActiveSection] = useState<SectionId>("appartements")
  const activeNavIdRef = useRef<NavId>("appartements")

  const indicatorRef = useRef<HTMLSpanElement | null>(null)
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({})
  const linksWrapperRef = useRef<HTMLDivElement | null>(null)

  const updateIndicator = useCallback(() => {
    const indicator = indicatorRef.current
    const el = linkRefs.current[activeNavIdRef.current]
    const wrapper = linksWrapperRef.current
    if (!indicator || !el || !wrapper) return

    const rect = el.getBoundingClientRect()
    const wrapperRect = wrapper.getBoundingClientRect()

    // "Apple-like" indicator: petit padding autour du texte + hauteur qui suit la ligne.
    const paddingX = 10
    const paddingY = 6

    // Important: utiliser `left` (et non `translateX`) pour ne pas interférer avec
    // le `translateY` appliqué par Tailwind (`-translate-y-1/2`).
    const left = rect.left - wrapperRect.left - paddingX
    const width = rect.width + paddingX * 2
    const height = rect.height + paddingY * 2

    indicator.style.transform = ""
    indicator.style.left = `${left}px`
    indicator.style.width = `${width}px`
    indicator.style.height = `${height}px`
  }, [])

  const activeNavId: NavId =
    isAdmin && pathname === "/admin" ? "admin" : activeSection

  useLayoutEffect(() => {
    activeNavIdRef.current = activeNavId
    updateIndicator()
  }, [activeNavId, updateIndicator])

  useEffect(() => {
    let raf = 0
    const onResize = () => {
      cancelAnimationFrame(raf)
      raf = window.requestAnimationFrame(() => updateIndicator())
    }
    window.addEventListener("resize", onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", onResize)
    }
  }, [updateIndicator])

  useEffect(() => {
    if (pathname === "/admin") return

    const ids = sectionNavLinks.map((l) => l.id) as SectionId[]
    const idsSet = new Set(ids)

    const observer = new IntersectionObserver(
      (entries) => {
        const intersecting = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => {
            const id = (entry.target as HTMLElement).id
            return {
              id,
              ratio: entry.intersectionRatio,
              top: entry.boundingClientRect.top,
            }
          })
          .filter(
            (item): item is {
              id: SectionId
              ratio: number
              top: number
            } => idsSet.has(item.id as SectionId),
          )

        if (intersecting.length === 0) return

        intersecting.sort((a, b) => {
          if (b.ratio !== a.ratio) return b.ratio - a.ratio
          if (Math.abs(a.top) !== Math.abs(b.top)) {
            return Math.abs(a.top) - Math.abs(b.top)
          }
          return a.id.localeCompare(b.id)
        })

        const next = intersecting[0].id
        setActiveSection((prev) => (prev === next ? prev : next))
      },
      {
        root: null,
        threshold: 0.6,
      },
    )

    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [pathname])

  useEffect(() => {
    if (pathname === "/admin") return

    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "")
      const maybeId = hash as SectionId
      if (
        (sectionNavLinks as readonly { id: SectionId }[]).some(
          (l) => l.id === maybeId,
        )
      ) {
        setActiveSection(maybeId)
      }
    }

    handleHashChange()
    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [pathname])

  const indicatorBgClass =
    isAdmin && activeNavId === "admin"
      ? "bg-red-500/15 dark:bg-red-400/15"
      : "bg-foreground/10 dark:bg-white/10"

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/60 backdrop-blur-md dark:border-white/5 dark:bg-neutral-900/60">
      <div className="grid h-14 w-full grid-cols-[auto_1fr_auto] items-center md:h-16">
        <div className="flex items-center pl-4 xl:pl-8">
          <Link
            href="/"
            prefetch={disableHomePrefetch ? false : undefined}
            className="transition-opacity hover:opacity-80"
            aria-label="Airbnkey — accueil"
          >
            <Image
              src="/favicon.svg"
              alt="Airbnkey"
              width={28}
              height={28}
              className="rounded-md"
            />
          </Link>
        </div>

        <div className="flex min-w-0 justify-center md:hidden">
          {isAdmin ? (
            <Link
              href="/admin"
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                pathname === "/admin"
                  ? "text-red-500"
                  : "text-red-500/80 hover:text-red-500",
              )}
            >
              Modifier
            </Link>
          ) : null}
        </div>

        <nav
          className="hidden min-w-0 justify-self-center md:flex"
          aria-label="Navigation principale"
        >
          <div
            ref={linksWrapperRef}
            className="relative flex items-center gap-6 md:gap-8"
          >
            <span
              ref={indicatorRef}
              aria-hidden
              className={`pointer-events-none absolute top-1/2 left-0 z-0 -translate-y-1/2 rounded-lg ${indicatorBgClass} transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]`}
            />

            {navLinks.map(({ id, href, label }) => {
              const isActive = id === activeNavId
              const isAdminLink = id === "admin"
              const className =
                isActive
                  ? isAdminLink
                    ? "relative z-10 font-medium text-red-500 opacity-100"
                    : "relative z-10 font-medium text-foreground opacity-100"
                  : isAdminLink
                    ? "relative z-10 text-red-500/70 transition-colors duration-200 hover:text-red-500"
                    : "relative z-10 text-foreground/70 transition-colors duration-200 hover:text-foreground"
              return (
                <Link
                  key={href}
                  ref={(el) => {
                    linkRefs.current[id] = el
                  }}
                  href={href}
                  prefetch={
                    !isAdminLink && disableHomePrefetch ? false : undefined
                  }
                  onClick={() => {
                    if (id !== "admin") setActiveSection(id)
                  }}
                  className={className}
                >
                  <span className="text-[15px] tracking-tight md:text-base">
                    {label}
                  </span>
                </Link>
              )
            })}
          </div>
        </nav>

        <div className="flex items-center justify-end pr-4 xl:pr-8">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
