/**
 * SEAT BILLING
 *
 * DIRECTION
 *   The catalogue in `upgrades.ts` is the source of truth for what a seat is
 *   and what it costs. This file is the only place that knows how those seats
 *   map onto Stripe, so the marketing page never has to think about price IDs
 *   and Stripe never has to be told a price.
 *
 * WHY THE PRICE IS NEVER POSTED
 *   The checkout route accepts a list of seat *keys* and nothing else. It
 *   resolves each key to a Stripe Price ID here, server-side, and Stripe reads
 *   the amount off that Price. There is no code path in which a number that
 *   arrived from a browser reaches a charge. This is the same rule
 *   `/api/reserve` already follows for the enquiry total, and it matters more
 *   here because this one moves money.
 *
 * WHY IT LIVES SEPARATELY FROM `catalog.ts`
 *   `catalog.ts` holds the six platform plans — Launch/Scale/Command and
 *   Monitor/Operate/Dominate — which are sold to logged-in clients, seeded
 *   into the database, and wired to entitlements and metering. Seats are a
 *   different animal: bought by anonymous visitors off the public page, with
 *   no account, no provisioning and no feature gating. Folding them into
 *   `PLANS` would mean giving every seat a fake product line and fake limits
 *   so the platform's queries kept working, which is how a schema starts
 *   lying. Two small tables beat one dishonest one.
 */
import { BUNDLES, UPGRADES, bundleByKey, upgradeByKey, type Bundle, type Upgrade } from "@/lib/upgrades";

/**
 * `seat-closer` → `STRIPE_PRICE_SEAT_CLOSER`
 * `front-desk`  → `STRIPE_PRICE_CREW_FRONT_DESK`
 *
 * Derived rather than typed out. A hand-maintained map of seven env names is
 * seven chances to typo one, and a typo here fails as "billing not configured"
 * on exactly one product — the failure nobody notices until a customer reports
 * it, because the other six still work.
 */
export function seatPriceEnv(key: string): string {
  return `STRIPE_PRICE_${key.toUpperCase().replace(/-/g, "_")}`;
}

export function crewPriceEnv(key: string): string {
  return `STRIPE_PRICE_CREW_${key.toUpperCase().replace(/-/g, "_")}`;
}

/* -------------------------------------------------------------------------
   MODE

   A Stripe price created in test mode does not exist in live mode, and vice
   versa. So the price IDs and the secret key have to agree about which mode
   they are in, and nothing in Stripe enforces that — mix them and every
   checkout fails with "No such price", which reads like a broken site rather
   than a misconfiguration.

   The obvious way to run a test pass is to swap all nine variables to test,
   verify, then swap all nine back. That is nine chances to leave one behind,
   and the failure is silent until somebody tries to buy something.

   So both sets live side by side. Test IDs are stored under a `_TEST` suffix
   and the mode is read off the secret key itself, which is the one thing that
   cannot be ambiguous about which mode it is. Flipping the whole site between
   test and live is then two variables — the key and the webhook secret — and
   the price IDs are never touched again.
   ------------------------------------------------------------------------- */

export function isTestMode(): boolean {
  return (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_test_");
}

/**
 * The env var to actually read for a given logical name, honouring mode.
 *
 * Falls back to the unsuffixed name when no `_TEST` value is set, so a test
 * key with no test prices behaves exactly as it did before this existed
 * rather than silently resolving nothing.
 */
export function resolvePriceEnv(base: string): string {
  if (isTestMode() && process.env[`${base}_TEST`]) return `${base}_TEST`;
  return base;
}

/** Every env var that has to be set for the whole board to be buyable. */
export function allPriceEnvNames(): string[] {
  return [
    ...UPGRADES.map((u) => resolvePriceEnv(seatPriceEnv(u.key))),
    ...BUNDLES.map((b) => resolvePriceEnv(crewPriceEnv(b.key))),
  ];
}

export interface LineItem {
  /** Stripe Price ID. */
  price: string;
  quantity: 1;
  /** What it is, for the notification email. Never sent to Stripe as a price. */
  label: string;
  /** Cents, from the catalogue — used only to report, never to charge. */
  amount: number;
}

export type Resolution =
  | { ok: true; items: LineItem[]; total: number; crew?: Bundle; seats: Upgrade[] }
  | { ok: false; reason: "unknown" | "empty" | "unconfigured"; missing?: string[] };

/**
 * Turn a basket of seat keys into Stripe line items.
 *
 * If the basket is exactly the membership of a named crew, the crew's single
 * discounted Price is used instead of the individual seats. That is not a
 * courtesy — the page has already told the visitor the crew is cheaper, and
 * charging them the à la carte sum after saying so would be the most
 * straightforwardly dishonest thing this codebase could do.
 */
export function resolveBasket(keys: string[]): Resolution {
  const unique = [...new Set(keys)];
  if (unique.length === 0) return { ok: false, reason: "empty" };

  const seats = unique.map((k) => upgradeByKey(k));
  if (seats.some((s) => !s)) return { ok: false, reason: "unknown" };
  const found = seats as Upgrade[];

  const want = [...unique].sort().join("|");
  const crew = BUNDLES.find((b) => [...b.members].sort().join("|") === want);

  const missing: string[] = [];
  const read = (name: string) => {
    const v = process.env[name];
    if (!v) missing.push(name);
    return v;
  };

  if (crew) {
    const price = read(resolvePriceEnv(crewPriceEnv(crew.key)));
    if (!price) return { ok: false, reason: "unconfigured", missing };
    return {
      ok: true,
      crew,
      seats: found,
      total: crew.price,
      items: [{ price, quantity: 1, label: crew.name, amount: crew.price }],
    };
  }

  const items: LineItem[] = [];
  for (const s of found) {
    const price = read(resolvePriceEnv(seatPriceEnv(s.key)));
    if (price) items.push({ price, quantity: 1, label: `${s.name} — single seat`, amount: s.price });
  }
  if (missing.length) return { ok: false, reason: "unconfigured", missing };

  return { ok: true, seats: found, items, total: found.reduce((n, s) => n + s.price, 0) };
}

/** Is billing wired up at all? Used by /api/health and the page's CTA. */
export function billingConfigured(): boolean {
  return billingGaps().length === 0;
}

/** Which specific pieces are missing — for the health endpoint, not the public page. */
export function billingGaps(): string[] {
  const gaps: string[] = [];
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  // The shipped placeholder is `sk_test_...`, which is truthy and therefore
  // passed a plain presence check while being completely unusable.
  if (!/^sk_(test|live)_[A-Za-z0-9]{20,}$/.test(key)) gaps.push("STRIPE_SECRET_KEY");
  if (!process.env.STRIPE_WEBHOOK_SECRET?.startsWith("whsec_")) gaps.push("STRIPE_WEBHOOK_SECRET");
  for (const n of allPriceEnvNames()) if (!process.env[n]) gaps.push(n);
  return gaps;
}

/** Which mode the site is currently wired to charge in. For /api/health. */
export function billingMode(): "test" | "live" | "unset" {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  if (key.startsWith("sk_test_")) return "test";
  if (key.startsWith("sk_live_")) return "live";
  return "unset";
}

export { bundleByKey };
