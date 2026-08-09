import { NextResponse } from "next/server";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import { env } from "@/lib/env";
import { billingGaps, resolveBasket } from "@/lib/seat-billing";
import { UPGRADES } from "@/lib/upgrades";

/**
 * PUBLIC SEAT CHECKOUT
 *
 * DIRECTION
 *   The other checkout route, `/api/checkout`, requires a logged-in client
 *   because it sells the platform plans and has to attach a subscription to an
 *   account that already exists. This one sells seats off the public page to
 *   somebody who has never been here before, so it must work with no account,
 *   no password and no call.
 *
 *   That is the whole product promise — "no call required to get a price" is
 *   printed on the page — and a checkout that first demanded a login would
 *   make the page a liar.
 *
 * WHAT THIS ROUTE WILL NOT TRUST
 *   Only seat keys cross the wire. Prices are resolved from the catalogue and
 *   handed to Stripe as Price IDs, so the amount charged comes from Stripe's
 *   own object and not from anything a browser said. A basket that happens to
 *   be exactly a crew is charged the crew's discounted price, because the page
 *   said it would be.
 *
 *   The email is collected by Stripe Checkout rather than by us. One fewer
 *   field on our side, one fewer thing to validate, and the address is then
 *   verified against the card.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 *   No database write. A visitor with no account has nothing to attach a row
 *   to, and inventing a half-populated ClientProfile at the moment of *intent*
 *   — before payment has succeeded — would leave a trail of ghost clients for
 *   every abandoned checkout. The subscription is created by Stripe and the
 *   webhook is what tells us it completed.
 */

const Body = z.object({
  /** Seat keys from the catalogue. Nothing else — no prices, no totals. */
  keys: z.array(z.string().max(64)).min(1).max(UPGRADES.length),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // The key is checked before the basket, and the order matters. Price IDs can
  // be fully configured while the secret key is absent — which is exactly the
  // state this project shipped in for a while — and in that order the basket
  // resolves cleanly and the failure surfaces as a generic 502 from the Stripe
  // call instead of the one message that tells the visitor what to do instead.
  const gaps = billingGaps();
  if (gaps.length) {
    console.error(`[checkout/seat] billing not configured — missing: ${gaps.join(", ")}`);
    return NextResponse.json(
      { error: "Card payment isn't switched on yet — send an enquiry and we'll set you up." },
      { status: 503 },
    );
  }

  const basket = resolveBasket(parsed.data.keys);

  if (!basket.ok) {
    if (basket.reason === "unconfigured") {
      // Say so plainly in the log, vaguely in the response. The visitor cannot
      // act on a missing env var and the name of one is not their business.
      console.error(
        `[checkout/seat] billing not configured — missing: ${(basket.missing ?? []).join(", ")}`,
      );
      return NextResponse.json(
        { error: "Card payment isn't switched on yet — send an enquiry and we'll set you up." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "Unknown seat." }, { status: 400 });
  }

  // A basket that the Check itself refuses must not be purchasable. The page
  // already hides the button, but the endpoint is public and a stale tab is
  // enough to post one.
  const unmet = basket.seats.find(
    (s) => s.requiresCrew && basket.seats.length - 1 < s.requiresCrew,
  );
  if (unmet) {
    return NextResponse.json(
      {
        error: `${unmet.name} needs ${unmet.requiresCrew} other seats to be worth running. Add more, or drop it.`,
      },
      { status: 400 },
    );
  }

  const origin = env.siteUrl.replace(/\/$/, "");

  try {
    const session = await stripe().checkout.sessions.create({
      mode: "subscription",
      line_items: basket.items.map((i) => ({ price: i.price, quantity: i.quantity })),
      // Stripe collects and verifies it; we never hold an unconfirmed address.
      billing_address_collection: "auto",
      allow_promotion_codes: true,
      success_url: `${origin}/thanks?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#check`,
      subscription_data: {
        // Read back by the webhook. `kind` is what separates a seat order from
        // a platform subscription, which is the difference between "email
        // Jaden" and "provision a plan against a client account".
        metadata: {
          kind: "seat_order",
          seats: basket.seats.map((s) => s.key).join(","),
          crew: basket.crew?.key ?? "",
        },
      },
      metadata: {
        kind: "seat_order",
        seats: basket.seats.map((s) => s.key).join(","),
        crew: basket.crew?.key ?? "",
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Could not start checkout." }, { status: 502 });
    }
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[checkout/seat] stripe error:", err);
    return NextResponse.json(
      { error: "Could not start checkout. Send an enquiry and we'll sort it." },
      { status: 502 },
    );
  }
}
