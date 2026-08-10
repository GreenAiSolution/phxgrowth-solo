"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Lock, Minus, Plus, TriangleAlert } from "lucide-react";
import {
  BUNDLES,
  seatsNeedingSpend,
  UPGRADES,
  checkSeats,
  flightPlanByKey,
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
 *   running total. Four cards have prices. Six have locks, and each lock names
 *   the reason and links to the tier at phxgrowth.com that opens it — which
 *   means the majority of this page is, deliberately, an advertisement for the
 *   parent.
 *
 * WHY THE TOTAL CAN TELL YOU TO LEAVE
 *   `checkSeats()` runs on every change and its verdict is rendered as
 *   prominently as the number itself. Two of its outcomes route the visitor to
 *   phxgrowth.com — one when a single seat is dearer than Wingman, one when a
 *   basket closes on Pilot — and one refuses to endorse a basket at all until
 *   Tower has a crew to watch.
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

/** The parent tiers a locked card can point at. */
function unlockTier(key: string) {
  return flightPlanByKey(key);
}

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
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  /**
   * Only seat keys are posted. The server resolves them to Stripe Price IDs
   * and Stripe reads the amount off its own object, so the number rendered
   * above is a display of the catalogue rather than an input to a charge.
   */
  async function onBuy() {
    setBusy(true);
    setError(null);
    pulse("upgrade_added", picked[0]);
    try {
      const res = await fetch("/api/checkout/seat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys: picked }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error ?? "Could not open checkout. Send an enquiry and we'll sort it.");
    } catch {
      setError("Could not reach checkout. Send an enquiry and we'll sort it.");
    }
    setBusy(false);
  }

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
            {canCheckout ? (
              <button
                type="button"
                disabled={busy}
                onClick={onBuy}
                className="pill-primary text-sm disabled:cursor-wait disabled:opacity-70"
              >
                {busy ? (
                  "Opening Stripe…"
                ) : (
                  <>
                    Start {picked.length === 1 ? "this seat" : `these ${picked.length} seats`}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            ) : null}
            <a
              href="#enquiry"
              onClick={() => pulse("enquiry_started", "check")}
              className={canCheckout ? "pill-ghost text-sm" : "pill-primary text-sm"}
            >
              {canCheckout
                ? "Or talk to a human first"
                : `Reserve ${picked.length === 1 ? "this seat" : `these ${picked.length} seats`}`}
            </a>
            <button type="button" onClick={onClear} className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
              Clear
            </button>
          </div>
          <p className="mt-3.5 text-[0.8rem] leading-relaxed text-muted-foreground">
            {canCheckout
              ? "Card on the next screen, handled by Stripe — we never see the number. Month to month, cancel any time, no setup fee."
              : "No payment taken here. This sends your basket to a human, who comes back with a scope and an invoice."}
          </p>
          {error ? (
            <p className="mt-3 text-[0.85rem] leading-relaxed text-gold">{error}</p>
          ) : null}
        </div>
      ) : null}
    </div>
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
              Four operators you can hire on their own.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Every one of these does real work with no ad budget behind it. That is the whole
              test, and it is the reason these four are here and the other six are not. Prices are
              monthly, month to month, with no setup fee and no performance fee — nothing on this
              page manages ad spend, so nothing on it takes a percentage.
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
