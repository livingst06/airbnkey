"use client"

import Image from "next/image"
import { type FormEvent, useState } from "react"
import { toast } from "sonner"

import { apartments } from "@/data/apartments"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

import { ApartmentGrid } from "./components/apartment-grid"
import { ApartmentMap } from "./components/apartment-map"

export default function HomePage() {
  const [selectedApartmentId, setSelectedApartmentId] = useState<
    string | null
  >(null)
  const [dialogApartmentId, setDialogApartmentId] = useState<string | null>(
    null,
  )
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    <main className="mx-auto min-h-screen max-w-[1400px] px-4 pb-8 pt-6 xl:max-w-[1600px] xl:px-12">
      <div className="space-y-10 md:space-y-16">
        <section className="mt-6 text-center md:text-left">
          <h1 className="text-2xl font-semibold text-foreground">
            Airbnkey
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Locations d’appartements à Cannes
          </p>
        </section>

        <section id="appartements" className="scroll-mt-20">
          <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-[1fr_2fr] xl:gap-12">
            <section className="min-h-0 min-w-0 lg:h-full">
              <ApartmentGrid
                selectedApartmentId={selectedApartmentId}
                setSelectedApartmentId={setSelectedApartmentId}
                dialogApartmentId={dialogApartmentId}
                setDialogApartmentId={setDialogApartmentId}
              />
            </section>

            <section className="hidden h-full min-h-[600px] min-w-0 w-full lg:block lg:min-h-[700px] xl:min-h-[760px]">
              <div className="sticky top-24 h-full min-h-[600px] w-full overflow-hidden rounded-2xl border border-white/10 shadow-xl dark:border-white/5 lg:min-h-[700px] xl:min-h-[760px]">
                <ApartmentMap
                  apartments={apartments}
                  selectedApartmentId={selectedApartmentId}
                  setSelectedApartmentId={setSelectedApartmentId}
                  dialogApartmentId={dialogApartmentId}
                  setDialogApartmentId={setDialogApartmentId}
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
              className="w-full rounded-xl text-base font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Envoi…" : "Envoyer"}
            </Button>
          </form>
        </section>
      </div>
    </main>
  )
}
