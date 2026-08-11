"use client";

import * as React from "react";

/**
 * The beacon. Fires a page view, then one event per scroll-depth milestone.
 *
 * `sendBeacon` rather than `fetch` so a reading that lands as someone closes
 * the tab still gets out — which is exactly the reading that tells you where
 * the page loses people. Every call is wrapped and swallowed: analytics that
 * can throw into a render is a worse problem than no analytics.
 */

export type PulseEvent =
  | "view"
  | "depth"
  | "gap_finder"
  | "instrument"
  | "upgrade_added"
  | "enquiry_started"
  /** A seat ticked or unticked on the flight line. */
  | "seat_toggled"
  /** The Check sent them to phxgrowth.com instead. The number that matters. */
  | "routed_out"
  /**
   * A reservation was opened — the review screen between the board and Stripe.
   * Paired with `checkout_started` it is the only way to tell whether that
   * screen is saving people from bad baskets or just losing them.
   */
  | "reserve_viewed"
  /** Committed from the reservation: the moment Stripe is asked for a session. */
  | "checkout_started";

export function pulse(event: PulseEvent, detail?: string) {
  try {
    const body = JSON.stringify({
      event,
      detail,
      referrer: document.referrer || undefined,
      width: window.innerWidth,
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/pulse", new Blob([body], { type: "application/json" }));
      return;
    }
    void fetch("/api/pulse", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    /* never let measurement break the page */
  }
}

const MILESTONES = [25, 50, 75, 100] as const;

export function Pulse() {
  React.useEffect(() => {
    pulse("view");

    const seen = new Set<number>();
    let ticking = false;

    function read() {
      ticking = false;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const pct = Math.round(((window.scrollY || 0) / scrollable) * 100);
      for (const m of MILESTONES) {
        if (pct >= m && !seen.has(m)) {
          seen.add(m);
          pulse("depth", String(m));
        }
      }
    }

    function onScroll() {
      // rAF-throttled: a scroll handler that runs on every pixel is how an
      // analytics snippet ends up being the reason a page feels heavy.
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(read);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return null;
}
