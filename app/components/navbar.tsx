"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from "react"

import { ThemeToggle } from "@/components/theme-toggle"

const navLinks = [
  { id: "appartements", href: "#appartements", label: "Appartements" },
  { id: "about", href: "#about", label: "À propos" },
  { id: "contact", href: "#contact", label: "Contact" },
] as const

export function Navbar() {
  const sections = useMemo(() => navLinks.map((l) => l.id), [])
  const [activeSection, setActiveSection] = useState<(typeof sections)[number]>(
    "appartements",
  )
  const activeSectionRef = useRef(activeSection)

  const indicatorRef = useRef<HTMLSpanElement | null>(null)
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({})
  const linksWrapperRef = useRef<HTMLDivElement | null>(null)
  const updateIndicator = useCallback(() => {
    const indicator = indicatorRef.current
    const el = linkRefs.current[activeSectionRef.current]
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

  useLayoutEffect(() => {
    activeSectionRef.current = activeSection
    updateIndicator()
  }, [activeSection, updateIndicator])

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
    // IntersectionObserver (IDs string uniquement, sans logique index).
    const ids = ["appartements", "about", "contact"] as const
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
            (item): item is { id: (typeof ids)[number]; ratio: number; top: number } =>
              idsSet.has(item.id as (typeof ids)[number]),
          )

        if (intersecting.length === 0) return

        // Déterministe: section la plus "visible" (intersectionRatio), puis
        // tie-break stable par position.
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
  }, [])

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "")
      if (sections.includes(hash as (typeof sections)[number])) {
        setActiveSection(hash as (typeof sections)[number])
      }
    }

    handleHashChange()
    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [sections])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/60 backdrop-blur-md dark:border-white/5 dark:bg-neutral-900/60">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 md:h-16 xl:max-w-[1600px] xl:px-12">
        <Link
          href="/"
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
        <div className="flex items-center gap-4 md:gap-6">
          <nav
            className="hidden items-center md:flex md:gap-8"
            aria-label="Navigation principale"
          >
            <div ref={linksWrapperRef} className="relative flex items-center gap-6 md:gap-8">
              <span
                ref={indicatorRef}
                aria-hidden
                className="absolute top-1/2 left-0 z-0 -translate-y-1/2 rounded-lg bg-foreground/10 dark:bg-white/10 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] pointer-events-none"
              />

              {navLinks.map(({ id, href, label }) => {
                const isActive = id === activeSection
                return (
                  <a
                    key={href}
                    ref={(el) => {
                      linkRefs.current[id] = el
                    }}
                    href={href}
                    onClick={() => setActiveSection(id)}
                    className={
                      isActive
                        ? "text-foreground font-medium opacity-100 relative z-10"
                        : "text-foreground/70 hover:text-foreground transition-colors duration-200 relative z-10"
                    }
                  >
                    <span className="text-[15px] tracking-tight md:text-base">{label}</span>
                  </a>
                )
              })}
            </div>
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
