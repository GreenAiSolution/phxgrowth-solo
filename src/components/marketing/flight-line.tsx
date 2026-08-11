"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Minus, Plus, TriangleAlert } from "lucide-react";
import {
  BUNDLES,
  FLIGHT_PLANS,
  seatsNeedingSpend,
  UPGRADES,
  checkSeats,
  seatTotal,
  type Upgrade,
} from "@/lib/upgrades";
import { BRAND } from "@/lib/brand";
import { formatCurrency, cn } from "@/lib/utils";
import { Reveal } from "@/components/marketing/fx";
import { pulse } from "@/components/marketing/pulse";

/**
 * THE FLIGHT LINE
 *
 * DIRECTION
 *   The page this replaced had seven interactive instruments on it. Each one
 *   asked the visitor to type something about their business and handed back a
 *   diagnosis, and the diagnosis always ended in something to buy. They were
 *   good instruments. They were also seven separate acts of homework standing
 *   between a person and a price, on a site whose entire proposition is that
 *   buying from it should be small and quick.
 *
 *   So there is one interactive object now, and it is a ten-card board with a
 *   running total. All ten carry a price and any combination is buyable. What
 *   keeps it from being a straight pitch is that the same total then draws
 *   phxgrowth.com's own ladder underneath it, to scale, and says when to go up
 *   it — so a good deal of this page is, deliberately, an advertisement for
 *   the parent.
 *
 * WHY THE TOTAL CAN TELL YOU TO LEAVE
 *   `checkSeats()` runs on every change and its verdict is rendered as
 *   prominently as the number itself. Two of its outcomes route the visitor to
 *   phxgrowth.com — one when Relay alone is beaten by Wingman, one when a
 *   basket carrying spend-dependent seats closes on Pilot — and one refuses to
 *   endorse a basket at all until Tower has a crew to watch.
 *
 *   A store that never argues against itself is read as a store that cannot.
 *   The old page understood this and spent a whole instrument on it; this is
 *   the same idea folded into the thing everybody uses anyway, which is
 *   cheaper in attention and harder to skip.
 *
 * BLUEPRINTS
 *   One client boundary for the whole page. Selection lives here; the enquiry
 *   form downstream listens for the same `add-upgrade` event the old cards
 *   dispatched, so a visitor's picks are already ticked by the time they
 *   scroll to it. Prices are read from the catalogue and never typed — and
 *   `/api/reserve` recomputes the total server-side regardless, because a
 *   posted price is user input.
 */

/** Seats in display order: dearest first, so every later price reads against it. */
const SEATS = [...UPGRADES].sort((a, b) => b.price - a.price);

/* ------------------------------------------------------------------ */
/*  A seat you can hire                                               */
/* ------------------------------------------------------------------ */

