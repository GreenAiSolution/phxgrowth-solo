import Link from "next/link";
import { ArrowRight, ArrowUpRight, Minus } from "lucide-react";
import { BRAND } from "@/lib/brand";
import {
  FAIR_QUESTIONS,
  FLIGHT_CHECK,
  FLIGHT_PLANS,
  LOCKED,
  PROOF_POSTURE,
  THESIS,
  UPGRADES,
  entryPrice,
} from "@/lib/upgrades";
import { formatCurrency } from "@/lib/utils";
import { env } from "@/lib/env";
import { Enquiry } from "@/components/marketing/enquiry";
import { Pulse } from "@/components/marketing/pulse";
import { Wordmark } from "@/components/marketing/site-chrome";
import { SystemField } from "@/components/marketing/system-field";
import { Reveal } from "@/components/marketing/fx";
import { FlightLine } from "@/components/marketing/flight-line";
import { billingConfigured } from "@/lib/seat-billing";

/**
 * THE SINGLE-SEAT DESK
 *
 * DIRECTION
 *   phxgrowth.com's Agents page carries one sentence that this entire property
 *   is an answer to: "10 operators. Three ways to hire them." The three ways
 *   are $5,000, $12,500 and $30,000 a month, and six of the ten operators only
 *   appear at the top one.
 *
 *   That is not a mistake in their pricing. PHX/GROWTH is a media buying desk;
 *   bundling operators by how much spend they steer is the correct way to sell
 *   a media buying desk. But it produces a specific and quite large group of
 *   people it cannot serve: the business that wants its phone answered and its
 *   map pack defended, and is not going to run $50,000 a month through Meta to
 *   get it.
 *
 *   This is the fourth way to hire them. One operator, one price, month to
 *   month, no ad budget required.
 *
 * WHAT REPLACED THE INSTRUMENTS
 *   The previous version of this page was an instrument deck — seven
 *   interactive diagnostics, each of which asked the visitor to describe their
 *   business and handed back a finding that resolved into something to buy.
 *   The craft in them was real. The problem was structural: a site whose whole
 *   proposition is that buying should be small and quick opened with seven
 *   pieces of homework.
 *
 *   There is one interactive object now — a ten-card board with a running
 *   total — and the argument lives in the shape of the board rather than in
 *   paragraphs asking to be believed. Four cards have prices. Six have locks
 *   and route to phxgrowth.com. That ratio is the pitch: a page mostly
 *   composed of reasons to buy from somebody else is a page you can believe
 *   about the four things it does sell.
 *
 * BLUEPRINTS
 *   Server component. `<FlightLine />` is the single client boundary and holds
 *   all selection state; the enquiry form listens for the `add-upgrade` event
 *   it dispatches, so a basket is already ticked by the time anybody reaches
 *   it. Every price resolves through the catalogue, and `/api/reserve`
 *   recomputes the total server-side regardless — a posted price is user input.
 */

function structuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: BRAND.name,
    description: THESIS.body,
    url: env.siteUrl,
    email: BRAND.notifyEmail,
    areaServed: "United States",
    parentOrganization: {
      "@type": "Organization",
      name: BRAND.parent.name,
      url: BRAND.parent.url,
      description: BRAND.parent.tagline,
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Single operator seats",
      itemListElement: UPGRADES.map((u) => ({
        "@type": "Offer",
        name: `${u.name} — single seat`,
        description: u.promise,
        price: (u.price / 100).toFixed(2),
        priceCurrency: "USD",
      })),
    },
  };
}

/** The three tiers the parent actually sells the crew in, minus Wingman. */
const CREW_TIERS = FLIGHT_PLANS.filter((p) => p.key !== "wingman");

