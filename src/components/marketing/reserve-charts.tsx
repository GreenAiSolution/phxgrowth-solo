"use client";

import * as React from "react";
import { cn, formatCurrency } from "@/lib/utils";
import type { Cadence } from "@/lib/reserve";

/**
 * THE TWO DRAWINGS ON THE RESERVATION
 *
 * DIRECTION
 *   A review screen that lists names and a total is a receipt. What a person
 *   actually wants to know before they put a card in is a different pair of
 *   questions — *what does this look like once it is running*, and *what does
 *   it come to over a year* — and both are shapes rather than sentences.
 *
 *   So: a duty board, which draws the hours each hired operator is on against
 *   the hours a person you could hire instead would work; and a twelve-month
 *   line against the flight plan one rung up, which is the comparison the rest
 *   of this site has already agreed to make in public.
 *
 * WHAT IS DRAWN AND WHAT IS NOT
 *   The catalogue carries a shift as prose — "24/7/365", "Pre-flight, on
 *   demand" — and no hours. Three shapes are therefore the whole vocabulary
 *   (on continuously, on to a cadence, stands by until called) and the shift
 *   sentence is printed verbatim beside every row it summarises. Nothing here
 *   invents an hour the business has not committed to, which is why the
 *   on-demand rows are drawn as an outline rather than a filled bar: the
 *   honest reading of "when called" is not "all night".
 *
 * COLOUR
 *   Cyan is this desk and gold is everything you would buy instead — the same
 *   two roles they carry on every other page here, sampled from the parent's
 *   own site. Every series is direct-labelled in text as well, so nothing on
 *   these charts is identified by colour alone. Both hues sit brighter than a
 *   general-purpose dark-mode chart band would prefer; they are the house
 *   palette, they clear contrast and colour-blind separation comfortably
 *   (ΔE 21 protan, 26 normal), and a chart that quietly used different colours
 *   from the page around it would be the worse mistake.
 */

/* ------------------------------------------------------------------ */
/*  1 · The duty board                                                */
/* ------------------------------------------------------------------ */

export interface DutyDatum {
  key: string;
  name: string;
  cadence: Cadence;
  shift: string;
  price: number;
}

/** Where a human working 9-to-5 sits on a 24-hour track. */
const HUMAN = { from: 9, to: 17 };
const HOURS = [0, 6, 12, 18, 24];

const CADENCE_COPY: Record<Cadence, string> = {
  continuous: "On duty continuously",
  scheduled: "On duty, reporting to a cadence",
  "on-demand": "Stands by, runs when called",
};

function DutyBar({ cadence }: { cadence: Cadence }) {
  if (cadence === "on-demand") {
    return (
      <div className="absolute inset-y-[0.3rem] left-0 right-0 rounded-[4px] border border-dashed border-cyan/55 bg-cyan/[0.05]" />
    );
  }
  return (
    <div
      className={cn(
        "absolute inset-y-[0.3rem] left-0 right-0 rounded-[4px] bg-cyan",
        cadence === "scheduled" && "opacity-60",
      )}
      style={
        cadence === "scheduled"
          ? {
              backgroundImage:
                "repeating-linear-gradient(135deg, hsl(var(--background) / 0.55) 0 3px, transparent 3px 8px)",
            }
          : undefined
      }
    />
  );
}

