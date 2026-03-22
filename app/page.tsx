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
    <main className="mx-auto min-h-screen max-w-6xl px-4 pb-8 pt-20">
      <div className="space-y-8">
        <section className="mt-6">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Locations d’appartements à Cannes
          </p>
        </section>

        <section id="appartements" className="scroll-mt-20">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <section>
              <ApartmentGrid
                selectedApartmentId={selectedApartmentId}
                setSelectedApartmentId={setSelectedApartmentId}
                dialogApartmentId={dialogApartmentId}
                setDialogApartmentId={setDialogApartmentId}
              />
            </section>

            <section className="hidden lg:block">
              <div className="sticky top-20 h-[calc(100vh-7rem)]">
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

        <section id="about" className="scroll-mt-20">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
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
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border">
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

        <section id="contact" className="scroll-mt-20">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Contact
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Une question sur un logement ou une disponibilité ? Laissez-nous un
            message, nous vous répondrons dans les meilleurs délais.
          </p>
          <form
            onSubmit={handleSubmit}
            className="mt-6 flex max-w-xl flex-col gap-3"
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
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Envoi…" : "Envoyer"}
            </Button>
          </form>
        </section>
      </div>
    </main>
  )
}