function SeatCard({
  seat,
  picked,
  onToggle,
}: {
  seat: Upgrade;
  picked: boolean;
  onToggle: (key: string) => void;
}) {
  return (
    <div
      className={cn(
        "phx-card fx-panel lift group flex h-full flex-col p-6 transition-colors sm:p-7",
        seat.apex && "phx-card-gold",
        picked && "border-cyan/45 bg-cyan/[0.035]",
      )}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-heading text-2xl font-semibold tracking-tight">{seat.name}</h3>
          <p className="hud-label mt-1.5 text-cyan/75">{seat.fixes}</p>
        </div>
        <div className="shrink-0 text-right">
          <div
            className={cn(
              "hud-value font-heading text-2xl font-semibold",
              seat.apex ? "text-gold" : "text-foreground",
            )}
          >
            {formatCurrency(seat.price)}
          </div>
          <div className="hud-label mt-0.5">per month</div>
        </div>
      </div>

      <p className="mt-4 text-[0.95rem] leading-relaxed text-muted-foreground">{seat.promise}</p>

      {/* The warning that costs us sales, printed above the price rather than
          buried in the small print. Five of the ten only work if there is a
          budget in flight; a buyer who finds that out in month two is a refund
          and a story, and both cost more than the seat. */}
      {seat.needsSpend ? (
        <p className="mt-4 flex items-start gap-2.5 rounded-lg border border-gold/25 bg-gold/[0.06] px-3.5 py-2.5 text-[0.82rem] leading-relaxed text-gold/90">
          <TriangleAlert className="mt-[0.15rem] h-3.5 w-3.5 shrink-0" />
          <span>
            Needs a live ad account. With nothing in flight this seat has nothing to work on —
            buy it only if you are already running ads.
          </span>
        </p>
      ) : null}

      {/* The spec strip. Shift comes first because the parent's homepage runs a
          section called "The shift board" — a seat that doesn't state when it
          is on duty is speaking a different language from the house. */}
      <dl className="mt-5 space-y-2.5 border-t border-white/[0.07] pt-5 text-sm">
        <div className="flex gap-3">
          <dt className="hud-label w-20 shrink-0 pt-0.5">Shift</dt>
          <dd className="hud-value text-[0.83rem] text-signal">{seat.shift}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="hud-label w-20 shrink-0 pt-0.5">Won&rsquo;t</dt>
          <dd className="text-[0.86rem] leading-relaxed text-muted-foreground">{seat.wont}</dd>
        </div>
      </dl>

      <ul className="mt-5 flex-1 space-y-2">
        {seat.delivers.map((d) => (
          <li key={d} className="flex gap-2.5 text-[0.86rem] leading-relaxed text-muted-foreground">
            <Check className="mt-[0.3rem] h-3.5 w-3.5 shrink-0 text-cyan/70" />
            <span>{d}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onToggle(seat.key)}
        aria-pressed={picked}
        className={cn(
          "mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-200",
          picked
            ? "border border-cyan/50 bg-cyan/10 text-cyan hover:bg-cyan/[0.16]"
            : seat.apex
              ? "pill-gold w-full"
              : "pill-primary w-full",
        )}
      >
        {picked ? (
          <>
            <Minus className="h-4 w-4" /> Remove {seat.name}
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" /> Hire {seat.name}
          </>
        )}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  The Check                                                          */
/* ------------------------------------------------------------------ */

function TheCheck({
  picked,
  onClear,
  canCheckout,
}: {
  picked: string[];
  onClear: () => void;
  /**
   * Whether Stripe is actually wired up, resolved on the server.
   *
   * A "Start these seats" button that reliably 503s is worse than no button:
   * it reads as a broken site rather than a site that takes enquiries, and the
   * visitor who hits it does not come back to try the form. When billing is
   * off the enquiry path is promoted to primary and the card copy disappears
   * — so the page is always honest about what it can actually do right now.
   */
  canCheckout: boolean;
}) {
  const result = React.useMemo(() => checkSeats(picked), [picked]);
  const tone = result.tone;

  /**
   * Where the button goes now.
   *
   * It used to post straight to `/api/checkout/seat` and follow Stripe's URL,
   * which meant the screen after this one was a card form — no itemisation, no
   * restatement of the refusals each card carries, and no picture of what the
   * basket does all day. `/reserve` is that missing screen, and it recomputes
   * every number from the catalogue, so the keys in this URL are a request for
   * a quote rather than a quote.
   */
  const reserveHref = `/reserve?seats=${encodeURIComponent(picked.join(","))}`;

  return (
    <div
      className={cn(
        "fx-hud fx-scanline rounded-2xl p-6 sm:p-8",
        tone === "elsewhere" && "border-gold/30",
        tone === "warn" && "border-gold/20",
        tone === "ok" && picked.length > 0 && "border-cyan/25",
      )}
    >
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div>
          <p className="hud-label mb-2">Running total</p>
          <p
            className={cn(
              "hud-value fx-hero-num font-heading text-5xl font-semibold sm:text-6xl",
              tone === "elsewhere" ? "text-gold" : "text-foreground",
            )}
          >
            {formatCurrency(result.total)}
            <span className="ml-1 align-baseline text-xl text-muted-foreground">/mo</span>
          </p>
        </div>

        <div className="text-right">
          <p className="hud-label mb-2">Seats</p>
          <p className="hud-value font-heading text-3xl font-semibold">
            {picked.length}
            <span className="text-xl text-muted-foreground">/{SEATS.length}</span>
          </p>
        </div>
      </div>

      <div className="fx-rainbow-rule my-6" />

      <div className="flex gap-3.5">
        <span className="mt-0.5 shrink-0">
          {tone === "ok" ? (
            <Check className="h-5 w-5 text-signal" />
          ) : (
            <TriangleAlert className={cn("h-5 w-5", tone === "elsewhere" ? "text-gold" : "text-gold/80")} />
          )}
        </span>
        <div className="min-w-0">
          <p
            className={cn(
              "font-heading text-lg font-semibold tracking-tight",
              tone === "ok" ? "text-foreground" : "text-gold",
            )}
          >
            {result.verdict}
          </p>
          <p className="mt-2 text-[0.92rem] leading-relaxed text-muted-foreground">
            {result.detail}
          </p>

          {result.goTo ? (
            <a
              href={`${BRAND.parent.url}/pricing`}
              onClick={() => pulse("routed_out", `check:${result.goTo?.key}`)}
              className="pill-gold mt-5 text-sm"
            >
              Take {result.goTo.name} at {result.goTo.price}
              <ArrowUpRight className="h-4 w-4" />
            </a>
          ) : null}
        </div>
      </div>

      {picked.length > 0 && !result.blocked ? (
        <div className="mt-7 border-t border-white/[0.07] pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={reserveHref}
              onClick={() => pulse("upgrade_added", picked[0])}
              className="pill-primary text-sm"
            >
              Reserve {picked.length === 1 ? "this seat" : `these ${picked.length} seats`}
              <ArrowRight className="h-4 w-4" />
            </Link>
            {/* The human path now lives on the reservation, with the basket
                already attached — so this carries the seats across rather
                than dropping them at a form that starts empty. */}
            <Link
              href={`${reserveHref}#enquiry`}
              onClick={() => pulse("enquiry_started", "check")}
              className="pill-ghost text-sm"
            >
              Or talk to a human first
            </Link>
            <button type="button" onClick={onClear} className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
              Clear
            </button>
          </div>
          <p className="mt-3.5 text-[0.8rem] leading-relaxed text-muted-foreground">
            {canCheckout
              ? "Next screen itemises it, draws the shifts you are buying and costs a year of it. Nothing is charged there — the card comes after, handled by Stripe."
              : "Next screen itemises it and draws what you are buying. No payment is taken; it sends your basket to a human, who comes back with a scope and an invoice."}
          </p>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  The ladder — phxgrowth.com's own pricing, rendered live            */
/* ------------------------------------------------------------------ */

/**
 * THE HOUSE UPSTAIRS
 *
 * DIRECTION
 *   Until now the parent existed on this page only as prose and outbound
 *   links. A visitor was repeatedly told there is a bigger operation above
 *   this one, at bigger prices, and never shown it — which asks them to take
 *   on trust the one comparison the whole property rests on.
 *
 *   So their ladder is drawn here, to scale, with this desk as the bottom
 *   rung. The bars are linear against Fleet Command's $30,000, which makes
 *   Wingman five percent of the width of the top tier and a single seat a
 *   sliver. That is not flattering to us and it is the point: the size
 *   difference between an operator and a system is the argument, and a
 *   drawing of it is more honest than a paragraph claiming it.
 *
 *   It is live. Tick seats on the board above and the bottom bar grows, the
 *   marker moves, and the gap to the next rung is recalculated — so the
 *   moment buying upstairs becomes the better idea, the visitor watches it
 *   happen rather than being told.
 */
function TheLadder({ picked }: { picked: string[] }) {
  const total = seatTotal(picked);
  const top = FLIGHT_PLANS[FLIGHT_PLANS.length - 1];
  // The first rung whose price is above where the basket currently sits.
  const next = FLIGHT_PLANS.find((p) => p.monthly > total);
  // Linear, against the dearest tier. A minimum width keeps the smallest bar
  // legible without misrepresenting it — the number is always printed beside.
  const width = (cents: number) => `${Math.max(1.5, (cents / top.monthly) * 100)}%`;

  return (
    <section id="ladder" className="scroll-mt-24 border-t border-white/[0.06] py-20 sm:py-28">
      <div className="container">
        <Reveal>
          <p className="eyebrow text-gold">The house upstairs</p>
          <h2 className="mt-3 max-w-3xl font-heading text-3xl font-semibold tracking-tight sm:text-5xl">
            This is the small door. Here is the whole building.
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {BRAND.parent.name} sells four systems above this desk, and they cost what systems
            cost. Drawn to scale against {top.name} so you can see the difference rather than take
            our word for it — and it moves as you tick seats, because the moment buying upstairs
            is the better idea you should be able to watch it happen.
          </p>
        </Reveal>

        <Reveal delay={90}>
          <div className="mt-12 overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.012]">
            {/* Rung zero — this desk. */}
            <div className="border-b border-white/[0.06] bg-cyan/[0.04] p-6 sm:p-7">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="hud-label text-cyan">This desk · one operator at a time</p>
                <p className="hud-value font-heading text-2xl font-semibold tabular-nums text-cyan">
                  {picked.length === 0 ? "—" : `${formatCurrency(total)}/mo`}
                </p>
              </div>
              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
                <div
                  className="h-full rounded-full bg-cyan transition-[width] duration-500 ease-out"
                  style={{ width: picked.length === 0 ? "0%" : width(total) }}
                />
              </div>
              <p className="mt-3 text-[0.85rem] leading-relaxed text-muted-foreground">
                {picked.length === 0
                  ? "Nothing ticked yet. Choose seats on the board above and this bar grows against the tiers below it."
                  : next
                    ? `${picked.length} seat${picked.length === 1 ? "" : "s"}. Another ${formatCurrency(next.monthly - total)}/mo and you are at ${next.name} — which is ${next.promise.charAt(0).toLowerCase()}${next.promise.slice(1)}.`
                    : `${picked.length} seats, and past every tier on the ladder. Nothing upstairs is cheaper than this.`}
              </p>
            </div>

            {/* Their four, cheapest first. */}
            {FLIGHT_PLANS.map((plan) => (
              <a
                key={plan.key}
                href={`${BRAND.parent.url}/pricing`}
                onClick={() => pulse("routed_out", `ladder:${plan.key}`)}
                className={cn(
                  "group block border-b border-white/[0.06] p-6 transition-colors last:border-b-0 hover:bg-white/[0.025] sm:p-7",
                  next?.key === plan.key && picked.length > 0 && "bg-gold/[0.05]",
                )}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="hud-label flex items-center gap-2 text-gold/85">
                    {plan.code}
                    <span className="font-sans normal-case tracking-normal text-muted-foreground">
                      · {plan.operators === 10 ? "all ten operators" : `${plan.operators === 1 ? "one operator" : `${plan.operators} operators`}`}
                    </span>
                    {next?.key === plan.key && picked.length > 0 ? (
                      <span className="rounded-full border border-gold/40 px-2 py-0.5 text-[0.6rem] tracking-widest text-gold">
                        NEXT RUNG
                      </span>
                    ) : null}
                  </p>
                  <p className="hud-value font-heading text-2xl font-semibold tabular-nums text-foreground">
                    {plan.price}
                  </p>
                </div>
                <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="h-full rounded-full bg-gold/70 transition-colors group-hover:bg-gold"
                    style={{ width: width(plan.monthly) }}
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <p className="text-[0.85rem] leading-relaxed text-muted-foreground">
                    {plan.promise.replace(/\.$/, "")}. {plan.ceilingNote.replace(/\.$/, "")}.
                  </p>
                  <span className="inline-flex shrink-0 items-center gap-1 text-[0.8rem] tabular-nums text-muted-foreground">
                    {plan.fee}
                    <ArrowUpRight className="h-3.5 w-3.5 text-cyan opacity-0 transition-opacity group-hover:opacity-100" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </Reveal>

        <Reveal delay={140}>
          <p className="mt-6 max-w-3xl text-[0.9rem] leading-relaxed text-muted-foreground">
            Every number above is {BRAND.parent.name}&rsquo;s own, taken from their pricing page
            rather than characterised by us — which makes it the one part of this site you can
            check against a source we do not control.{" "}
            <a
              href={`${BRAND.parent.url}/pricing`}
              onClick={() => pulse("routed_out", "ladder:verify")}
              className="text-cyan underline decoration-cyan/30 underline-offset-4 hover:decoration-cyan"
            >
              Go and hold it against theirs
            </a>
            .
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  The board                                                          */
/* ------------------------------------------------------------------ */

export function FlightLine({ canCheckout }: { canCheckout: boolean }) {
  const [picked, setPicked] = React.useState<string[]>([]);

  const toggle = React.useCallback((key: string) => {
    setPicked((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      // The enquiry form downstream listens for this, so the basket is already
      // ticked by the time anybody scrolls to it.
      if (!prev.includes(key) && typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("add-upgrade", { detail: key }));
      }
      pulse("seat_toggled", key);
      return next;
    });
  }, []);

  return (
    <>
      {/* ── The four you can hire ──────────────────────────────────── */}
      <section id="seats" className="scroll-mt-24 py-20 sm:py-28">
        <div className="container">
          <Reveal>
            <p className="eyebrow text-cyan">The flight line</p>
            <h2 className="mt-3 max-w-3xl font-heading text-3xl font-semibold tracking-tight sm:text-5xl">
              All ten operators. Hired one at a time.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Take one, take three, take the board. Prices are monthly, month to month, no setup
              fee and no performance fee — a seat is a flat number whatever your budget does.{" "}
              {seatsNeedingSpend().length} of the ten only work if you are already running ads;
              those say so on their own cards rather than letting you find out afterwards.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            {SEATS.map((seat, i) => (
              <Reveal key={seat.key} delay={i * 70}>
                <SeatCard seat={seat} picked={picked.includes(seat.key)} onToggle={toggle} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── The Check ──────────────────────────────────────────────── */}
      <section id="check" className="scroll-mt-24 pb-20 sm:pb-28">
        <div className="container">
          <Reveal>
            <div className="mx-auto max-w-3xl">
              <p className="eyebrow text-gold">The check</p>
              <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                And here is when you should buy the flight plan instead.
              </h2>
              <p className="mt-5 text-[1.02rem] leading-relaxed text-muted-foreground">
                Single seats stop being the cheap option somewhere around three of them. Rather
                than let you find that out on an invoice, the arithmetic runs here while you
                choose — and when the honest answer is a tier at{" "}
                <a
                  href={BRAND.parent.url}
                  className="text-cyan underline decoration-cyan/30 underline-offset-4 hover:decoration-cyan"
                >
                  phxgrowth.com
                </a>
                , it says so and links you there.
              </p>
              <div className="mt-8">
                <TheCheck picked={picked} onClear={() => setPicked([])} canCheckout={canCheckout} />
              </div>
            </div>
          </Reveal>

          {/* Crews — the combinations that price below the sum of their parts. */}
          <Reveal>
            <div className="mx-auto mt-12 max-w-3xl">
              <p className="hud-label mb-4">Or take a crew</p>
              <div className="grid gap-3">
                {BUNDLES.map((b) => {
                  const list = b.members.reduce(
                    (s, m) => s + (UPGRADES.find((u) => u.key === m)?.price ?? 0),
                    0,
                  );
                  const isPicked =
                    b.members.length === picked.length &&
                    b.members.every((m) => picked.includes(m));
                  return (
                    <button
                      key={b.key}
                      type="button"
                      onClick={() => {
                        setPicked(isPicked ? [] : [...b.members]);
                        pulse("upgrade_added", b.members[0]);
                        if (!isPicked && typeof window !== "undefined") {
                          for (const m of b.members) {
                            window.dispatchEvent(new CustomEvent("add-upgrade", { detail: m }));
                          }
                        }
                      }}
                      className={cn(
                        "phx-card lift flex flex-wrap items-center justify-between gap-x-6 gap-y-3 p-5 text-left",
                        b.apex && "phx-card-gold",
                        isPicked && "border-cyan/45 bg-cyan/[0.035]",
                      )}
                    >
                      <div className="min-w-[15rem] flex-1">
                        <div className="flex items-center gap-2.5">
                          <span className="font-heading text-lg font-semibold">{b.name}</span>
                          {b.apex ? (
                            <span className="chip border-gold/40 bg-gold/10 text-gold">Apex</span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{b.promise}</p>
                      </div>
                      <div className="text-right">
                        <div className="hud-value font-heading text-xl font-semibold">
                          {formatCurrency(b.price)}
                          <span className="text-sm text-muted-foreground">/mo</span>
                        </div>
                        <div className="hud-label mt-0.5 text-signal">
                          saves {formatCurrency(list - b.price)}/mo
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <TheLadder picked={picked} />

      {/* ── Why a seat costs less than a flight plan ───────────────── */}
      <section id="systems" className="scroll-mt-24 border-t border-white/[0.06] py-20 sm:py-28">
        <div className="container">
          <Reveal>
            <p className="eyebrow text-gold">The part worth reading twice</p>
            <h2 className="mt-3 max-w-3xl font-heading text-3xl font-semibold tracking-tight sm:text-5xl">
              Why a seat costs less than a flight plan.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Because it is not a cheaper version of one. Every price at {BRAND.parent.name} buys a
              whole system. Every price here buys a single operator, running, with none of the
              system around it. Two different things, two different numbers — and if you need the
              system, the honest answer is to go and buy the system.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            <Reveal>
              <div className="phx-card flex h-full flex-col border-white/[0.05] bg-white/[0.012] p-7">
                <p className="hud-label text-gold/80">What a flight plan is</p>
                <h3 className="mt-3 font-heading text-2xl font-semibold tracking-tight">
                  The operators, plus the desk
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  Pilot is not a media buyer. It is a media buyer plus the account audit, tracking
                  rebuilt honestly, the landing pages, the compliance pre-flight, the attribution
                  work, the war room, and a named human who answers for the result. That is what
                  the number is for, and it is worth it to a business with a budget in flight.
                </p>
                <a
                  href={`${BRAND.parent.url}/pricing`}
                  onClick={() => pulse("routed_out", "systems:parent")}
                  className="mt-6 inline-flex items-center justify-between gap-2 rounded-full border border-white/12 px-5 py-2.5 text-sm transition-colors hover:border-cyan/40 hover:bg-white/[0.04]"
                >
                  <span className="text-muted-foreground">See the flight plans</span>
                  <span className="inline-flex items-center gap-1 whitespace-nowrap font-semibold text-cyan">
                    {BRAND.parent.name} <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </a>
              </div>
            </Reveal>

            <Reveal delay={70}>
              <div className="phx-card flex h-full flex-col border-white/[0.05] bg-white/[0.012] p-7">
                <p className="hud-label text-cyan/80">What a seat is</p>
                <h3 className="mt-3 font-heading text-2xl font-semibold tracking-tight">
                  One operator, and nothing around it
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  The same operator, run by the same team on the same infrastructure, hired on its
                  own. No audit, no war room, nobody on the hook but the operator itself. You take
                  the pieces you need and skip the rest, which is the entire reason this desk
                  exists — and the entire reason it is cheaper.
                </p>
                <div className="mt-6 rounded-lg border border-white/[0.06] bg-black/25 p-4">
                  <p className="hud-label mb-2 text-gold/70">Said before you buy</p>
                  <p className="text-[0.84rem] leading-relaxed text-muted-foreground">
                    {seatsNeedingSpend().length} of the ten read from a live ad account —{" "}
                    {seatsNeedingSpend()
                      .map((s) => s.name)
                      .join(", ")}
                    . They are for sale, but with nothing in flight they have nothing to work on,
                    so each card says so and the running total starts comparing you against Pilot
                    the moment one is ticked.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