export function DutyBoard({ seats }: { seats: DutyDatum[] }) {
  const [hover, setHover] = React.useState<string | null>(null);
  const overnight = seats.filter((s) => s.cadence === "continuous").length;

  return (
    <figure className="m-0">
      <figcaption className="mb-6">
        <p className="hud-label text-cyan">The duty board · one day</p>
        <h3 className="mt-2.5 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          {overnight === 0
            ? "Here is your day, drawn out."
            : `${overnight} of your ${seats.length} operator${seats.length === 1 ? "" : "s"} ${overnight === 1 ? "is" : "are"} still working at 3am.`}
        </h3>
        <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-muted-foreground">
          Each row is one seat across a single day, against the hours a person you hired to do the
          same job would keep. The shift each operator commits to is printed beside its row — the
          drawing is our summary of it, the sentence is the thing we are actually promising.
        </p>
      </figcaption>

      {/* Hour axis */}
      <div className="relative ml-0 h-5 sm:ml-[9.5rem]">
        {HOURS.map((h) => (
          <span
            key={h}
            className="hud-label absolute -translate-x-1/2 text-[0.62rem] text-muted-foreground first:translate-x-0"
            style={{ left: `${(h / 24) * 100}%`, transform: h === 0 ? "none" : h === 24 ? "translateX(-100%)" : undefined }}
          >
            {String(h).padStart(2, "0")}:00
          </span>
        ))}
      </div>

      <ul className="space-y-2">
        {/* The comparison row, first, so every seat below reads against it. */}
        <li className="sm:flex sm:items-center sm:gap-4">
          <div className="w-[9.5rem] shrink-0">
            <p className="font-heading text-[0.95rem] font-semibold text-gold">A person you hire</p>
            <p className="hud-label text-[0.6rem] text-muted-foreground">9–5, Mon–Fri</p>
          </div>
          <div className="relative mt-1.5 h-9 flex-1 overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.015] sm:mt-0">
            {HOURS.slice(1, -1).map((h) => (
              <span key={h} className="absolute inset-y-0 w-px bg-white/[0.05]" style={{ left: `${(h / 24) * 100}%` }} />
            ))}
            <div
              className="absolute inset-y-[0.3rem] rounded-[4px] bg-gold/80"
              style={{
                left: `${(HUMAN.from / 24) * 100}%`,
                width: `${((HUMAN.to - HUMAN.from) / 24) * 100}%`,
              }}
            />
            <span className="hud-label absolute inset-y-0 right-2.5 flex items-center text-[0.6rem] text-muted-foreground">
              8 of 24 hours
            </span>
          </div>
        </li>

        {seats.map((s) => (
          <li
            key={s.key}
            className="sm:flex sm:items-center sm:gap-4"
            onMouseEnter={() => setHover(s.key)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(s.key)}
            onBlur={() => setHover(null)}
            tabIndex={0}
          >
            <div className="w-[9.5rem] shrink-0">
              <p className="font-heading text-[0.95rem] font-semibold">{s.name}</p>
              <p className="hud-label text-[0.6rem] text-muted-foreground">
                {formatCurrency(s.price)}/mo
              </p>
            </div>
            <div
              className={cn(
                "relative mt-1.5 h-9 flex-1 overflow-hidden rounded-lg border bg-white/[0.015] transition-colors sm:mt-0",
                hover === s.key ? "border-cyan/40" : "border-white/[0.06]",
              )}
            >
              {HOURS.slice(1, -1).map((h) => (
                <span key={h} className="absolute inset-y-0 w-px bg-white/[0.05]" style={{ left: `${(h / 24) * 100}%` }} />
              ))}
              <DutyBar cadence={s.cadence} />
              <span className="absolute inset-y-0 right-3 flex items-center text-[0.7rem] text-background/90 mix-blend-plus-lighter">
                <span className="rounded bg-background/70 px-1.5 py-0.5 text-[0.65rem] text-foreground/90">
                  {s.shift}
                </span>
              </span>
            </div>
          </li>
        ))}
      </ul>

      {/* Legend. Present because there is more than one series, and written out
          in words because the three shapes are the encoding — not the colour. */}
      <div className="mt-6 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/[0.06] pt-5">
        {(Object.keys(CADENCE_COPY) as Cadence[]).map((c) => (
          <span key={c} className="flex items-center gap-2.5 text-[0.78rem] text-muted-foreground">
            <span className="relative block h-3.5 w-9 shrink-0 rounded-[3px]">
              <DutyBar cadence={c} />
            </span>
            {CADENCE_COPY[c]}
          </span>
        ))}
        <span className="flex items-center gap-2.5 text-[0.78rem] text-muted-foreground">
          <span className="block h-3.5 w-9 shrink-0 rounded-[3px] bg-gold/80" />
          A person, on a normal week
        </span>
      </div>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/*  2 · Twelve months                                                 */
/* ------------------------------------------------------------------ */

export interface TrackDatum {
  label: string;
  monthly: number;
  /** cyan = this desk, gold = the thing you'd buy instead. */
  tone: "desk" | "house";
}

const MONTHS = 12;

function points(monthly: number, max: number) {
  return Array.from({ length: MONTHS }, (_, i) => ({
    x: (i / (MONTHS - 1)) * 100,
    y: 100 - ((monthly * (i + 1)) / max) * 100,
    month: i + 1,
    cumulative: monthly * (i + 1),
  }));
}

export function TwelveMonths({
  desk,
  house,
  houseBuys,
}: {
  desk: TrackDatum;
  house: TrackDatum;
  /** One line on what the gap actually pays for. Kept honest, not flattering. */
  houseBuys: string;
}) {
  const [at, setAt] = React.useState<number | null>(null);
  const max = Math.max(desk.monthly, house.monthly) * MONTHS;
  const deskPts = points(desk.monthly, max);
  const housePts = points(house.monthly, max);
  const path = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");

  const gap = (house.monthly - desk.monthly) * MONTHS;
  const idx = at ?? MONTHS - 1;

  return (
    <figure className="m-0">
      <figcaption className="mb-6">
        <p className="hud-label text-gold">Twelve months · cumulative</p>
        <h3 className="mt-2.5 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          A year of this desk, against a year of {house.label}.
        </h3>
        <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-muted-foreground">
          Flat monthly, no setup fee, cancel any time — so the line is straight and the only
          interesting thing about it is the distance to the other one.{" "}
          {gap > 0 ? (
            <>
              Over a year that gap is {formatCurrency(gap)}, and it is not free money:{" "}
              {houseBuys}
            </>
          ) : (
            <>This basket has passed {house.label}, which is the point at which their tier is the better buy.</>
          )}
        </p>
      </figcaption>

      <div className="flex gap-4">
        {/* y axis, in HTML so the type stays crisp at every width */}
        <div className="hud-label flex w-16 shrink-0 flex-col justify-between py-1 text-right text-[0.6rem] text-muted-foreground">
          <span>{formatCurrency(max)}</span>
          <span>{formatCurrency(max / 2)}</span>
          <span>$0</span>
        </div>

        <div className="min-w-0 flex-1">
          <div
            className="relative h-56 rounded-lg border border-white/[0.06] bg-white/[0.012] sm:h-64"
            onMouseLeave={() => setAt(null)}
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              const pct = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
              setAt(Math.round(pct * (MONTHS - 1)));
            }}
          >
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full"
              aria-hidden
            >
              {[25, 50, 75].map((y) => (
                <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="hsl(var(--foreground) / 0.06)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              ))}
              <path
                d={`${path(deskPts)} L100 100 L0 100 Z`}
                fill="hsl(var(--hud-cyan) / 0.12)"
              />
              <path
                d={path(housePts)}
                fill="none"
                stroke="hsl(var(--hud-gold))"
                strokeWidth="2"
                strokeDasharray="5 4"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d={path(deskPts)}
                fill="none"
                stroke="hsl(var(--hud-cyan))"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
              {at !== null ? (
                <line
                  x1={deskPts[idx].x}
                  y1="0"
                  x2={deskPts[idx].x}
                  y2="100"
                  stroke="hsl(var(--foreground) / 0.25)"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
              ) : null}
            </svg>

            {/* Markers and the read-out, positioned in HTML over the plot. */}
            {[
              { pts: deskPts, color: "bg-cyan", label: "This desk" },
              { pts: housePts, color: "bg-gold", label: house.label },
            ].map((s) => (
              <span
                key={s.label}
                className={cn("absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-background", s.color)}
                style={{ left: `${s.pts[idx].x}%`, top: `${s.pts[idx].y}%` }}
              />
            ))}

            <div
              className={cn(
                "pointer-events-none absolute top-3 rounded-lg border border-white/10 bg-popover/95 px-3 py-2 text-[0.72rem] shadow-lg",
                deskPts[idx].x > 60 ? "right-3" : "left-3",
              )}
            >
              <p className="hud-label mb-1.5 text-[0.6rem] text-muted-foreground">
                Month {idx + 1}
              </p>
              <p className="flex items-center gap-2 tabular-nums">
                <span className="h-2 w-2 rounded-full bg-cyan" /> This desk{" "}
                <strong className="font-semibold">{formatCurrency(deskPts[idx].cumulative)}</strong>
              </p>
              <p className="mt-1 flex items-center gap-2 tabular-nums text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-gold" /> {house.label}{" "}
                <strong className="font-semibold text-foreground">
                  {formatCurrency(housePts[idx].cumulative)}
                </strong>
              </p>
            </div>
          </div>

          {/* x axis */}
          <div className="hud-label mt-2 flex justify-between text-[0.6rem] text-muted-foreground">
            <span>Month 1</span>
            <span>Month 6</span>
            <span>Month 12</span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-x-7 gap-y-2 border-t border-white/[0.06] pt-5 text-[0.78rem] text-muted-foreground">
        <span className="flex items-center gap-2.5">
          <span className="block h-0.5 w-9 shrink-0 bg-cyan" /> This desk ·{" "}
          {formatCurrency(desk.monthly)}/mo
        </span>
        <span className="flex items-center gap-2.5">
          <span
            className="block h-0.5 w-9 shrink-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, hsl(var(--hud-gold)) 0 6px, transparent 6px 11px)",
            }}
          />
          {house.label} · {formatCurrency(house.monthly)}/mo
        </span>
      </div>
    </figure>
  );
}
