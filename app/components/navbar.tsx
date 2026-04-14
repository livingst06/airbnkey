"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"

import { useAdminUi } from "@/app/components/admin-ui-context"
import { ThemeToggle } from "@/components/theme-toggle"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client"
import { cn } from "@/lib/utils"

const sectionNavLinks = [
  { id: "apartments", href: "/#apartments", label: "Apartments" },
  { id: "about", href: "/#about", label: "About" },
  { id: "contact", href: "/#contact", label: "Contact" },
] as const

type SectionId = (typeof sectionNavLinks)[number]["id"]
type NavId = SectionId

function AdminModeToggle() {
  const { isAdminEligible, isAdminMode, toggleAdminMode } = useAdminUi()

  if (!isAdminEligible) return null

  return (
    <button
      type="button"
      onClick={toggleAdminMode}
      aria-label={
        isAdminMode ? "Disable admin mode" : "Enable admin mode"
      }
      aria-pressed={isAdminMode}
      className={cn(
        "relative z-[100] flex h-8 shrink-0 items-center rounded-full border px-3 text-xs font-medium shadow-sm backdrop-blur-md transition-colors duration-200",
        isAdminMode
          ? "border-orange-500/35 bg-orange-500/15 text-orange-700 dark:text-orange-300"
          : "border-border/70 bg-card/70 text-foreground/80",
      )}
    >
      Admin
    </button>
  )
}

type OAuthProvider = "google" | "facebook" | "apple"

function resolveAuthRedirectOrigin() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  const siteOrigin = (() => {
    if (!siteUrl) return null
    try {
      return new URL(siteUrl).origin
    } catch {
      return null
    }
  })()

  if (typeof window === "undefined") return siteOrigin

  const currentOrigin = window.location.origin
  const hostname = window.location.hostname
  const isLocalhost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1"

  // In production-like contexts, prefer the canonical site origin
  // to avoid accidental fallback to localhost-based auth setup.
  if (!isLocalhost && siteOrigin) {
    return siteOrigin
  }

  return currentOrigin
}

