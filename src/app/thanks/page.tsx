import Link from "next/link";
import { Check } from "lucide-react";
import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";
import { FLIGHT_CHECK } from "@/lib/upgrades";
import { Wordmark } from "@/components/marketing/site-chrome";

/**
 * Where Stripe returns a buyer after a successful seat checkout.
 *
 * Deliberately thin, and deliberately not a receipt. Stripe has already
 * emailed them one and it is authoritative; a second page restating an amount
 * is a chance for this codebase to disagree with the thing that actually took
 * the money. What this page owes them is the one fact Stripe cannot tell
 * them — what happens next, and by when.
 *
 * It reads no session and calls no API. The subscription is confirmed by the
 * webhook, not by whether somebody's browser followed a redirect, so there is
 * nothing here worth fetching and nothing to get wrong if they close the tab.
 */
export const metadata: Metadata = {
  title: `Seat confirmed — ${BRAND.name}`,
  robots: { index: false, follow: false },
};

export default function Thanks() {
  return (
    <div className="relative min-h-screen">
      <header className="border-b border-white/[0.06]">
        <div className="container flex h-[4.5rem] items-center">
          <Wordmark />
        </div>
      </header>

      <main className="container py-20 sm:py-28">
        <div className="mx-auto max-w-2xl">
          <span className="inline-grid h-12 w-12 place-items-center rounded-full border border-signal/40 bg-signal/10">
            <Check className="h-6 w-6 text-signal" />
          </span>

          <h1 className="mt-7 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            That&rsquo;s the seat booked.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Stripe has your receipt and the subscription is live. Nothing else is needed from you
            right now — the next move is ours.
          </p>

          <ol className="mt-10 space-y-5 border-t border-white/[0.07] pt-8">
            {[
              [
                "Within one business day",
                "A human emails you to confirm the specifics — your number, your calendar, your Google Business Profile, whichever the seat needs to start.",
              ],
              [
                "Then the shift starts",
                "The operator goes on duty as soon as it has what it needs. You get the war room and one point of contact, same as any flight plan.",
              ],
              [
                FLIGHT_CHECK.label,
                FLIGHT_CHECK.body,
              ],
            ].map(([h, b], i) => (
              <li key={h} className="flex gap-4">
                <span className="hud-value mt-0.5 shrink-0 text-sm text-cyan">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h2 className="font-heading text-lg font-semibold tracking-tight">{h}</h2>
                  <p className="mt-1.5 text-[0.92rem] leading-relaxed text-muted-foreground">{b}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/" className="pill-ghost text-sm">
              Back to the board
            </Link>
            <a href={`mailto:${BRAND.parent.email}`} className="pill-ghost text-sm">
              {BRAND.parent.email}
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
