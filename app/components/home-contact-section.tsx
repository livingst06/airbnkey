"use client"

import type { FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

type HomeContactSectionProps = {
  message: string
  isSignedIn: boolean
  isSubmitting: boolean
  onMessageChange: (message: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function HomeContactSection({
  message,
  isSignedIn,
  isSubmitting,
  onMessageChange,
  onSubmit,
}: HomeContactSectionProps) {
  return (
    <section id="contact" className="scroll-mt-20 py-14 md:py-18">
      <div className="grid gap-8 rounded-[2rem] border border-border/55 bg-card/55 p-6 shadow-[0_14px_30px_rgba(16,18,24,0.08)] md:p-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-[-0.02em] text-foreground md:text-3xl">
            Contact
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground/95 md:text-lg">
            Have a question about an apartment or availability? Leave us a message
            and we will reply as soon as possible.
          </p>
        </div>
        <form onSubmit={onSubmit} className="max-w-xl space-y-4">
          <Textarea
            id="contact-message"
            name="message"
            value={message}
            onChange={(event) => onMessageChange(event.target.value)}
            placeholder="Your message..."
            required
            minLength={5}
            rows={5}
            aria-label="Message"
            className="rounded-xl border border-border/75 bg-background/85 text-base placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-primary/20"
          />
          <Button
            type="submit"
            disabled={isSubmitting || !isSignedIn}
            className="w-full rounded-xl text-base font-medium disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Sending..." : "Send"}
          </Button>
          {!isSignedIn ? (
            <p className="text-sm text-muted-foreground">
              You need to sign in to use the contact form.
            </p>
          ) : null}
        </form>
      </div>
    </section>
  )
}
