"use client"

import type { FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

type HomeContactSectionProps = {
  message: string
  isSubmitting: boolean
  onMessageChange: (message: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function HomeContactSection({
  message,
  isSubmitting,
  onMessageChange,
  onSubmit,
}: HomeContactSectionProps) {
  return (
    <section id="contact" className="scroll-mt-20 space-y-5 py-16">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
        Contact
      </h2>
      <p className="max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
        Une question sur un logement ou une disponibilité ? Laissez-nous un
        message, nous vous répondrons dans les meilleurs délais.
      </p>
      <form onSubmit={onSubmit} className="max-w-xl space-y-4">
        <Textarea
          id="contact-message"
          name="message"
          value={message}
          onChange={(event) => onMessageChange(event.target.value)}
          placeholder="Votre message…"
          required
          minLength={5}
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
  )
}
