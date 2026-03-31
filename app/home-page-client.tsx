"use client"

import Image from "next/image"
import {
  type FormEvent,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react"
import { toast } from "sonner"

import type { HoverSource } from "@/types/hover"
import type { DialogAnchorRect } from "@/types/apartments"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import { ApartmentGrid } from "./components/apartment-grid"
import { ApartmentMap } from "./components/apartment-map"
import { FilterBar, type ApartmentSort } from "./components/filter-bar"
import { useApartments } from "./components/apartments-context"

export function HomePageClient() {
  const { apartments } = useApartments()

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

  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search)
  const [bedsMin, setBedsMin] = useState<number | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sort, setSort] = useState<ApartmentSort>("default")

  const availableTags = useMemo(() => {
    const seen = new Map<string, string>()
    for (const a of apartments) {
      for (const raw of a.advantages) {
        const trimmed = raw.trim()
        if (!trimmed) continue
        const key = trimmed.toLowerCase()
        if (!seen.has(key)) seen.set(key, trimmed)
      }
    }
    return Array.from(seen.entries())
      .sort(([a], [b]) => a.localeCompare(b, "fr"))
      .map(([key, label]) => ({ key, label }))
  }, [apartments])

  const filteredApartments = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase()
    return apartments.filter((a) => {
      if (q) {
        const title = a.title.toLowerCase()
        const desc = a.description.toLowerCase()
        if (!title.includes(q) && !desc.includes(q)) return false
      }
      if (bedsMin !== null) {
        const b = Number(a.beds)
        if (!Number.isFinite(b) || b < bedsMin) return false
      }
      if (selectedTags.length > 0) {
        const advKeys = new Set(
          a.advantages
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean),
        )
        const matches = selectedTags.some((t) => advKeys.has(t))
        if (!matches) return false
      }
      return true
    })
  }, [apartments, deferredSearch, bedsMin, selectedTags])

  const sortedApartments = useMemo(() => {
    const list = [...filteredApartments]
    if (sort === "beds_asc") {
      list.sort(
        (a, b) => a.beds - b.beds || a.title.localeCompare(b.title, "fr"),
      )
    } else if (sort === "beds_desc") {
      list.sort(
        (a, b) => b.beds - a.beds || a.title.localeCompare(b.title, "fr"),
      )
    }
    return list
  }, [filteredApartments, sort])

  const listAnimKey = `${sort}:${[...filteredApartments].map((a) => a.id).sort().join("|")}`

  useEffect(() => {
    const ids = new Set(filteredApartments.map((a) => a.id))
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
    filteredApartments,
    selectedApartmentId,
    dialogApartmentId,
    hoveredApartmentId,
    openApartmentDialog,
  ])

  const toggleTag = useCallback((key: string) => {
    setSelectedTags((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )
  }, [])

  const resetFilters = useCallback(() => {
    setSearch("")
    setBedsMin(null)
    setSelectedTags([])
    setSort("default")
  }, [])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      })
      if (res.ok) {
        toast.success("Message envoyé")
        setMessage("")
      } else {
        toast.error("Envoi impossible, réessayez plus tard.")
      }
    } catch {
      toast.error("Envoi impossible, réessayez plus tard.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-none px-3 pb-8 pt-6 sm:px-5 lg:px-6 2xl:px-10">
      <div className="space-y-10 md:space-y-16">
        <section className="mt-6 text-center md:text-left">
          <h1 className="text-[1.875rem] font-semibold leading-[1.1] tracking-tight text-foreground sm:text-[2rem] md:text-[2.125rem]">
            Airbnkey
          </h1>
          <p className="mt-4 max-w-xl text-[15px] font-normal leading-relaxed text-muted-foreground md:mt-3">
            Locations d’appartements à Cannes
          </p>
        </section>

        <section
          id="appartements"
          className="scroll-mt-20 max-lg:flex max-lg:flex-col"
        >
          <div
            className={cn(
              "grid min-h-0 grid-cols-1 items-stretch gap-6",
              "max-lg:flex max-lg:flex-col max-lg:min-h-0",
              "lg:h-[calc(100vh-6rem)] lg:grid lg:grid-cols-[minmax(280px,0.42fr)_minmax(0,1fr)] lg:gap-8 lg:overflow-hidden",
              "2xl:grid-cols-[minmax(300px,0.38fr)_minmax(0,1fr)]",
            )}
          >
            <section
              className={cn(
                "order-1 flex min-h-0 min-w-0 flex-col pr-0 sm:pr-1 lg:h-full lg:pr-2",
                "max-lg:min-h-0 lg:flex-1",
              )}
            >
              <div className="flex shrink-0 flex-col gap-5 border-b border-border/40 pb-3 max-lg:mb-0 lg:mb-0 lg:border-b-0 lg:pb-0">
                <FilterBar
                  search={search}
                  onSearchChange={setSearch}
                  bedsMin={bedsMin}
                  onBedsMinChange={setBedsMin}
                  selectedTags={selectedTags}
                  onToggleTag={toggleTag}
                  availableTags={availableTags}
                  sort={sort}
                  onSortChange={setSort}
                  onReset={resetFilters}
                />
                <p className="mb-0 text-xs font-medium tabular-nums leading-normal tracking-normal text-muted-foreground lg:mb-4">
                  {sortedApartments.length === 0
                    ? "0 appartement trouvé"
                    : sortedApartments.length === 1
                      ? "1 appartement trouvé"
                      : `${sortedApartments.length} appartements trouvés`}
                </p>
              </div>
              <div
                className="@container min-h-0 pt-1 max-lg:pb-6 max-lg:pt-2 lg:flex-1 lg:overflow-y-auto lg:scroll-smooth lg:overscroll-y-contain"
                data-list-scroll
              >
                <div
                  key={listAnimKey}
                  className="animate-in fade-in-0 zoom-in-95 duration-300 max-lg:pb-1"
                >
                  <ApartmentGrid
                    apartments={sortedApartments}
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
                    onResetFilters={resetFilters}
                  />
                </div>
              </div>
            </section>

            <section
              className={cn(
                "order-2 flex w-full min-w-0 shrink-0 flex-col lg:order-none lg:h-full lg:min-h-0",
              )}
            >
              <div
                className={cn(
                  "w-full overflow-hidden rounded-2xl border border-white/10 shadow-xl dark:border-white/5",
                  "max-lg:h-[clamp(15rem,56dvh,28rem)] max-lg:min-h-[15rem] max-lg:shrink-0",
                  "lg:h-full lg:min-h-0 lg:flex-1 lg:shrink-0",
                )}
              >
                <ApartmentMap
                  apartments={sortedApartments}
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

        <section id="about" className="scroll-mt-20 py-16">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="max-w-lg space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                À propos
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Airbnkey sélectionne des appartements à Cannes pour des séjours
                agréables : emplacements pratiques, logements équipés et
                accompagnement simple du premier contact au départ.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Notre objectif est de rendre la location courte durée claire et
                sereine, avec des informations utiles et une présentation
                transparente de chaque bien.
              </p>
            </div>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-lg transition-transform duration-300 hover:scale-[1.01]">
              <Image
                src="/apartments/apt1/1.png"
                alt="Salon lumineux d’un appartement à Cannes"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 480px, 100vw"
                priority={false}
              />
            </div>
          </div>
        </section>

        <section id="contact" className="scroll-mt-20 space-y-5 py-16">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Contact
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Une question sur un logement ou une disponibilité ? Laissez-nous un
            message, nous vous répondrons dans les meilleurs délais.
          </p>
          <form
            onSubmit={handleSubmit}
            className="max-w-xl space-y-4"
          >
            <Textarea
              id="contact-message"
              name="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Votre message…"
              required
              rows={5}
              aria-label="Message"
              className="text-base placeholder:text-muted-foreground/70 rounded-xl border border-border bg-background/50 backdrop-blur focus:ring-2 focus:ring-primary/20"
            />
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl text-base font-medium disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Envoi..." : "Envoyer"}
            </Button>
          </form>
        </section>
      </div>
    </main>
  )
}
