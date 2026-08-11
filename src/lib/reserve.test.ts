import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BUNDLES, UPGRADES, checkSeats, upgradeByKey } from "@/lib/upgrades";
import {
  cadenceOf,
  cumulative,
  dutyRows,
  onDutyOvernight,
  parseSeatKeys,
  priceBasket,
} from "@/lib/reserve";
import { crewPriceEnv, resolveBasket, seatPriceEnv } from "@/lib/seat-billing";

/**
 * The reservation screen prints a total and then asks for a card. There is
 * exactly one way that becomes dishonest — the number on the page disagreeing
 * with the number Stripe charges — and the whole point of keeping the display
 * arithmetic in `reserve.ts` as pure functions is that the disagreement can be
 * tested for rather than hoped about.
 */

const ALL = UPGRADES.map((u) => u.key);

describe("reading a basket out of a URL", () => {
  it("takes a comma list and keeps only real seats", () => {
    expect(parseSeatKeys("seat-echo,seat-herald")).toEqual(["seat-herald", "seat-echo"].sort((a, b) =>
      ALL.indexOf(a) - ALL.indexOf(b),
    ));
    expect(parseSeatKeys("seat-echo,seat-does-not-exist")).toEqual(["seat-echo"]);
    expect(parseSeatKeys("")).toEqual([]);
    expect(parseSeatKeys(undefined)).toEqual([]);
  });

  it("orders by the catalogue, not by the URL, and drops duplicates", () => {
    const a = parseSeatKeys("seat-echo,seat-closer,seat-echo");
    const b = parseSeatKeys("seat-closer,seat-echo");
    expect(a).toEqual(b);
    expect(new Set(a).size).toBe(a.length);
  });

  it("survives a repeated query param without throwing", () => {
    expect(parseSeatKeys(["seat-echo", "seat-closer"])).toEqual(
      parseSeatKeys("seat-echo,seat-closer"),
    );
  });
});

describe("what the page says it costs", () => {
  it("sums a plain basket", () => {
    const basket = priceBasket(["seat-echo", "seat-tower", "seat-relay"]);
    expect(basket.total).toBe(
      basket.seats.reduce((n, s) => n + s.price, 0),
    );
    expect(basket.saving).toBe(0);
    expect(basket.crew).toBeUndefined();
  });

  it("applies the crew price on an exact crew, and only on an exact one", () => {
    for (const crew of BUNDLES) {
      const exact = priceBasket(crew.members);
      expect(exact.crew?.key).toBe(crew.key);
      expect(exact.total).toBe(crew.price);
      expect(exact.saving).toBe(exact.listTotal - crew.price);
      expect(exact.saving).toBeGreaterThan(0);

      // One seat short of a crew is not a crew.
      const short = priceBasket(crew.members.slice(0, -1));
      expect(short.crew).toBeUndefined();
    }
  });
});

/**
 * The one that matters. `resolveBasket()` is what builds the Stripe line items;
 * `priceBasket()` is what the visitor reads. They are separate functions on
 * purpose — one needs env vars and Price IDs, the other has to render on a page
 * that works with billing switched off — so this holds them to the same answer.
 */
describe("the page's total and the charge agree", () => {
  const saved: Record<string, string | undefined> = {};
  const names = [
    ...UPGRADES.map((u) => seatPriceEnv(u.key)),
    ...BUNDLES.map((b) => crewPriceEnv(b.key)),
  ];

  beforeEach(() => {
    for (const n of names) {
      saved[n] = process.env[n];
      process.env[n] = `price_fake_${n}`;
    }
  });
  afterEach(() => {
    for (const n of names) {
      if (saved[n] === undefined) delete process.env[n];
      else process.env[n] = saved[n];
    }
  });

  const baskets = [
    ["seat-echo"],
    ["seat-vector"],
    ["seat-closer", "seat-echo"], // The Front Desk — a crew
    ["seat-herald", "seat-echo"], // The Unpaid Crew — a crew
    ["seat-closer", "seat-herald", "seat-tower", "seat-echo"], // The Unpaid Board
    ["seat-closer", "seat-herald", "seat-tower"], // a crew minus one
    ALL,
  ];

  for (const keys of baskets) {
    it(`charges what the page shows for [${keys.join(", ")}]`, () => {
      const shown = priceBasket(keys);
      const charged = resolveBasket(keys);
      expect(charged.ok).toBe(true);
      if (!charged.ok) return;
      expect(charged.total).toBe(shown.total);
      expect(charged.crew?.key).toBe(shown.crew?.key);
      // A crew bills as one line, seats bill as one line each.
      expect(charged.items.length).toBe(shown.crew ? 1 : keys.length);
    });
  }
});