export default function Home() {
  const from = entryPrice();
  const allSeats = UPGRADES.reduce((s, u) => s + u.price, 0);
  const fleet = FLIGHT_PLANS.find((p) => p.key === "fleet")!;

  return (
    <div className="relative">
      <SystemField />
      <Pulse />
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData()) }}
      />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-background/80 backdrop-blur-xl">
        <div className="container flex h-[4.5rem] items-center justify-between gap-4">
          <Wordmark />
          <div className="flex items-center gap-3">
            <a
              href={BRAND.parent.url}
              className="hidden items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              {BRAND.parent.name} <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
            <Link href="/upgrades" className="pill-ghost px-5 py-2 text-sm">
              All prices
            </Link>
            <a href="#seats" className="pill-primary px-5 py-2 text-sm">
              The seats
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="aurora" />
        <div className="grain" />
        <div className="container relative py-20 sm:py-28 lg:py-32">
          <Reveal>
            <p className="eyebrow text-cyan">{THESIS.eyebrow}</p>
            <h1 className="mt-5 max-w-4xl font-heading text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              <span className="text-kinetic">Hire one operator.</span>
              <br />
              Not the whole crew.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {BRAND.parent.name} runs ten named AI operators and hires them out three ways —{" "}
              {CREW_TIERS.map((t) => t.price.replace("/mo", "")).join(", ")} a month. Four of the
              ten do work that never touches an ad account. Those four you can hire one at a time,
              from {formatCurrency(from)}/mo, with no media budget behind them.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a href="#seats" className="pill-primary">
                See the four seats <ArrowRight className="h-4 w-4" />
              </a>
              <a href={`${BRAND.parent.url}/agents`} className="pill-ghost">
                The full crew of ten <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </Reveal>

          {/* The arithmetic that justifies the site, stated once, in public. */}
          <Reveal delay={140}>
            <div className="mt-14 grid max-w-4xl gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.05] sm:grid-cols-3">
              {[
                {
                  k: "All four seats, together",
                  v: `${formatCurrency(allSeats)}/mo`,
                  n: "Month to month. No setup fee, no performance fee.",
                  tone: "text-cyan",
                },
                {
                  k: "The only other place to get them",
                  v: fleet.price,
                  n: `${fleet.name}, ${fleet.fee.replace("+ ", "plus ")}.`,
                  tone: "text-gold",
                },
                {
                  k: "Operators we won't sell alone",
                  v: `${LOCKED.length} of 10`,
                  n: "Each one says why, and links to the tier that opens it.",
                  tone: "text-muted-foreground",
                },
              ].map((cell) => (
                <div key={cell.k} className="bg-background/85 p-6">
                  <p className="hud-label">{cell.k}</p>
                  <p className={`hud-value mt-2.5 font-heading text-3xl font-semibold ${cell.tone}`}>
                    {cell.v}
                  </p>
                  <p className="mt-2 text-[0.83rem] leading-relaxed text-muted-foreground">
                    {cell.n}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Why this desk exists ───────────────────────────────────────── */}
      <section className="border-y border-white/[0.06] py-20 sm:py-24">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <Reveal>
              <div>
                <p className="eyebrow text-gold">Why this desk exists</p>
                <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                  The crew is bundled by ad spend. Four of them don&rsquo;t need any.
                </h2>
              </div>
            </Reveal>
            <Reveal delay={90}>
              <div className="space-y-5 text-[1.02rem] leading-relaxed text-muted-foreground">
                <p>
                  {BRAND.parent.name} is a media buying desk, and it prices like one. The tiers go
                  up as the managed spend goes up, and the operators come along with them — one at{" "}
                  {FLIGHT_PLANS[1].price}, three at {FLIGHT_PLANS[2].price}, all ten at{" "}
                  {fleet.price}. For a business running real budget that is the correct way to buy.
                </p>
                <p>
                  It does mean something odd at the edges. Closer answers your phone. Herald wins
                  the searches you don&rsquo;t pay for. Echo works your reviews. Tower watches the
                  board. Not one of those jobs consumes a dollar of ad spend — and all four of them
                  currently start at {fleet.price}.
                </p>
                <p className="text-foreground">
                  So this desk sells those four on their own, at the price the work is worth rather
                  than the price the tier costs. Everything else stays where it belongs, upstairs,
                  and this page will point you there whenever that is the better answer.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── The board, the Check, and the six locks ────────────────────── */}
      <FlightLine canCheckout={billingConfigured()} />

      {/* ── What a seat is not ─────────────────────────────────────────── */}
      <section className="border-t border-white/[0.06] py-20 sm:py-24">
        <div className="container">
          <Reveal>
            <p className="eyebrow text-gold">Before you buy one</p>
            <h2 className="mt-3 max-w-3xl font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              What a seat is not.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              A single operator is a deliberately narrow purchase. The way narrow purchases go
              wrong is that the buyer fills in the edges optimistically, so here are the edges.
            </p>
          </Reveal>

          <div className="mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
            {[
              [
                "It is not ad management",
                "No seat touches a campaign, a budget or a bid. That is Vector's job and Vector needs a flight plan. If you want ads flown, Pilot is the floor.",
              ],
              [
                "It is not a strategy engagement",
                "Nobody is building you a growth plan. Atlas does that and it sits at Fleet Command. A seat does one job continuously and reports on it.",
              ],
              [
                "It is not a flight director",
                "The managed tiers come with a named human running the account. A seat comes with the operator and the war room, not a dedicated director.",
              ],
              [
                "It is not a discount on the crew",
                "Past about three seats the arithmetic turns and a flight plan is the better buy. The Check says so on the page rather than leaving you to find out.",
              ],
            ].map(([h, b]) => (
              <div key={h} className="phx-card p-6">
                <div className="flex items-start gap-3">
                  <Minus className="mt-1 h-4 w-4 shrink-0 text-gold/70" />
                  <div>
                    <h3 className="font-heading text-lg font-semibold tracking-tight">{h}</h3>
                    <p className="mt-2 text-[0.9rem] leading-relaxed text-muted-foreground">{b}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Proof posture ──────────────────────────────────────────────── */}
      <section className="border-t border-white/[0.06] py-20 sm:py-24">
        <div className="container">
          <Reveal>
            <div className="phx-card phx-card-gold mx-auto max-w-3xl p-8 sm:p-10">
              <p className="eyebrow text-gold">{PROOF_POSTURE.eyebrow}</p>
              <h2 className="mt-3 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                {PROOF_POSTURE.headline}
              </h2>
              <p className="mt-5 leading-relaxed text-muted-foreground">{PROOF_POSTURE.body}</p>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {PROOF_POSTURE.founding}
              </p>
              <div className="rule-glow my-7" />
              <p className="hud-label mb-2 text-signal">{FLIGHT_CHECK.label}</p>
              <p className="text-[0.94rem] leading-relaxed text-muted-foreground">
                {FLIGHT_CHECK.body}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Fair questions ─────────────────────────────────────────────── */}
      <section className="border-t border-white/[0.06] py-20 sm:py-24">
        <div className="container">
          <Reveal>
            <p className="eyebrow text-cyan">Fair questions</p>
            <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              The fine print, in plain English.
            </h2>
          </Reveal>
          <div className="mt-10 grid max-w-5xl gap-4 lg:grid-cols-2">
            {FAIR_QUESTIONS.map((q, i) => (
              <Reveal key={q.q} delay={i * 45}>
                <div className="phx-card h-full p-6">
                  <h3 className="font-heading text-lg font-semibold tracking-tight">{q.q}</h3>
                  <p className="mt-3 text-[0.9rem] leading-relaxed text-muted-foreground">{q.a}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Enquiry ────────────────────────────────────────────────────── */}
      <section id="enquiry" className="scroll-mt-24 border-t border-white/[0.06] py-20 sm:py-28">
        <div className="container">
          <Reveal>
            <div className="mx-auto max-w-2xl">
              <p className="eyebrow text-cyan">Reserve a seat</p>
              <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                Tell us which operator, and when you want it on shift.
              </h2>
              <p className="mt-5 leading-relaxed text-muted-foreground">
                No call required to get a price — every price is on this page. This goes straight to
                a human, and if a flight plan at {BRAND.parent.name} would serve you better,
                that&rsquo;s what you&rsquo;ll be told.
              </p>
              <div className="mt-9">
                <Enquiry />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-14">
        <div className="container space-y-6">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <a href="#seats" className="transition-colors hover:text-foreground">The seats</a>
            <a href="#check" className="transition-colors hover:text-foreground">The check</a>
            <a href="#locked" className="transition-colors hover:text-foreground">The other six</a>
            <Link href="/upgrades" className="transition-colors hover:text-foreground">All prices</Link>
            <a href={`mailto:${BRAND.parent.email}`} className="transition-colors hover:text-foreground">
              {BRAND.parent.email}
            </a>
            <Link href="/legal/terms" className="transition-colors hover:text-foreground">Terms</Link>
            <Link href="/legal/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
            <Link href="/login" className="transition-colors hover:text-foreground">Client sign-in</Link>
          </div>
          <div className="flex flex-col items-center gap-2 border-t border-white/[0.06] pt-6 text-center">
            <a
              href={BRAND.parent.url}
              className="inline-flex items-center gap-1.5 text-sm text-cyan transition-colors hover:text-foreground"
            >
              The single-seat desk for {BRAND.parent.name} <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
            <span className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {BRAND.name} · Built for the autonomous era
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
