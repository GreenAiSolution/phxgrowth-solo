# PHX/GROWTH SOLO

**Hire one PHX/GROWTH operator. Not the whole crew.**

Live: https://phxgrowth-solo.vercel.app

phxgrowth.com sells ten named AI operators, but only in bundles — Pilot $5,000/mo, Squadron $12,500/mo, Fleet Command $30,000/mo. Their own Agents page puts it as *"10 operators. Three ways to hire them."*

This is the fourth way: one operator at a time.

It works because PHX/GROWTH is a **media buying desk**, so every tier is priced against managed ad spend. That strands four operators whose work never touches an ad account — Closer answers the phone, Herald wins unpaid search, Echo works reviews, Tower watches the board — behind a $30,000/mo tier. Those four sell here from $590/mo, with no ad budget required.

The other six appear on the page but are **not for sale**, each with the honest reason and a link to the phxgrowth.com tier that unlocks it. That ratio is deliberate: a page mostly composed of reasons to buy from someone else is one you can believe about the four things it does sell.

> **Read [HANDOVER.md](./HANDOVER.md)** for the full picture — architecture, the two rules not to break, Stripe state, and known issues.

---

## Deploying to Vercel

Import this repo as a new Vercel project. Framework preset **Next.js**, defaults are correct.

### Environment variables

Only three are needed for the marketing site and checkout to work:

| Variable | Needed for | Notes |
|---|---|---|
| `STRIPE_SECRET_KEY` | Checkout | `sk_test_…` or `sk_live_…`. **The mode of this key decides which price IDs get used.** |
| `STRIPE_WEBHOOK_SECRET` | Order notifications | `whsec_…` from the webhook endpoint for that same mode |
| `NEXT_PUBLIC_APP_URL` | Checkout redirects, canonical tags, sitemap | The project's own URL, no trailing slash |

Plus the seven price IDs for whichever mode you're in — and both sets can be present at once:

```
STRIPE_PRICE_SEAT_CLOSER          STRIPE_PRICE_SEAT_CLOSER_TEST
STRIPE_PRICE_SEAT_HERALD          STRIPE_PRICE_SEAT_HERALD_TEST
STRIPE_PRICE_SEAT_TOWER           STRIPE_PRICE_SEAT_TOWER_TEST
STRIPE_PRICE_SEAT_ECHO            STRIPE_PRICE_SEAT_ECHO_TEST
STRIPE_PRICE_CREW_FRONT_DESK      STRIPE_PRICE_CREW_FRONT_DESK_TEST
STRIPE_PRICE_CREW_UNPAID_CREW     STRIPE_PRICE_CREW_UNPAID_CREW_TEST
STRIPE_PRICE_CREW_FULL_BOARD      STRIPE_PRICE_CREW_FULL_BOARD_TEST
```

**Why both sets.** A Stripe price created in test mode does not exist in live mode. Mix them and every checkout fails with `No such price` — with a green deploy, a page that looks fine, and the error surfacing only when a real customer clicks buy. So the app reads the mode off `STRIPE_SECRET_KEY` and picks the matching set. Switching the whole site between test and live is those two secrets and nothing else; the price IDs never move.

### Also present in this repo

The client platform this was built alongside — agent workspace, night-shift briefs, ad-ops, gate approvals — needs `DATABASE_URL` (Postgres + pgvector), `AUTH_SECRET`, `ANTHROPIC_API_KEY`. **None of it is required by the SOLO marketing site or its checkout.** Those routes will error without their variables; the public site will not.

If you only want SOLO, HANDOVER.md lists the ~7 files worth transplanting.

---

## Running locally

Node 20+ required (Node 18 will not build).

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Tests:

```bash
pnpm vitest run     # 615 passing
```

The tests encode the pricing rules, not just the code — `src/lib/upgrades.test.ts` will fail you for selling a seat cheaper than the parent's entry tier, for a crew priced above its own parts, or for claiming a statistic. Run them before changing any number.

---

## The two rules

**1. `checkSeats()` is allowed to lose the sale.** It runs live as the visitor ticks seats and routes them to phxgrowth.com whenever a tier is genuinely the better buy. Tower selected alone returns `blocked: true` and the page refuses to sell it — a commander with nothing to command is a monitoring product for an empty room. Remove that and it becomes an ordinary store.

**2. No price ever crosses the wire.** The checkout endpoint accepts seat *keys* only. Prices resolve server-side to Stripe Price IDs and Stripe reads the amount from its own object. A posted price is user input.
