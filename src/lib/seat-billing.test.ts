import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { BUNDLES, UPGRADES } from "@/lib/upgrades";
import {
  allPriceEnvNames,
  billingConfigured,
  billingGaps,
  billingMode,
  crewPriceEnv,
  isTestMode,
  resolveBasket,
  resolvePriceEnv,
  seatPriceEnv,
} from "@/lib/seat-billing";

/**
 * The failure this file exists to prevent is a mixed-mode configuration.
 *
 * A live secret key with test price IDs, or the reverse, produces "No such
 * price" from Stripe on every checkout. Nothing warns you: the deploy is
 * green, the page renders, the button works, and the error only appears after
 * a real person has decided to buy something. It is the single most expensive
 * way this integration can be wrong, and it is invisible to every check that
 * only asks whether variables are *present*.
 */

const PRICE_KEYS = [
  ...UPGRADES.map((u) => seatPriceEnv(u.key)),
  ...BUNDLES.map((b) => crewPriceEnv(b.key)),
];

const LIVE_KEY = `sk_live_${"a".repeat(30)}`;
const TEST_KEY = `sk_test_${"b".repeat(30)}`;

let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = {};
  for (const n of [
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    ...PRICE_KEYS,
    ...PRICE_KEYS.map((n) => `${n}_TEST`),
  ]) {
    saved[n] = process.env[n];
    delete process.env[n];
  }
});

afterEach(() => {
  for (const [n, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[n];
    else process.env[n] = v;
  }
});

function setLivePrices() {
  PRICE_KEYS.forEach((n, i) => (process.env[n] = `price_live_${i}`));
}
function setTestPrices() {
  PRICE_KEYS.forEach((n, i) => (process.env[`${n}_TEST`] = `price_test_${i}`));
}

describe("mode detection", () => {
  it("reads the mode off the key, which cannot be ambiguous about it", () => {
    process.env.STRIPE_SECRET_KEY = TEST_KEY;
    expect(billingMode()).toBe("test");
    expect(isTestMode()).toBe(true);

    process.env.STRIPE_SECRET_KEY = LIVE_KEY;
    expect(billingMode()).toBe("live");
    expect(isTestMode()).toBe(false);

    delete process.env.STRIPE_SECRET_KEY;
    expect(billingMode()).toBe("unset");
  });

  it("treats the shipped placeholder as unset, not as a key", () => {
    // `sk_test_...` ships in .env.example and is truthy, so a plain presence
    // check passed on it. The site then reported itself configured, rendered
    // the buy button, and 502'd on the first click.
    process.env.STRIPE_SECRET_KEY = "sk_test_...";
    setLivePrices();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_x";
    expect(billingGaps()).toContain("STRIPE_SECRET_KEY");
    expect(billingConfigured()).toBe(false);
  });

  it("rejects a webhook secret that isn't one", () => {
    process.env.STRIPE_SECRET_KEY = LIVE_KEY;
    setLivePrices();
    process.env.STRIPE_WEBHOOK_SECRET = "pasted the wrong thing";
    expect(billingGaps()).toContain("STRIPE_WEBHOOK_SECRET");
  });
});

describe("price resolution follows the key's mode", () => {
  it("uses live IDs under a live key even when test IDs exist", () => {
    process.env.STRIPE_SECRET_KEY = LIVE_KEY;
    setLivePrices();
    setTestPrices();
    const r = resolveBasket([UPGRADES[0]!.key]);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.items[0]!.price).toMatch(/^price_live_/);
  });

  it("uses test IDs under a test key", () => {
    process.env.STRIPE_SECRET_KEY = TEST_KEY;
    setLivePrices();
    setTestPrices();
    const r = resolveBasket([UPGRADES[0]!.key]);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.items[0]!.price).toMatch(/^price_test_/);
  });

  it("falls back to the live name when a test ID is absent", () => {
    // Better to charge against a real price and have Stripe reject the mode
    // mismatch loudly than to resolve nothing and report "not configured" at
    // a visitor who is trying to pay.
    process.env.STRIPE_SECRET_KEY = TEST_KEY;
    setLivePrices();
    expect(resolvePriceEnv(PRICE_KEYS[0]!)).toBe(PRICE_KEYS[0]);
  });

  it("never mixes modes within one basket", () => {
    // The whole board, under each key, must resolve to one mode throughout.
    for (const [key, want] of [
      [LIVE_KEY, /^price_live_/],
      [TEST_KEY, /^price_test_/],
    ] as const) {
      process.env.STRIPE_SECRET_KEY = key;
      setLivePrices();
      setTestPrices();
      const r = resolveBasket(UPGRADES.map((u) => u.key));
      expect(r.ok).toBe(true);
      if (r.ok) for (const i of r.items) expect(i.price).toMatch(want);
    }
  });

  it("checks the names it will actually read, not the live ones", () => {
    process.env.STRIPE_SECRET_KEY = TEST_KEY;
    setTestPrices();
    expect(allPriceEnvNames().every((n) => n.endsWith("_TEST"))).toBe(true);
    expect(billingGaps()).toEqual(["STRIPE_WEBHOOK_SECRET"]);
  });
});

describe("what gets charged", () => {
  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = LIVE_KEY;
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    setLivePrices();
  });

  it("charges the crew price when the basket is exactly a crew", () => {
    for (const b of BUNDLES) {
      const r = resolveBasket(b.members);
      expect(r.ok).toBe(true);
      if (!r.ok) continue;
      // One line item, not N — the page promised a single discounted price.
      expect(r.items).toHaveLength(1);
      expect(r.crew?.key).toBe(b.key);
      expect(r.total).toBe(b.price);
      const list = b.members.reduce(
        (n, m) => n + (UPGRADES.find((u) => u.key === m)?.price ?? 0),
        0,
      );
      expect(r.total, `${b.key} must be cheaper than its parts`).toBeLessThan(list);
    }
  });

  it("does not apply a crew price to a basket that isn't one", () => {
    const crew = BUNDLES.find((b) => b.members.length > 2)!;
    const partial = crew.members.slice(0, 2);
    const r = resolveBasket(partial);
    expect(r.ok).toBe(true);
    if (r.ok && r.crew) expect(r.crew.members).toEqual(expect.arrayContaining(partial));
  });

  it("ignores duplicate keys rather than charging twice", () => {
    const k = UPGRADES[0]!.key;
    const r = resolveBasket([k, k, k]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.items).toHaveLength(1);
      expect(r.total).toBe(UPGRADES[0]!.price);
    }
  });

  it("refuses an unknown key instead of silently dropping it", () => {
    const r = resolveBasket([UPGRADES[0]!.key, "seat-nonexistent"]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("unknown");
  });

  it("reports exactly which variables are missing", () => {
    // A three-seat basket on purpose. Passing all four selects the Full Board
    // crew, which resolves to a single crew price and never reads the seat
    // variables at all — the first version of this test deleted a seat price,
    // saw a successful resolution, and was measuring the crew path.
    const basket = UPGRADES.slice(0, 3).map((u) => u.key);
    expect(
      BUNDLES.some((b) => [...b.members].sort().join("|") === [...basket].sort().join("|")),
      "this basket must not be a crew, or the test proves nothing",
    ).toBe(false);

    delete process.env[PRICE_KEYS[0]!];
    const r = resolveBasket(basket);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toBe("unconfigured");
      expect(r.missing).toContain(PRICE_KEYS[0]);
    }
  });
});
