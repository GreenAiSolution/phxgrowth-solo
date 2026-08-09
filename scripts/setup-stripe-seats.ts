/**
 * Create the Stripe Products + monthly Prices for the SOLO board — the four
 * seats and the three crews — and print the env lines to paste back.
 *
 *   pnpm stripe:seats
 *
 * Idempotent. Run it as many times as you like: products are matched on the
 * `seatKey` metadata field and prices on (amount, interval), so a second run
 * reports "exists" rather than quietly creating a duplicate $995 price and
 * leaving you to guess which one the site is charging.
 *
 * MODE
 *   Whatever mode STRIPE_SECRET_KEY is in, that is the mode these are created
 *   in. Test-mode products are invisible in live mode and vice versa, which is
 *   the usual reason a working checkout "breaks" on the day someone swaps in
 *   the live key — the price IDs in the env still point at test objects. The
 *   banner below states the mode it is about to write to before it writes.
 */
import Stripe from "stripe";
import { BUNDLES, UPGRADES, bundleListPrice, bundleSaving } from "../src/lib/upgrades";
import { crewPriceEnv, seatPriceEnv } from "../src/lib/seat-billing";

const money = (cents: number) => `$${(cents / 100).toLocaleString("en-US")}`;

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.startsWith("sk_test_...") || key.length < 20) {
    console.error(
      "STRIPE_SECRET_KEY is not set to a real key.\n" +
        "Put your key in .env first — the placeholder that ships in the repo is not one.",
    );
    process.exit(1);
  }

  const live = key.startsWith("sk_live_");
  console.log(
    `\n  Writing to your ${live ? "\x1b[41m LIVE \x1b[0m" : "\x1b[42m TEST \x1b[0m"} Stripe account.\n`,
  );

  const stripe = new Stripe(key, { apiVersion: "2025-02-24.acacia" });
  const envLines: string[] = [];

  /** Find-or-create a product keyed on metadata, then a monthly price on it. */
  async function ensure(opts: {
    metaKey: string;
    name: string;
    description: string;
    amount: number;
    metadata: Record<string, string>;
    envName: string;
  }) {
    const search = await stripe.products.search({
      query: `metadata['seatKey']:'${opts.metaKey}'`,
    });
    let product = search.data[0];
    if (!product) {
      product = await stripe.products.create({
        name: opts.name,
        description: opts.description,
        metadata: { seatKey: opts.metaKey, ...opts.metadata },
      });
      console.log(`  ✓ product  ${opts.name}`);
    } else {
      console.log(`  • product  ${opts.name} (exists)`);
    }

    const prices = await stripe.prices.list({ product: product.id, active: true, limit: 100 });
    let price = prices.data.find(
      (p) => p.unit_amount === opts.amount && p.recurring?.interval === "month",
    );
    if (!price) {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: opts.amount,
        currency: "usd",
        recurring: { interval: "month" },
        metadata: { seatKey: opts.metaKey },
      });
      console.log(`     ↳ price ${price.id}  ${money(opts.amount)}/mo  (created)`);
    } else {
      console.log(`     ↳ price ${price.id}  ${money(opts.amount)}/mo  (exists)`);
    }
    envLines.push(`${opts.envName}=${price.id}`);
  }

  console.log("SEATS");
  for (const u of UPGRADES) {
    await ensure({
      metaKey: u.key,
      name: `${u.name} — single seat`,
      // Stripe shows this on the checkout page and the invoice, so it is worth
      // it being the operator's actual promise rather than a slug.
      description: u.promise,
      amount: u.price,
      metadata: { kind: "seat", operator: u.name, shift: u.shift ?? "" },
      envName: seatPriceEnv(u.key),
    });
  }

  console.log("\nCREWS");
  for (const b of BUNDLES) {
    await ensure({
      metaKey: b.key,
      name: b.name,
      description: `${b.promise} Saves ${money(bundleSaving(b))}/mo against ${money(
        bundleListPrice(b),
      )} bought separately.`,
      amount: b.price,
      metadata: { kind: "crew", members: b.members.join(",") },
      envName: crewPriceEnv(b.key),
    });
  }

  console.log("\n# ---- paste these into .env, then push them to Vercel ----");
  console.log(envLines.join("\n"));
  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
