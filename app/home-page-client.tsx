"use client"

import dynamic from "next/dynamic"
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { useAdminUi } from "@/app/components/admin-ui-context"
import { useMapLayout } from "@/app/components/map-layout-context"
import type { HoverSource } from "@/types/hover"
import type { DialogAnchorRect } from "@/types/apartments"
import { cn } from "@/lib/utils"

import { ApartmentGrid } from "./components/apartment-grid"
import { HomeAboutSection } from "./components/home-about-section"
import { HomeContactSection } from "./components/home-contact-section"
import {
  APARTMENTS_LOCAL_ORDER_KEY,
  APARTMENTS_NEEDS_SYNC_KEY,
  APARTMENTS_SYNC_EVENT,
  applyApartmentOrder,
  clearApartmentOrderPersistence,
  useApartments,
} from "./components/apartments-context"

const ApartmentMap = dynamic(
  () => import("./components/apartment-map").then((mod) => mod.ApartmentMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-card text-sm text-muted-foreground">
        Loading map...
      </div>
    ),
  },
)

export function HomePageClient() {
  const { isAdminMode, isSignedIn } = useAdminUi()
  const { mapOnly } = useMapLayout()
  const { apartments, syncFromDb } = useApartments()
  const [localOrderedIds, setLocalOrderedIds] = useState<string[] | null>(null)

  const [selectedApartmentId, setSelectedApartmentId] = useState<
    string | null
  >(null)
  const [dialogApartmentId, setDialogApartmentId] = useState<string | null>(
    null,
  )
  const [dialogAnchorRect, setDialogAnchorRect] =
    useState<DialogAnchorRect | null>(null)

  const openApartmentDialog = useCallback(
    (id: string | null, anchor?: DialogAnchorRect | null) => {
      setDialogApartmentId(id)
      setDialogAnchorRect(anchor ?? null)
    },
    [],
  )
  const [hoveredApartmentId, setHoveredApartmentId] = useState<string | null>(
    null,
  )
  const [hoverSource, setHoverSource] = useState<HoverSource>(null)
  const [hoverLock, setHoverLock] = useState(false)
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const readStoredOrder = useCallback(() => {
    if (typeof window === "undefined") return null

    const raw = window.sessionStorage.getItem(APARTMENTS_LOCAL_ORDER_KEY)
    if (!raw) return null

    try {
      const parsed = JSON.parse(raw) as { id: string; position: number }[]
      if (!Array.isArray(parsed)) return null
      const ordered = [...parsed].sort((a, b) => a.position - b.position)
      return ordered.map((row) => row.id)
    } catch {
      return null
    }
  }, [])

  const uiApartments = useMemo(() => {
    if (!localOrderedIds) return apartments
    const ordered = localOrderedIds.map((id, position) => ({ id, position }))
    return applyApartmentOrder(apartments, ordered)
  }, [apartments, localOrderedIds])

  const listAnimKey = [...uiApartments].map((a) => a.id).sort().join("|")

  useEffect(() => {
    if (typeof window === "undefined") return

    let cancelled = false

    const applyStoredOrder = () => {
      setLocalOrderedIds(readStoredOrder())
    }

    const syncIfNeeded = async () => {
      if (window.sessionStorage.getItem(APARTMENTS_NEEDS_SYNC_KEY) !== "1") return
      try {
        await syncFromDb()
        if (!cancelled) {
          clearApartmentOrderPersistence()
          setLocalOrderedIds(null)
        }
      } catch {
        if (!cancelled) toast.error("Apartment refresh failed")
      }
    }

    applyStoredOrder()
    void syncIfNeeded()

    const handlePageShow = () => {
      applyStoredOrder()
      void syncIfNeeded()
    }

    const handleSyncNeeded = () => {
      applyStoredOrder()
      void syncIfNeeded()
    }

    window.addEventListener("pageshow", handlePageShow)
    window.addEventListener(APARTMENTS_SYNC_EVENT, handleSyncNeeded)
    return () => {
      cancelled = true
      window.removeEventListener("pageshow", handlePageShow)
      window.removeEventListener(APARTMENTS_SYNC_EVENT, handleSyncNeeded)
    }
  }, [readStoredOrder, syncFromDb])

  useEffect(() => {
    const ids = new Set(uiApartments.map((a) => a.id))
    if (selectedApartmentId && !ids.has(selectedApartmentId)) {
      setSelectedApartmentId(null)
    }
    if (dialogApartmentId && !ids.has(dialogApartmentId)) {
      openApartmentDialog(null)
      setHoverLock(false)
    }
    if (hoveredApartmentId && !ids.has(hoveredApartmentId)) {
      setHoveredApartmentId(null)
      setHoverSource(null)
    }
  }, [
    uiApartments,
    selectedApartmentId,
    dialogApartmentId,
    hoveredApartmentId,
    openApartmentDialog,
  ])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!isSignedIn) {
      toast.error("Please sign in to send a message.")
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      })
      if (res.ok) {
        toast.success("Message sent")
        setMessage("")
      } else {
        const payload = (await res.json().catch(() => null)) as {
          error?: unknown
        } | null
        const messageFromApi =
          payload && typeof payload.error === "string" ? payload.error : null
        toast.error(messageFromApi ?? "Sending failed, please try again later.")
      }
    } catch {
      toast.error("Sending failed, please try again later.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-none px-3 pb-10 pt-6 sm:px-5 lg:px-7 2xl:px-12">
      <div className="space-y-12 md:space-y-[4.5rem]">
        <section
          id="apartments"
          className="scroll-mt-20 max-lg:flex max-lg:flex-col"
        >
          <div
            className={cn(
              "grid min-h-0 grid-cols-1 items-stretch gap-6",
              "max-lg:flex max-lg:flex-col max-lg:min-h-0",
              "lg:h-[calc(100vh-6rem)] lg:grid lg:gap-8 lg:overflow-hidden",
              "xl:h-[calc(100vh-7.5rem)] xl:gap-6",
              mapOnly
                ? "lg:grid-cols-1 xl:grid-cols-1"
                : "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]",
            )}
          >
            <section
              className={cn(
                "order-1 flex min-h-0 min-w-0 flex-col pr-0 sm:pr-1 lg:order-1 lg:h-full lg:pr-2",
                "max-lg:min-h-0 lg:flex-1",
                mapOnly && "hidden",
              )}
            >
              <div className="flex shrink-0 flex-col gap-4 border-b border-border/45 pb-3 max-lg:mb-0 lg:mb-0 lg:border-b-0 lg:pb-0 xl:gap-3">
                <div className="flex items-end justify-end gap-4 xl:px-1">
                  <p className="mb-0 whitespace-nowrap text-xs font-medium tabular-nums leading-normal tracking-normal text-muted-foreground">
                    {uiApartments.length === 0
                      ? "0 apartments"
                      : uiApartments.length === 1
                        ? "1 apartment"
                        : `${uiApartments.length} apartments`}
                  </p>
                </div>
              </div>
              <div
                className="@container no-scrollbar min-h-0 pt-1 max-lg:pb-6 max-lg:pt-2 lg:flex-1 lg:overflow-y-auto lg:scroll-smooth lg:overscroll-y-contain"
                data-list-scroll
              >
                <div
                  key={listAnimKey}
                  className="animate-in fade-in-0 duration-300 max-lg:pb-1"
                >
                  <ApartmentGrid
                    apartments={uiApartments}
                    adminMode={isAdminMode}
                    selectedApartmentId={selectedApartmentId}
                    setSelectedApartmentId={setSelectedApartmentId}
                    dialogApartmentId={dialogApartmentId}
                    dialogAnchorRect={dialogAnchorRect}
                    openApartmentDialog={openApartmentDialog}
                    hoveredApartmentId={hoveredApartmentId}
                    setHoveredApartmentId={setHoveredApartmentId}
                    hoverSource={hoverSource}
                    setHoverSource={setHoverSource}
                    hoverLock={hoverLock}
                  />
                </div>
              </div>
            </section>

            <section
              className={cn(
                "order-2 flex w-full min-w-0 shrink-0 flex-col lg:order-2 lg:h-full lg:min-h-0",
              )}
            >
              <div
                className={cn(
                  "w-full overflow-hidden rounded-2xl border border-border/55 bg-card/45 shadow-[0_22px_54px_rgba(16,18,24,0.16)] xl:rounded-[2rem]",
                  mapOnly
                    ? "max-lg:h-[calc(100dvh-6rem)] max-lg:min-h-[16rem] max-lg:shrink-0"
                    : "max-lg:h-[clamp(15rem,56dvh,28rem)] max-lg:min-h-[15rem] max-lg:shrink-0",
                  "lg:h-full lg:min-h-0 lg:flex-1 lg:shrink-0",
                )}
              >
                <ApartmentMap
                  apartments={uiApartments}
                  selectedApartmentId={selectedApartmentId}
                  hoveredApartmentId={hoveredApartmentId}
                  setSelectedApartmentId={setSelectedApartmentId}
                  dialogApartmentId={dialogApartmentId}
                  openApartmentDialog={openApartmentDialog}
                  setHoveredApartmentId={setHoveredApartmentId}
                  setHoverSource={setHoverSource}
                  hoverLock={hoverLock}
                  setHoverLock={setHoverLock}
                />
              </div>
            </section>
          </div>
        </section>

        <HomeAboutSection />
        <HomeContactSection
          message={message}
          isSignedIn={isSignedIn}
          isSubmitting={isSubmitting}
          onMessageChange={setMessage}
          onSubmit={handleSubmit}
        />
      </div>
    </main>
  )
}