describe("the duty board", () => {
  it("classifies every shift in the catalogue into a drawable shape", () => {
    for (const seat of UPGRADES) {
      expect(seat.shift, `${seat.name} has no shift`).toBeTruthy();
      expect(["continuous", "scheduled", "on-demand"]).toContain(cadenceOf(seat.shift!));
    }
  });

  it("reads 'on demand' as standing by rather than as round-the-clock", () => {
    // Shield is the case: "Pre-flight, on demand". Drawing it as a full bar
    // would be the chart claiming an availability the catalogue never did.
    expect(cadenceOf("Pre-flight, on demand")).toBe("on-demand");
    expect(cadenceOf("Continuous, on demand")).toBe("on-demand");
    expect(cadenceOf("24/7/365")).toBe("continuous");
    expect(cadenceOf("Standing plan · quarterly resets")).toBe("scheduled");
  });

  it("prints the shift verbatim beside every row it draws", () => {
    const rows = dutyRows(ALL.map((k) => upgradeByKey(k)!));
    expect(rows).toHaveLength(UPGRADES.length);
    for (const r of rows) expect(r.shift).toBe(r.seat.shift);
  });

  it("counts only the continuously-staffed seats as working overnight", () => {
    const seats = ["seat-closer", "seat-shield"].map((k) => upgradeByKey(k)!);
    expect(onDutyOvernight(seats)).toBe(1);
  });
});

describe("the twelve-month line", () => {
  it("is flat monthly with no setup fee bending the first point", () => {
    const series = cumulative(59000);
    expect(series).toHaveLength(12);
    expect(series[0]).toBe(59000);
    expect(series[11]).toBe(59000 * 12);
    const steps = series.slice(1).map((v, i) => v - series[i]);
    expect(new Set(steps).size).toBe(1);
  });
});

/**
 * THE ENQUIRY LIVES IN ONE PLACE
 *
 * The form used to sit on the home page as a second selector with its own
 * tick-list and its own total, which meant a visitor could tick three seats on
 * the board and a different three in the form and be shown two honest numbers
 * that disagreed. It now lives only on /reserve, quoting the basket that is
 * already itemised above it.
 *
 * Moving it left two dead `#enquiry` links behind — the sort of thing nobody
 * notices because a dead anchor fails silently, by doing nothing at all. So
 * this reads the pages and checks every in-page link actually lands.
 */
describe("where the enquiry form lives", () => {
  const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
  const home = read("app/(marketing)/page.tsx");
  const board = read("components/marketing/flight-line.tsx");
  const reserve = read("app/reserve/page.tsx");

  it("is mounted on the reservation and nowhere else", () => {
    expect(reserve).toMatch(/from "@\/components\/marketing\/enquiry"/);
    expect(home).not.toMatch(/from "@\/components\/marketing\/enquiry"/);
  });

  it("is read-only where a basket already exists", () => {
    // Two selectors for one purchase is how a page ends up quoting a number
    // it is not going to charge.
    expect(reserve).toMatch(/showPicker=\{false\}/);
  });

  it("leaves no in-page link pointing at a section that is gone", () => {
    const ids = new Set(
      [...home.matchAll(/id="([a-z-]+)"/g), ...board.matchAll(/id="([a-z-]+)"/g)].map(
        (m) => m[1],
      ),
    );
    const anchors = [...home.matchAll(/href="#([a-z-]+)"/g), ...board.matchAll(/href="#([a-z-]+)"/g)]
      .map((m) => m[1]);
    expect(anchors.length).toBeGreaterThan(0);
    for (const a of anchors) {
      expect(ids.has(a), `the home page links to #${a}, which is not a section on it`).toBe(true);
    }
  });
});

/**
 * The reservation must not become a way around the Check. Tower alone is the
 * blocked case, and the page reads `checkSeats()` for exactly this.
 */
describe("a basket the Check refuses", () => {
  it("still prices, but is marked blocked so the page hides the pay button", () => {
    const check = checkSeats(["seat-tower"]);
    expect(check.blocked).toBe(true);
    expect(priceBasket(["seat-tower"]).total).toBeGreaterThan(0);
  });
});
