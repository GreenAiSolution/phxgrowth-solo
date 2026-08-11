import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, Check, Minus, TriangleAlert } from "lucide-react";
import { BRAND } from "@/lib/brand";
import {
  FLIGHT_PLANS,
  checkSeats,
  flightPlanByKey,
  type Upgrade,
} from "@/lib/upgrades";
import { dutyRows, parseSeatKeys, priceBasket } from "@/lib/reserve";
import { billingConfigured } from "@/lib/seat-billing";
import { formatCurrency } from "@/lib/utils";
import { Wordmark } from "@/components/marketing/site-chrome";
import { Enquiry } from "@/components/marketing/enquiry";
import { Reveal } from "@/components/marketing/fx";
import { DutyBoard, TwelveMonths } from "@/components/marketing/reserve-charts";
import { ReserveActions } from "@/components/marketing/reserve-actions";

/**
 * THE RESERVATION
 *
 * DIRECTION
 *   The board on the home page hands you a running total and a button, and
 *   until now that button opened Stripe. Between a basket assembled by
 *   ticking cards down a long page and a card form on somebody else's domain
 *   there was nothing: no itemisation, no restatement of the warnings the
 *   cards carried, no picture of what the thing you just bought does all day.
 *   The first full statement of the purchase arrived in the Stripe receipt,
 *   which is one screen too late to be useful.
 *
 *   This is that missing screen. It is a review, not a sales page — the
 *   selling already happened upstairs — so its job is to be *complete*:
 *   every seat, every price, the crew price if one applies, the shifts drawn
 *   out, a year of it costed against the tier one rung up, and the same
 *   verdict from `checkSeats()` that the board showed, including the versions
 *   of it that send the visitor to phxgrowth.com instead of taking their card.
 *
 * WHY IT REPEATS THE REFUSALS
 *   Every seat carries a `wont` line and five of them carry a spend warning.
 *   Those are the lines that lose sales, and a review page that quietly
 *   dropped them while restating the benefits would be doing the oldest trick
 *   in commerce. They are gathered here, together, immediately above the pay
 *   button — which is the last moment they can still save somebody from a
 *   purchase that was never going to work for them.
 *
 * BLUEPRINTS
 *   Server component. The basket arrives as `?seats=` — shareable, so a
 *   quote can be sent to a business partner before anybody spends anything —
 *   and every number on the page is computed here from the catalogue, never
 *   from the URL. `priceBasket()` mirrors the checkout route's crew rule and
 *   a test holds the two totals equal. Two small client islands: the charts
 *   (hover) and the pay button (fetch).
 */

export const metadata: Metadata = {
  title: `Your reservation — ${BRAND.name}`,
  description:
    "Everything in your basket, itemised, with the shifts drawn out and a year of it costed — before anything is charged.",
  // A per-basket URL is not a page anybody should reach from a search result.
  robots: { index: false, follow: false },
};

/* ------------------------------------------------------------------ */

function SeatRow({ seat }: { seat: Upgrade }) {
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-white/[0.06] py-4 last:border-b-0">
      <div className="min-w-[14rem] flex-1">
        <p className="font-heading text-lg font-semibold tracking-tight">
          {seat.name}
          <span className="ml-2.5 align-middle text-[0.8rem] font-normal text-muted-foreground">
            {seat.fixes}
          </span>
        </p>
        <p className="mt-1 text-[0.88rem] leading-relaxed text-muted-foreground">{seat.promise}</p>
      </div>
      <p className="hud-value font-heading text-lg font-semibold tabular-nums">
        {formatCurrency(seat.price)}
        <span className="text-sm text-muted-foreground">/mo</span>
      </p>
    </li>
  );
}

/* ------------------------------------------------------------------ */

