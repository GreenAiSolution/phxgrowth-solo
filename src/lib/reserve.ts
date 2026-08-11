/**
 * THE RESERVATION
 *
 * DIRECTION
 *   Clicking "Start these seats" used to hand the visitor straight to Stripe.
 *   That is one click too few. A basket assembled by ticking cards on a long
 *   page is easy to get wrong — a seat ticked twice ago and forgotten, a crew
 *   price the visitor never saw applied, a warning that scrolled past — and
 *   the next screen after the board was a card form on somebody else's domain.
 *   The first time a buyer saw an itemised statement of what they had chosen
 *   was in the Stripe receipt, which is after the money moves.
 *
 *   So there is a page between the two now, and this file is the arithmetic
 *   behind it. It exists as pure functions rather than inside the page for one
 *   reason: the number printed on the review screen has to be the number
 *   Stripe charges, and the only way to be sure of that is to test the two
 *   against each other. `reserve.test.ts` does exactly that against
 *   `resolveBasket()` in seat-billing.ts.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 *   It reads no env, touches no Stripe and returns no price IDs. This is the
 *   display half; `seat-billing.ts` remains the only file that knows how a
 *   seat maps onto a charge. Two halves that agree because a test says so
 *   beats one half that cannot be rendered.
 */
import {
  BUNDLES,
  UPGRADES,
  upgradeByKey,
  type Bundle,
  type Upgrade,
} from "@/lib/upgrades";

/**
 * Seat keys out of a `?seats=` query string.
 *
 * Everything here is hostile input — the URL is shareable, editable and will
 * eventually be pasted around with a stale key in it. Unknown keys are dropped
 * rather than thrown on, because a link containing one retired seat should
 * still price the rest instead of showing an error page to somebody who did
 * nothing wrong.
 *
 * Output is ordered by the catalogue, not by the URL: two people who ticked
 * the same three seats in a different order should see the same page.
 */
export function parseSeatKeys(raw: string | string[] | undefined): string[] {
  const flat = Array.isArray(raw) ? raw.join(",") : (raw ?? "");
  const wanted = new Set(
    flat
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean),
  );
  return UPGRADES.filter((u) => wanted.has(u.key)).map((u) => u.key);
}

export interface PricedBasket {
  seats: Upgrade[];
  /** Set only when the basket is exactly a crew's membership. */
  crew?: Bundle;
  /** Cents per month bought one at a time. */
  listTotal: number;
  /** Cents per month actually charged — the crew price when one applies. */
  total: number;
  /** Cents per month saved by the crew price. Zero when no crew applies. */
  saving: number;
}

/**
 * What this basket costs, under the same rule the checkout route uses.
 *
 * The rule is: an exact crew match is charged the crew's price, anything else
 * is the sum of its seats. It is duplicated here rather than imported because
 * `resolveBasket()` cannot run without Stripe env vars and this has to render
 * on a page that must work whether billing is switched on or not — but a test
 * holds the two totals equal, so the duplication cannot drift silently.
 */
export function priceBasket(keys: string[]): PricedBasket {
  const seats = keys
    .map((k) => upgradeByKey(k))
    .filter((u): u is Upgrade => Boolean(u));
  const listTotal = seats.reduce((sum, s) => sum + s.price, 0);

  const want = [...new Set(seats.map((s) => s.key))].sort().join("|");
  const crew = BUNDLES.find((b) => [...b.members].sort().join("|") === want);

  const total = crew ? crew.price : listTotal;
  return { seats, crew, listTotal, total, saving: listTotal - total };
}

/* ==========================================================================
   THE DUTY BOARD
   --------------------------------------------------------------------------
   Every seat states a shift, in prose, written for a human: "24/7/365",
   "Continuous · reports Mondays", "Pre-flight, on demand". Prose is the right
   form on a card and the wrong form for a drawing, so this classifies each
   into one of three shapes the chart can render — and only three, because the
   catalogue does not carry hours and inventing them to make a prettier chart
   would be drawing a claim the business has not made.

   The verbatim shift text is printed beside every row. The drawing is the
   summary; the sentence is the source.
   ========================================================================== */

export type Cadence = "continuous" | "scheduled" | "on-demand";

export interface DutyRow {
  seat: Upgrade;
  cadence: Cadence;
  /** The shift line, verbatim from the catalogue. */
  shift: string;
  /** The cadence half of it, if the seat named one — "reports Mondays". */
  rhythm?: string;
}

/**
 * Which of the three shapes a shift line describes.
 *
 * On-demand is tested first on purpose. A seat could plausibly say "continuous,
 * on demand" one day, and of the two readings the honest one is the narrower:
 * something that runs when called is not something that runs all night.
 */
export function cadenceOf(shift: string): Cadence {
  if (/on demand|when called|pre-flight/i.test(shift)) return "on-demand";
  if (/24\/7|continuous|always/i.test(shift)) return "continuous";
  return "scheduled";
}

export function dutyRows(seats: Upgrade[]): DutyRow[] {
  return seats.map((seat) => {
    const shift = seat.shift ?? "Shift not stated";
    const parts = shift.split("·").map((p) => p.trim());
    return {
      seat,
      cadence: cadenceOf(shift),
      shift,
      rhythm: parts.length > 1 ? parts[parts.length - 1] : undefined,
    };
  });
}

/** How many of these seats are working at 3am — the headline the chart earns. */
export function onDutyOvernight(seats: Upgrade[]): number {
  return dutyRows(seats).filter((r) => r.cadence === "continuous").length;
}

/* ==========================================================================
   TWELVE MONTHS
   ========================================================================== */

/**
 * Cumulative spend, month by month, for a flat monthly price.
 *
 * A flat line is a boring chart and an honest one: nothing here is annualised
 * at a discount, and there is no setup fee to bend the first point. Index 0 is
 * month one, so `months(1450_00, 12)[11]` is the twelve-month total.
 */
export function cumulative(monthly: number, months = 12): number[] {
  return Array.from({ length: months }, (_, i) => monthly * (i + 1));
}
