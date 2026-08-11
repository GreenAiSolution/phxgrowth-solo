import Stripe from "stripe";
import { env } from "@/lib/env";

let _stripe: Stripe | null = null;

/**
 * The pinned API version, and why it is not the one this SDK ships with.
 *
 * The Greenvlt account has Managed Payments switched on, which is now Stripe's
 * default for new accounts. Managed Payments refuses any request made on
 * `2025-02-24.acacia` — the version stripe-node 17.x pins by default — with
 * "Update your API version, or set the API Version of this request to
 * 2025-03-31.basil or greater".
 *
 * That failure is invisible until a real card is involved: the key
 * authenticates, prices resolve, `billingConfigured()` is happy, and every
 * checkout dies at the last step as a 502. It cost an afternoon once. Do not
 * revert this to the SDK default without checking whether Managed Payments is
 * still enabled on the account.
 *
 * The cast is required because 17.x's types only know its own default literal.
 * The wire format is unaffected — the version is a header — and the webhook
 * endpoint delivers on the account's own version regardless of this setting,
 * so bumping it brings the two into line rather than apart.
 */
const API_VERSION = "2025-03-31.basil" as Stripe.LatestApiVersion;

/** Lazily-constructed Stripe client (so the app builds without secrets). */
export function stripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(env.stripeSecret, { apiVersion: API_VERSION });
  }
  return _stripe;
}