export default async function Reserve({
  searchParams,
}: {
  searchParams: Promise<{ seats?: string | string[] }>;
}) {
  const params = await searchParams;
  const keys = parseSeatKeys(params.seats);
  const basket = priceBasket(keys);
  const check = checkSeats(keys);
  const canCheckout = billingConfigured() && !check.blocked && keys.length > 0;

  // The tier one rung above this basket — the honest comparator for the year
  // chart. Past the top rung there is nothing above to compare against, so it
  // falls back to Fleet Command, which is the one that carries all ten.
  const nextRung =
    FLIGHT_PLANS.find((p) => p.monthly > basket.total) ?? flightPlanByKey("fleet")!;

  const duty = dutyRows(basket.seats);
  const refusals = basket.seats.filter((s) => s.wont);
  const spendSeats = basket.seats.filter((s) => s.needsSpend);

  return (
    <div className="relative min-h-screen">
      <header className="border-b border-white/[0.06]">
        <div className="container flex h-[4.5rem] items-center justify-between">
          <Wordmark />
          <Link
            href="/#seats"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Back to the board
          </Link>
        </div>
      </header>

      {keys.length === 0 ? (
        /* An empty reservation is not an error page. It is where anybody who
           wanted the enquiry form rather than the board now lands, so it
           carries the full form with its own tick-list. */
        <main className="container py-20 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow text-cyan">Reserve a seat</p>
            <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Nothing in this reservation yet.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Tick what you want below and send it to a human — or{" "}
              <Link href="/#seats" className="text-cyan underline decoration-cyan/30 underline-offset-4 hover:decoration-cyan">
                build it on the board
              </Link>{" "}
              instead, where the same basket gets itemised, drawn and costed for a year before you
              decide anything.
            </p>
          </div>
          <div id="enquiry" className="mt-14 scroll-mt-24">
            <Enquiry />
          </div>
        </main>
      ) : (
        <main className="pb-24">
          {/* ── The number ─────────────────────────────────────────── */}
          <section className="border-b border-white/[0.06] py-14 sm:py-20">
            <div className="container">
              <Reveal>
                <p className="eyebrow text-cyan">Reservation · nothing charged yet</p>
                <h1 className="mt-3 max-w-3xl font-heading text-3xl font-semibold tracking-tight sm:text-5xl">
                  {basket.crew
                    ? `${basket.crew.name}, priced as a crew.`
                    : basket.seats.length === 1
                      ? `One seat: ${basket.seats[0].name}.`
                      : `${basket.seats.length} seats, hired one at a time.`}
                </h1>
              </Reveal>

              <Reveal delay={80}>
                <div className="fx-hud fx-scanline mt-10 rounded-2xl p-6 sm:p-8">
                  {/* Stacked on a phone: the monthly is the headline and a
                      twelve-month figure squeezed beside it at this type size
                      collides before it informs. */}
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between sm:gap-x-10">
                    <div>
                      <p className="hud-label mb-2">Your monthly</p>
                      <p className="hud-value fx-hero-num font-heading text-5xl font-semibold sm:text-6xl">
                        {formatCurrency(basket.total)}
                        <span className="ml-1 align-baseline text-xl text-muted-foreground">
                          /mo
                        </span>
                      </p>
                    </div>
                    <div className="shrink-0 sm:text-right">
                      <p className="hud-label mb-2">Twelve months</p>
                      <p className="hud-value font-heading text-2xl font-semibold tabular-nums sm:text-3xl">
                        {formatCurrency(basket.total * 12)}
                      </p>
                      <p className="hud-label mt-1 text-muted-foreground">
                        no setup fee · cancel any time
                      </p>
                    </div>
                  </div>
                  {basket.saving > 0 ? (
                    <p className="mt-5 text-[0.9rem] leading-relaxed text-signal">
                      {formatCurrency(basket.listTotal)} bought separately — the crew price saves
                      you {formatCurrency(basket.saving)}/mo, and it is applied automatically at
                      checkout.
                    </p>
                  ) : null}

                  <div className="fx-rainbow-rule my-7" />

                  {/* The same verdict the board showed, carried through rather
                      than dropped at the moment it might cost us the sale. */}
                  <div className="flex gap-3.5">
                    <span className="mt-0.5 shrink-0">
                      {check.tone === "ok" ? (
                        <Check className="h-5 w-5 text-signal" />
                      ) : (
                        <TriangleAlert
                          className={`h-5 w-5 ${check.tone === "elsewhere" ? "text-gold" : "text-gold/80"}`}
                        />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p
                        className={`font-heading text-lg font-semibold tracking-tight ${check.tone === "ok" ? "text-foreground" : "text-gold"}`}
                      >
                        {check.verdict}
                      </p>
                      <p className="mt-2 text-[0.92rem] leading-relaxed text-muted-foreground">
                        {check.detail}
                      </p>
                      {check.goTo ? (
                        <a
                          href={`${BRAND.parent.url}/pricing`}
                          className="pill-gold mt-5 text-sm"
                        >
                          Take {check.goTo.name} at {check.goTo.price}
                          <ArrowUpRight className="h-4 w-4" />
                        </a>
                      ) : null}
                    </div>
                  </div>

                  {check.blocked ? (
                    <p className="mt-7 rounded-lg border border-gold/25 bg-gold/[0.06] px-4 py-3 text-[0.86rem] leading-relaxed text-gold/90">
                      This basket cannot be reserved as it stands, so there is no pay button on
                      this page.{" "}
                      <Link href="/#seats" className="underline underline-offset-4">
                        Change the selection
                      </Link>{" "}
                      and the reservation reprices itself.
                    </p>
                  ) : (
                    <div className="mt-8">
                      <ReserveActions
                        keys={keys}
                        canCheckout={canCheckout}
                        total={basket.total}
                      />
                    </div>
                  )}
                </div>
              </Reveal>
            </div>
          </section>

          {/* ── The itemisation ────────────────────────────────────── */}
          <section className="border-b border-white/[0.06] py-14 sm:py-20">
            <div className="container">
              <Reveal>
                <p className="eyebrow text-cyan">The manifest</p>
                <h2 className="mt-3 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                  Line by line.
                </h2>
              </Reveal>
              <Reveal delay={70}>
                <div className="phx-card mt-8 p-6 sm:p-8">
                  <ul>
                    {basket.seats.map((s) => (
                      <SeatRow key={s.key} seat={s} />
                    ))}
                  </ul>

                  <div className="mt-6 space-y-2.5 border-t border-white/[0.1] pt-6 text-[0.95rem]">
                    <div className="flex justify-between gap-6 text-muted-foreground">
                      <span>
                        {basket.seats.length} seat{basket.seats.length === 1 ? "" : "s"}, à la carte
                      </span>
                      <span className="tabular-nums">{formatCurrency(basket.listTotal)}/mo</span>
                    </div>
                    {basket.crew ? (
                      <div className="flex justify-between gap-6 text-signal">
                        <span>{basket.crew.name} — crew price</span>
                        <span className="tabular-nums">
                          −{formatCurrency(basket.saving)}/mo
                        </span>
                      </div>
                    ) : null}
                    <div className="flex justify-between gap-6 border-t border-white/[0.1] pt-3 font-heading text-xl font-semibold">
                      <span>Charged monthly</span>
                      <span className="tabular-nums">{formatCurrency(basket.total)}</span>
                    </div>
                    <p className="pt-1 text-[0.8rem] leading-relaxed text-muted-foreground">
                      No setup fee, no performance fee, no percentage of your ad spend. The price is
                      flat whatever your budget does, and it is the same number Stripe will show you
                      on the next screen.
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>

          {/* ── The drawings ───────────────────────────────────────── */}
          <section className="border-b border-white/[0.06] py-14 sm:py-20">
            <div className="container space-y-20">
              <Reveal>
                <DutyBoard
                  seats={duty.map((r) => ({
                    key: r.seat.key,
                    name: r.seat.name,
                    cadence: r.cadence,
                    shift: r.shift,
                    price: r.seat.price,
                  }))}
                />
              </Reveal>

              <Reveal>
                <TwelveMonths
                  desk={{ label: "This desk", monthly: basket.total, tone: "desk" }}
                  house={{ label: nextRung.name, monthly: nextRung.monthly, tone: "house" }}
                  houseBuys={`${nextRung.name} wraps the operators in the desk around them — the account audit, tracking rebuilt honestly, the landing pages, the war room and a named human who answers for the result. None of that is sold here, which is the whole reason a seat costs less.`}
                />
              </Reveal>
            </div>
          </section>

          {/* ── What you are not buying ────────────────────────────── */}
          <section className="py-14 sm:py-20">
            <div className="container">
              <Reveal>
                <p className="eyebrow text-gold">Before you pay</p>
                <h2 className="mt-3 max-w-3xl font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                  What these seats will not do.
                </h2>
                <p className="mt-4 max-w-2xl text-[0.98rem] leading-relaxed text-muted-foreground">
                  Every card on the board carries a refusal. They are collected here, on the last
                  screen before the card, because this is the last moment one of them can still
                  stop a purchase that was never going to work for you.
                </p>
              </Reveal>

              {spendSeats.length > 0 ? (
                <Reveal delay={60}>
                  <div className="mt-8 rounded-xl border border-gold/25 bg-gold/[0.06] p-6">
                    <p className="flex items-start gap-2.5 font-heading text-lg font-semibold text-gold">
                      <TriangleAlert className="mt-1 h-4 w-4 shrink-0" />
                      {spendSeats.length === 1
                        ? `${spendSeats[0].name} needs a live ad account.`
                        : `${spendSeats.length} of these need a live ad account.`}
                    </p>
                    <p className="mt-2.5 text-[0.9rem] leading-relaxed text-gold/90">
                      {spendSeats.map((s) => s.name).join(", ")} read from an ad account you are
                      already running. With nothing in flight they have nothing to work on — buy
                      them only if you are spending today, not because you intend to.
                    </p>
                  </div>
                </Reveal>
              ) : null}

              <Reveal delay={90}>
                <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                  {refusals.map((s) => (
                    <li key={s.key} className="phx-card border-white/[0.05] bg-white/[0.012] p-5">
                      <p className="hud-label text-gold/80">{s.name} won&rsquo;t</p>
                      <p className="mt-2 flex gap-2.5 text-[0.9rem] leading-relaxed text-muted-foreground">
                        <Minus className="mt-[0.35rem] h-3.5 w-3.5 shrink-0 text-gold/70" />
                        <span>{s.wont}</span>
                      </p>
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal delay={120}>
                <div className="mt-12 border-t border-white/[0.06] pt-10">
                  {check.blocked ? (
                    <Link href="/#seats" className="pill-primary text-sm">
                      Change the selection
                    </Link>
                  ) : (
                    <ReserveActions keys={keys} canCheckout={canCheckout} total={basket.total} />
                  )}
                </div>
              </Reveal>
            </div>
          </section>

          {/* ── The human path ─────────────────────────────────────── */}
          <section id="enquiry" className="scroll-mt-24 border-t border-white/[0.06] py-14 sm:py-20">
            <div className="container">
              <Reveal>
                <div className="mx-auto max-w-2xl text-center">
                  <p className="eyebrow text-cyan">Or send it to a human</p>
                  <h2 className="mt-3 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                    Same basket, no card.
                  </h2>
                  <p className="mt-5 leading-relaxed text-muted-foreground">
                    This quotes the {basket.seats.length === 1 ? "seat" : `${basket.seats.length} seats`}{" "}
                    above at {formatCurrency(basket.total)}/mo and goes straight to a person, who
                    replies the same day with the scope and the number in writing. Nothing is
                    charged, and if a flight plan at {BRAND.parent.name} would serve you better,
                    that is what you will be told.
                  </p>
                </div>
              </Reveal>
              <Reveal delay={70}>
                <div className="mt-10">
                  {/* Read-only: the basket is the page above, and a second
                      selector here could disagree with it. */}
                  <Enquiry preselect={keys} showPicker={false} />
                </div>
              </Reveal>
            </div>
          </section>
        </main>
      )}
    </div>
  );
}
