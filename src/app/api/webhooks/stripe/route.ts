import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { planByKey } from "@/lib/catalog";
import { provisionPlan } from "@/lib/provisioning";
import { notifyAgency } from "@/lib/notify";
import { bundleByKey, upgradeByKey } from "@/lib/upgrades";
import type { ProductLineKey, SubscriptionStatus } from "@prisma/client";

/**
 * Stripe webhook — the DB subscription state is the source of truth for feature
 * gating. We reconcile on: checkout.session.completed,
 * customer.subscription.updated/deleted, invoice.paid.
 */
export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, sig, env.stripeWebhookSecret);
  } catch (err) {
    console.warn("[stripe] signature verification failed:", (err as Error).message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
          const sub = await stripe().subscriptions.retrieve(session.subscription as string);
          await upsertSubscription(sub);
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await upsertSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const sub = await stripe().subscriptions.retrieve(invoice.subscription as string);
          await upsertSubscription(sub);
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe] handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

const STATUS_MAP: Record<string, SubscriptionStatus> = {
  active: "ACTIVE",
  trialing: "TRIALING",
  past_due: "PAST_DUE",
  canceled: "CANCELED",
  unpaid: "PAST_DUE",
  incomplete: "INCOMPLETE",
  incomplete_expired: "CANCELED",
};

async function upsertSubscription(sub: Stripe.Subscription) {
  // A seat bought off the public page has no client account to attach to, and
  // must not fall through to the platform path below — that path logs
  // "missing metadata; skipping" and drops it, which would mean a paid
  // subscription that nobody is ever told about. This is the branch that
  // stops a sale being silently swallowed.
  if (sub.metadata?.kind === "seat_order") {
    await recordSeatOrder(sub);
    return;
  }

  const clientId = sub.metadata?.clientId;
  const planKey = sub.metadata?.planKey;
  const lineKey = sub.metadata?.lineKey as ProductLineKey | undefined;

  if (!clientId || !planKey || !lineKey) {
    // Fall back to resolving via the price id if metadata is absent.
    console.warn("[stripe] subscription missing metadata; skipping", sub.id);
    return;
  }
  const plan = planByKey(planKey);
  if (!plan) return;

  const status = STATUS_MAP[sub.status] ?? "INCOMPLETE";
  const priceId = sub.items.data[0]?.price.id ?? null;

  const sub2 = await prisma.subscription.upsert({
    where: { clientId_lineKey: { clientId, lineKey } },
    update: {
      planKey,
      status,
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
    create: {
      clientId,
      lineKey,
      planKey,
      status,
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
  });

  // Automatic fulfilment: the moment the subscription is live, deploy the
  // tier's system. Idempotent, so Stripe retries and tier upgrades are safe.
  // Never let a provisioning failure fail the webhook — Stripe would retry the
  // whole event, and the subscription state above is already correct.
  if (status === "ACTIVE" || status === "TRIALING") {
    try {
      const result = await provisionPlan(clientId, planKey);
      console.info(
        `[stripe] provisioned ${result.planKey} for ${clientId} (+${result.created})`,
      );
    } catch (err) {
      console.error("[stripe] provisioning failed (subscription is still active):", err);
    }
  }

  return sub2;
}

/**
 * A seat bought from the public page.
 *
 * There is no ClientProfile to attach this to and deliberately so — the buyer
 * never made an account. Stripe holds the customer, the card and the
 * subscription; what this has to do is make sure a human finds out, because
 * the seat is a service somebody now has to actually start delivering.
 *
 * Idempotent by construction: it writes nothing and sends a notification keyed
 * to the subscription id. Stripe retries webhooks and fires several events for
 * one purchase (`checkout.session.completed` then `customer.subscription.*`),
 * so this can run more than once per sale. A duplicate email is a far better
 * failure than a missed one, which is why there is no suppression here.
 */
async function recordSeatOrder(sub: Stripe.Subscription) {
  const status = STATUS_MAP[sub.status] ?? "INCOMPLETE";
  const seatKeys = (sub.metadata?.seats ?? "").split(",").filter(Boolean);
  const crewKey = sub.metadata?.crew || undefined;

  const names = seatKeys.map((k) => upgradeByKey(k)?.name ?? k);
  const crew = crewKey ? bundleByKey(crewKey) : undefined;
  const amount = sub.items.data.reduce(
    (n, i) => n + (i.price.unit_amount ?? 0) * (i.quantity ?? 1),
    0,
  );

  let email: string | undefined;
  try {
    const customer = await stripe().customers.retrieve(sub.customer as string);
    if (!("deleted" in customer)) email = customer.email ?? undefined;
  } catch {
    // Non-fatal. A notification without an address is still worth sending —
    // the subscription id is enough to find them in the Stripe dashboard.
  }

  console.info(
    `[stripe] seat order ${sub.id} ${status} — ${crew?.name ?? names.join(" + ")} — ${email ?? "no email"}`,
  );

  // Only shout once the money is actually good. An INCOMPLETE subscription is
  // a card that has not cleared, and treating that as a sale means chasing
  // people who never bought anything.
  if (status !== "ACTIVE" && status !== "TRIALING") return;

  notifyAgency("RESERVATION", {
    businessName: email ?? "New seat customer",
    title: crew ? `${crew.name} — paid` : `${names.join(" + ")} — paid`,
    detail:
      `A seat was bought on the public page and the card has cleared. There is no ` +
      `account for this person yet — they paid without signing up, which is how the ` +
      `page is meant to work. Someone needs to reach out and start the shift.`,
    lines: [
      `Charging ${(amount / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}/mo`,
      crew ? `Crew: ${crew.name} (${names.join(", ")})` : `Seats: ${names.join(", ")}`,
      `Email: ${email ?? "not captured"}`,
      `Stripe subscription: ${sub.id}`,
      `Stripe customer: ${String(sub.customer)}`,
    ],
    path: "/admin/clients",
  });
}
