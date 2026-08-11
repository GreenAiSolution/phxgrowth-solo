"use client";

import * as React from "react";
import { ArrowRight, Lock } from "lucide-react";
import { pulse } from "@/components/marketing/pulse";

/**
 * The last button before Stripe.
 *
 * The only client-side work left on the reservation page: post the seat keys,
 * follow the URL Stripe hands back. No price crosses the wire in either
 * direction — the server resolves keys to Price IDs and Stripe reads the
 * amount off its own object, which is what makes it safe for the total beside
 * this button to be rendered from the catalogue rather than fetched.
 *
 * It also fires the two events that make this page's existence measurable:
 * one when a reservation is opened, one when somebody commits from it. If the
 * step turns out to lose more people than it saves, that will be visible
 * rather than arguable.
 */
export function ReserveActions({
  keys,
  canCheckout,
  total,
}: {
  keys: string[];
  canCheckout: boolean;
  /** For the beacon only — never posted to the checkout route. */
  total: number;
}) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    pulse("reserve_viewed", `${keys.length}`);
  }, [keys.length]);

  async function confirm() {
    setBusy(true);
    setError(null);
    pulse("checkout_started", `${Math.round(total / 100)}`);
    try {
      const res = await fetch("/api/checkout/seat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys }),
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
    <div>
      <div className="flex flex-wrap items-center gap-3">
        {canCheckout ? (
          <button
            type="button"
            onClick={confirm}
            disabled={busy}
            className="pill-primary text-sm disabled:cursor-wait disabled:opacity-70"
          >
            {busy ? (
              "Opening Stripe…"
            ) : (
              <>
                Confirm and pay
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        ) : null}
        <a
          href="/#enquiry"
          onClick={() => pulse("enquiry_started", "reserve")}
          className={canCheckout ? "pill-ghost text-sm" : "pill-primary text-sm"}
        >
          {canCheckout ? "Talk to a human first" : "Send this to a human"}
        </a>
        <a
          href={`/#seats`}
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Change the selection
        </a>
      </div>

      <p className="mt-3.5 flex items-start gap-2 text-[0.8rem] leading-relaxed text-muted-foreground">
        <Lock className="mt-[0.15rem] h-3.5 w-3.5 shrink-0 text-signal" />
        <span>
          {canCheckout
            ? "Nothing has been charged yet. The card is taken on the next screen by Stripe — we never see the number — and the first payment is the one you approve there."
            : "No payment is taken here. This sends your basket to a human, who comes back with a scope and an invoice."}
        </span>
      </p>

      {error ? <p className="mt-3 text-[0.85rem] leading-relaxed text-gold">{error}</p> : null}
    </div>
  );
}
