# PHX/GROWTH SOLO — handover

Everything you need to take this site and fold it into another project.

**Live:** https://phxgrowth-solo.vercel.app
**Branch:** `main` (not merged to `main` — `main` is still the previous version of this site)

```bash
git clone https://github.com/GreenAiSolution/phxgrowth-solo.git
cd Addtophxgrowth
git checkout main
```

---

## What it is

phxgrowth.com sells ten named AI operators, but only in bundles: Pilot $5,000/mo, Squadron $12,500/mo, Fleet Command $30,000/mo. Their own Agents page puts it as *"10 operators. Three ways to hire them."*

This site is the fourth way — one operator at a time.

It works because PHX/GROWTH is a **media buying desk**, so every tier is priced against managed ad spend. That strands four operators whose work never touches an ad account (Closer answers the phone, Herald wins unpaid search, Echo works reviews, Tower watches the board) behind a $30,000/mo tier. Those four are sold here individually, from $590/mo, with no ad budget required.

The other six are shown on the page but **not for sale**, each with the honest reason and a link to the phxgrowth.com tier that unlocks it. That ratio is deliberate: a page mostly made of reasons to buy from someone else is one you can believe about the four things it does sell.

---

## Running it locally

Node 18 will not work — the toolchain needs Node 20+. On this Mac that meant `PATH=/opt/homebrew/bin:$PATH`.

```bash
pnpm install
cp .env.example .env      # then fill in the values below
pnpm prisma generate
pnpm db:push && pnpm db:seed
pnpm dev
```

**Minimum env to boot:** `DATABASE_URL`, `AUTH_SECRET`. Postgres 17 + pgvector.
**For the marketing page alone**, none of the database is needed — it is a server component reading static catalogue data.

Tests: `pnpm vitest run` — 615 passing. They encode the business rules, not just the code; read `src/lib/upgrades.test.ts` before changing prices or seats.

---

## The parts that matter

| File | What it does |
|---|---|
| `src/lib/upgrades.ts` | **Source of truth.** The four seats, the six locked operators, the three crews, the parent's real tiers, and `checkSeats()`. |
| `src/lib/seat-billing.ts` | The only file that knows how seats map to Stripe. Resolves keys → Price IDs, mode-aware. |
| `src/components/marketing/flight-line.tsx` | The whole interactive board. One client component. |
| `src/app/(marketing)/page.tsx` | The page. Server component; `<FlightLine />` is the single client boundary. |
| `src/app/api/checkout/seat/route.ts` | Public checkout. No login required. |
| `src/app/api/webhooks/stripe/route.ts` | Seat orders branch at the top, before the platform-plan path. |
| `src/app/globals.css` | The cockpit/HUD design system. Untouched from the previous version — same palette. |

### Two rules worth not breaking

**1. `checkSeats()` is allowed to lose the sale.** It runs live as the visitor ticks seats and routes them to phxgrowth.com whenever a tier is genuinely the better buy. Tower selected alone returns `blocked: true` and the page refuses to sell it, because a commander with nothing to command is a monitoring product for an empty room. Removing that turns the page into an ordinary store and costs it the credibility the rest of the copy depends on.

**2. No price ever crosses the wire.** The checkout endpoint accepts seat *keys* only. Prices resolve server-side to Stripe Price IDs and Stripe reads the amount off its own object. If you refactor checkout, keep this — a posted price is user input.

---

## Stripe

Products and prices exist in **both** modes already (account `Greenvlt`):

| | Live | Sandbox |
|---|---|---|
| Closer | $995/mo | same |
| Herald | $1,150/mo | same |
| Tower | $850/mo | same |
| Echo | $590/mo | same |
| The Front Desk (Closer+Echo) | $1,440/mo | same |
| The Unpaid Crew (Herald+Echo) | $1,590/mo | same |
| The Full Board (all four) | $3,250/mo | same |

Webhook endpoints registered in both modes, pointing at `/api/webhooks/stripe`, on `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`.

### Switching test ↔ live is two variables

Live and test Price IDs live side by side — `STRIPE_PRICE_*` and `STRIPE_PRICE_*_TEST`. The app reads the mode off the secret key and picks the matching set. So flipping the whole site is only ever:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

The price IDs never move. This exists because the alternative — swapping nine variables by hand — fails silently: a live key with test Price IDs gives `No such price` at the moment a customer clicks buy, with a green deploy and a page that looks fine.

### Still outstanding

Neither secret is set in production yet, so **the site cannot currently take a payment.** It correctly hides the buy button and takes enquiries instead. Add both in Vercel → Environment Variables → Production and it goes live.

---

## Known issues you're inheriting

1. **`outreach.phxgrowth.com` fails DNS verification in Resend.** This is the sender for the "somebody bought a seat" notification. Until it's fixed, a real purchase could succeed and the alert could silently not arrive.
2. **Six orphan platform plans.** `src/lib/catalog.ts` still holds Launch/Scale/Command and Monitor/Operate/Dominate ($1,297–$7,997), wired into the database, admin and entitlements. Nothing sells them. They are leftovers from an older positioning and want deleting, but it's a separate job.
3. **A duplicate Vercel project.** There is another `addtophxgrowth` in the `jaden-green-s-projects` team owning `addtophxgrowth.vercel.app`. It is *not* this app. `vercel project rename` defaults to that scope and will silently hit the wrong project — always pass `--scope phxgrowthadmin-cybers-projects`.
4. **`main` is stale.** It still holds the previous version of this site (seven interactive diagnostic instruments). This branch replaced them.

---

## If you're merging this into another codebase

The marketing site is largely self-contained. The minimum useful transplant is:

- `src/lib/upgrades.ts` and `src/lib/seat-billing.ts` (no framework dependencies beyond a `formatCurrency` helper)
- `src/components/marketing/flight-line.tsx` + `fx.tsx` + `pulse.tsx` + `system-field.tsx`
- `src/app/globals.css` and `tailwind.config.ts` for the palette
- The two API routes

The rest of the repo — agent workspace, night-shift briefs, ad-ops, gate approvals, Prisma schema — is the older client platform and is not required by the SOLO page.