function AuthControls() {
  const { isSignedIn, userEmail, setAdminMode } = useAdminUi()
  const router = useRouter()
  const pathname = usePathname()
  const [pendingAction, setPendingAction] = useState<OAuthProvider | "signout" | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (menuRef.current?.contains(target)) return
      setMenuOpen(false)
    }
    window.addEventListener("pointerdown", onPointerDown)
    return () => window.removeEventListener("pointerdown", onPointerDown)
  }, [menuOpen])

  const signInWithProvider = useCallback(
    async (provider: OAuthProvider) => {
      if (pendingAction) return
      setPendingAction(provider)
      try {
        const supabase = getSupabaseBrowserClient()
        const origin = resolveAuthRedirectOrigin()
        if (!origin) {
          throw new Error("Sign-in unavailable: missing NEXT_PUBLIC_SITE_URL")
        }
        const nextPath = pathname || "/"
        const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: { redirectTo },
        })
        if (error) throw error
        setMenuOpen(false)
        setPendingAction(null)
      } catch (error) {
        const message =
          error instanceof Error && error.message.trim()
            ? error.message
            : "Sign-in failed"
        toast.error(message)
        setPendingAction(null)
      }
    },
    [pathname, pendingAction],
  )

  const signOut = useCallback(async () => {
    if (pendingAction) return
    setPendingAction("signout")
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setAdminMode(false)
      setPendingAction(null)
      router.refresh()
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : "Sign-out failed"
      toast.error(message)
      setPendingAction(null)
    }
  }, [pendingAction, router, setAdminMode])

  if (isSignedIn) {
    return (
      <div className="flex items-center gap-2">
        {userEmail ? (
          <span className="hidden max-w-[12rem] truncate text-xs text-muted-foreground md:inline">
            {userEmail}
          </span>
        ) : null}
        <button
          type="button"
          onClick={signOut}
          disabled={pendingAction !== null}
          className="rounded-full border border-border/70 bg-card/75 px-3 py-1.5 text-xs font-medium text-foreground/85 shadow-sm backdrop-blur-md transition-colors duration-200 hover:bg-card disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pendingAction === "signout" ? "Signing out..." : "Sign out"}
        </button>
      </div>
    )
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((prev) => !prev)}
        disabled={pendingAction !== null}
        className="rounded-full border border-border/70 bg-card/75 px-3 py-1.5 text-xs font-medium text-foreground/85 shadow-sm backdrop-blur-md transition-colors duration-200 hover:bg-card disabled:cursor-not-allowed disabled:opacity-60"
      >
        Sign in
      </button>

      {menuOpen ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-[110] min-w-48 rounded-2xl border border-border/70 bg-card/95 p-2 shadow-[0_20px_42px_rgba(16,18,24,0.18)] backdrop-blur-md">
          <button
            type="button"
            onClick={() => void signInWithProvider("google")}
            disabled={pendingAction !== null}
            className="w-full rounded-xl px-3 py-2 text-left text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingAction === "google"
              ? "Connecting to Google..."
              : "Continue with Google"}
          </button>
          <button
            type="button"
            onClick={() => void signInWithProvider("facebook")}
            disabled={pendingAction !== null}
            className="w-full rounded-xl px-3 py-2 text-left text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingAction === "facebook"
              ? "Connecting to Facebook..."
              : "Continue with Facebook"}
          </button>
          <button
            type="button"
            onClick={() => void signInWithProvider("apple")}
            disabled={pendingAction !== null}
            className="w-full rounded-xl px-3 py-2 text-left text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingAction === "apple"
              ? "Connecting to Apple..."
              : "Continue with Apple"}
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function Navbar() {
  const navLinks = useMemo(() => sectionNavLinks, [])

  const [activeSection, setActiveSection] = useState<SectionId>("apartments")
  const activeNavIdRef = useRef<NavId>("apartments")

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

  const activeNavId: NavId = activeSection

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
  }, [])

  useEffect(() => {
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
  }, [])

  const indicatorBgClass = "bg-accent/85"

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/78 backdrop-blur-xl">
      <div className="grid h-14 w-full grid-cols-[auto_1fr_auto] items-center md:h-16">
        <div className="flex items-center pl-4 xl:pl-8">
          <Link
            href="/"
            className="transition-opacity hover:opacity-80"
            aria-label="Airbnkey home"
          >
            <Image
              src="/favicon.svg"
              alt="Airbnkey"
              width={28}
              height={28}
              className="rounded-md"
              style={{ width: 28, height: 28 }}
            />
          </Link>
        </div>

        <div className="flex min-w-0 justify-center md:hidden" />

        <nav
          className="hidden min-w-0 justify-self-center md:flex"
          aria-label="Main navigation"
        >
          <div
            ref={linksWrapperRef}
            className="relative flex items-center gap-6 rounded-full border border-border/60 bg-card/55 px-2 py-1 md:gap-8"
          >
            <span
              ref={indicatorRef}
              aria-hidden
              className={`pointer-events-none absolute top-1/2 left-0 z-0 -translate-y-1/2 rounded-full ${indicatorBgClass} transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]`}
            />

            {navLinks.map(({ id, href, label }) => {
              const isActive = id === activeNavId
              const className =
                isActive
                  ? "relative z-10 font-medium text-foreground opacity-100"
                  : "relative z-10 text-foreground/60 transition-colors duration-200 hover:text-foreground"
              return (
                <Link
                  key={href}
                  ref={(el) => {
                    linkRefs.current[id] = el
                  }}
                  href={href}
                  onClick={() => {
                    setActiveSection(id)
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

        <div className="flex items-center justify-end gap-2 pr-4 xl:pr-8">
          <AuthControls />
          <AdminModeToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
