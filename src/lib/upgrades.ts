/**
 * The seat catalogue.
 *
 * DIRECTION
 *   This site is not an agency and does not sell a growth programme.
 *   PHX/GROWTH does that at phxgrowth.com — "the autonomous media buyer that
 *   flies your ad spend to profit."
 *
 *   Their Agents page states the offer in one sentence: "10 operators. Three
 *   ways to hire them." Pilot, Squadron, Fleet Command. This property sells
 *   the fourth way — one operator, one price, month to month — and it exists
 *   because of a specific asymmetry rather than a gap in their catalogue.
 *
 *   PHX/GROWTH is a media buying desk, so every tier is bundled by how much
 *   spend the operators are steering. That is the correct way to sell a media
 *   desk. It also means four operators whose work never touches an ad account
 *   are only reachable at $30,000 a month.
 *
 * THE RULES
 *   1. NO SPEND, NO SEAT. A seat may only exist for an operator that does
 *      useful work with zero ad budget behind it. Six of the ten fail this and
 *      live in `LOCKED`, each with its reason and the tier that unlocks it.
 *   2. NEVER UNDERCUT THE DESK. Where the parent sells the same job à la
 *      carte, the seat carries the parent's published price rather than a
 *      cheaper one. Closer is $995/mo because phxgrowth.com/pricing lists AI
 *      Phone Agents "from $995/mo".
 *   3. SAY WHAT IT WON'T DO. Every seat carries a `wont` line.
 *   4. TALK THEM OUT OF IT. Where a parent tier is better value the page says
 *      so and links there. `checkSeats()` is that rule in code, and two of its
 *      six verdicts route revenue off this property on purpose.
 *
 * THE 2027 FILTER
 *   Unpaid demand is the whole thesis, and rule 1 is what produces it rather
 *   than a slogan chosen afterwards. Paid acquisition keeps getting more
 *   expensive and less measurable as third-party signal degrades; the
 *   customers a business does not pay for — the search it ranks for, the
 *   reviews that carry it, the call it actually answers — are the ones whose
 *   economics improve while everyone else's decay. Every operator that
 *   survives rule 1 is on that side of the line, because an operator that
 *   needs no ad budget is definitionally an operator working unpaid demand.
 *
 *   Deliberately absent: invented statistics. Nothing here claims a
 *   percentage, multiple or outcome we cannot stand behind, and
 *   `upgrades.test.ts` enforces it.
 */
import { formatCurrency } from "@/lib/utils";

export type ServiceKey = "premium-ai-ads" | "ai-employees" | "website-creation";

export interface ParentService {
  key: ServiceKey;
  /** Exactly as PHX/GROWTH names it. */
  name: string;
  /** Their price, as their page states it. */
  priceLabel: string;
  /** Their performance fee line, where there is one. */
  feeLabel?: string;
  /** Their one-line description, near enough verbatim. */
  role: string;
  /** Their own bullet list. The additive rule is checked against this. */
  includes: string[];
  /** The limit of the service as sold — what the upgrades answer. */
  ceiling: string;
}

/**
 * What PHX/GROWTH already runs. Nothing here is ours and nothing on this site
 * replaces any of it — every upgrade assumes it is already flying.
 */
export const PARENT_SERVICES: ParentService[] = [
  {
    key: "premium-ai-ads",
    name: "Premium AI Ads",
    priceLabel: "from $7,500/mo",
    feeLabel: "+ 12% of ad spend",
    role: "Scroll-stopping ad copy, policy-cleared, with a visual brief — fresh on demand.",
    includes: [
      "Platform-native copy sets",
      "Policy compliance screen",
      "On-brand visual briefs",
      "Fresh creative on demand",
    ],
    ceiling:
      "The Manifest covers twelve things from account audit to zero-based budget resets — tracking, offer and price testing, landing pages, compliance, attribution. The desk says it plainly: \"we don't make your ads.\" Nobody films anything.",
  },
  {
    key: "ai-employees",
    name: "AI Employees",
    priceLabel: "from $7,000/mo",
    role: "A crew of AI operators in your Slack, with a first-week deployment plan.",
    includes: [
      "Specialist agent crew",
      "First-week deployment plan",
      "Lives in your Slack",
      "Works 24/7",
    ],
    ceiling:
      "Ten operators cover strategy through reputation, and Closer works every lead across email, SMS and DM. Two things remain nobody's standing job: the phone when it rings, and grading the crew's own output against the deals that closed. Both can be engineered bespoke inside Automated AI Systems — these are the productised route if you're not commissioning a private build.",
  },
  {
    key: "website-creation",
    name: "Website Creation",
    priceLabel: "from $3,500 one-time",
    role: "A complete, conversion-built website — live, hosted and kept sharp on the PHXGrowth engine.",
    includes: [
      "Sitemap + conversion copy",
      "Responsive, accessible build",
      "Deployed to a live URL",
      "Hosted & managed by PHXGrowth",
    ],
    ceiling:
      "Herald wins the rankings and the map pack, and the desk manages both sides of the click. What nothing reaches is the buyer who never sees a results page — they ask an assistant, and it answers from sources you don't own.",
  },
];

/** Their managed tiers, shown so a visitor can see where upgrades sit. */
export interface FlightPlan {
  key: string;
  /** Their eyebrow — WINGMAN / PILOT / SQUADRON / FLEET. */
  code: string;
  name: string;
  promise: string;
  price: string;
  /** Cents per month. The Check compares seat totals against this. */
  monthly: number;
  fee: string;
  ceilingNote: string;
  /** How many of the ten operators this plan actually unlocks. */
  operators: number;
  badge?: string;
}

/**
 * Their managed tiers, transcribed from phxgrowth.com/pricing.
 *
 * These were wrong in this file for a while — the fees read 8% / 6% / 4% and
 * Wingman was missing altogether, which mattered more than a typo normally
 * would. Wingman is $1,500/mo and it is the single cheapest way into the
 * house; a page that talks a visitor out of over-buying cannot itself be
 * quoting numbers that flatter it. Every figure here is now the parent's
 * published one, and `upgrades.test.ts` pins them.
 */
export const FLIGHT_PLANS: FlightPlan[] = [
  {
    key: "wingman",
    code: "Wingman",
    name: "Wingman",
    promise: "Three automations live in week one, and one employee in Slack",
    price: "$1,500/mo",
    monthly: 150000,
    fee: "+ $450/mo per extra automation",
    ceilingNote: "No ad management",
    operators: 1,
  },
  {
    key: "pilot",
    code: "Pilot",
    name: "Pilot",
    promise: "One channel, fully flown to profit",
    price: "$5,000/mo",
    monthly: 500000,
    fee: "+ 5% of managed ad spend",
    ceilingNote: "Up to $50k/mo managed",
    operators: 1,
  },
  {
    key: "squadron",
    code: "Squadron",
    name: "Squadron",
    promise: "The full media mix, flown as one portfolio",
    price: "$12,500/mo",
    monthly: 1250000,
    fee: "+ 3.5% of managed ad spend",
    ceilingNote: "Up to $250k/mo managed",
    operators: 3,
    badge: "Most flown",
  },
  {
    key: "fleet",
    code: "Fleet Command",
    name: "Fleet Command",
    promise: "No ceiling. Your own air force.",
    price: "$30,000/mo",
    monthly: 3000000,
    fee: "+ 2% of managed ad spend",
    ceilingNote: "Unlimited spend managed",
    operators: 10,
    badge: "Apex",
  },
];

export function flightPlanByKey(key: string): FlightPlan | undefined {
  return FLIGHT_PLANS.find((p) => p.key === key);
}


/**
 * The roster. Ten named operators, exactly as the AI Employees page lists them.
 *
 * This is not decoration — it is the thing every upgrade is checked against.
 * PHX/GROWTH's crew is far more complete than an outsider would guess, and
 * three upgrades that looked obviously additive turned out to be work Herald
 * and Echo already do. Keeping the roster here, in the same file as the
 * catalogue, is what makes that collision impossible to miss.
 */
export interface Operator {
  name: string;
  role: string;
  /** Their eyebrow: STRATEGY, MEDIA BUYING, CREATIVE… */
  domain: string;
  /** Their chip: FLIGHT PLAN, CONTROL STICK, TOP SLOT… */
  chip: string;
  /** What it does, near enough verbatim — the additive rule reads this. */
  covers: string;
}

export const OPERATORS: Operator[] = [
  {
    name: "Atlas",
    role: "Growth Strategist",
    domain: "Strategy",
    chip: "Flight Plan",
    covers:
      "Researches the product, market, competitors, offers, personas, objections and channel fit before a single dollar leaves the runway.",
  },
  {
    name: "Vector",
    role: "Autonomous Media Buyer",
    domain: "Media Buying",
    chip: "Control Stick",
    covers:
      "Flies Meta, Google and TikTok as one portfolio and shifts spend by marginal return on your P&L, lifecycle-aware, on a 15-minute optimisation loop.",
  },
  {
    name: "Prism",
    role: "Creative Genome Director",
    domain: "Creative",
    chip: "Forge Lead",
    covers:
      "Breaks creative into hooks, frames, pacing, claims and emotional arcs, then recombines the winning genes into render-ready briefs for the Creative Forge.",
  },
  {
    name: "Ledger",
    role: "Profit & Attribution Analyst",
    domain: "Economics",
    chip: "Ground Truth",
    covers:
      "Reconciles platform-reported ROAS against Shopify orders, returns, COGS, LTV and QuickBooks so the buyer steers by contribution profit.",
  },
  {
    name: "Shield",
    role: "Compliance Guard",
    domain: "Trust",
    chip: "Preflight",
    covers:
      "Reviews copy, targeting, landing pages and creative against platform-sensitive categories before anything goes live.",
  },
  {
    name: "Relay",
    role: "Automation Engineer",
    domain: "Automation",
    chip: "Wiring Bay",
    covers:
      "Owns the app routes, connector registry, n8n webhooks and Zapier handoffs that turn agent decisions into external actions.",
  },
  {
    name: "Tower",
    role: "Operations Commander",
    domain: "Operations",
    chip: "Mission Control",
    covers:
      "Coordinates the specialist agents, checks builds and production health, and turns incidents into clear next actions.",
  },
  {
    name: "Closer",
    role: "AI Sales Closer",
    domain: "Sales",
    chip: "Approach",
    covers:
      "Reads each inbound lead the second it lands, qualifies on fit and intent, and runs a persistent follow-up cadence across email, SMS and DM until the deal is booked or dead.",
  },
  {
    name: "Herald",
    role: "SEO & Local Rank Commander",
    domain: "Search",
    chip: "Top Slot",
    covers:
      "Hunts the keywords your buyers type, ships the pages and Google Business updates that win them, and watches the map pack daily.",
  },
  {
    name: "Echo",
    role: "Reputation & Reviews Concierge",
    domain: "Reputation",
    chip: "Five Star",
    covers:
      "Times the review ask for the moment a customer is happiest, routes them to a public review, catches unhappy ones privately, and answers every review in your voice.",
  },
];

export function operatorByName(name: string): Operator | undefined {
  return OPERATORS.find((o) => o.name === name);
}


/**
 * The Manifest — the twelve numbered items on the Ad Management page, under
 * the heading "what 'everything' means, in writing".
 *
 * This is here for one reason: it is the strictest thing an upgrade has to
 * survive. Reading it cut three more — an offer lab (item 07, plus the AOV
 * lever "offer architecture managed like media"), a tracking rebuild (item 02,
 * "pixel + conversions API, server-side, tied to real orders") and a
 * conversion lab (item 06, "the page is part of the ad"). Every one looked
 * additive right up until this list was written down beside it.
 */
export const MANIFEST: { n: string; title: string; detail: string }[] = [
  { n: "01", title: "Account audit & restructure", detail: "The full teardown first — structure, settings, history, waste." },
  { n: "02", title: "Tracking wired honest", detail: "Pixel + conversions API, server-side, tied to real orders." },
  { n: "03", title: "Budget & bid management", detail: "Rebalanced every 15 minutes by marginal profit, 24/7." },
  { n: "04", title: "Creative testing & rotation", detail: "Whoever makes your ads — we decide what runs, scales and dies." },
  { n: "05", title: "Audience & suppression", detail: "Seed, exclude, retarget — synced from your CRM as hashed audiences." },
  { n: "06", title: "Landing page & funnel", detail: "The page is part of the ad. We manage both sides of the click." },
  { n: "07", title: "Offer & price testing", detail: "AOV is a managed number, not an accident of the catalog." },
  { n: "08", title: "Policy & compliance pre-flight", detail: "Every asset cleared against platform policy before it spends." },
  { n: "09", title: "Attribution & incrementality", detail: "MMM and holdouts — what actually moved revenue, post-ATT." },
  { n: "10", title: "Profit reconciliation", detail: "Platform numbers checked against your books, every run." },
  { n: "11", title: "War-room reporting", detail: "Every decision logged to Slack in plain English, as it happens." },
  { n: "12", title: "Zero-based budget resets", detail: "Each quarter the plan re-earns every dollar from scratch." },
];

/**
 * The sentence that defines this entire site's remaining territory. They say
 * it themselves, in the Ad Management hero. Everything PHX/GROWTH PLUS can
 * honestly sell lives in the gap this opens.
 */

/**
 * The two revenue levers the Ad Management page details underneath the
 * Manifest — AOV and LTV. These are checked alongside the Manifest itself,
 * and they had to be: an offer-lab upgrade slipped past a Manifest-only check
 * because item 07 is terse ("AOV is a managed number"), while the detail that
 * actually kills it — "offer architecture managed like media: bundles,
 * thresholds, post-purchase upsells" — lives down here. A partial copy of the
 * parent's scope is worse than none, because it reads as a check that passed.
 */

/**
 * The Automation Spine — the four named loops, plus the flagship engagement
 * that sits above them.
 *
 * Checked like everything else. This page mostly confirmed the surviving
 * upgrades rather than cutting any, but it did two useful things: it named a
 * "white-glove install and training" line that collided with an upgrade called
 * The Training Lab (renamed to The Tuning Lab — same work, no ambiguity), and
 * it established that a bespoke voice loop *could* be engineered inside the
 * flagship. That is worth stating plainly rather than hiding: the Voice
 * Employee is the productised route for clients who are not commissioning a
 * private build.
 */

/**
 * The proof posture, taken from the Results page.
 *
 * This is the most consequential thing any of the parent's pages has said, and
 * it is not about scope. Every number over there is labelled "representative"
 * and footnoted "not a guarantee", and the page states outright that the case
 * studies aren't up yet — "when the case studies go up here, the numbers will
 * be real". They run founding accounts at founding pricing instead.
 *
 * An upgrade counter selling four-figure monthly work as though it were a
 * mature product line, next to a parent that candid, would read as the less
 * honest of the two properties. So this site matches the posture rather than
 * quietly benefiting from the contrast: no outcome claims anywhere, said out
 * loud, plus the same founding-rate offer. `upgrades.test.ts` enforces the
 * first half — no percentage, multiple or outcome claim may appear in any
 * upgrade copy — and the page states the second half in its own section.
 */

/**
 * The homepage credential strip and its headline claims.
 *
 * The last page, and the first that cut nothing — no new service is named on
 * it. It is here for the check anyway (an upgrade must not restate "A-to-Z ad
 * management" or "4 native channels" back at a client), and for the strip
 * itself, which is a house pattern this site was missing.
 */
export const HOUSE_STRIP: string[] = [
  "Profit-optimized",
  "4 native channels",
  "A-to-Z ad management",
  "<60min to live",
];

export const HOME_CLAIMS: string[] = [
  "An autonomous media buyer that flies Meta, Google & TikTok to real profit — 24/7, hands off the wheel.",
  "The incumbents open with logo walls. We open the cockpit: a live demo, math you can audit, and a 30-day flight check.",
  "Every campaign is reverse-engineered from one goal: bring you buyers who pay.",
  "Fresh, native creative and tight targeting fill the top of your funnel — daily.",
  "Put your spend and margins into the Growth Calculator and get the same honest math the pilot flies by.",
];

export const PROOF_POSTURE = {
  eyebrow: "No numbers yet",
  headline: "We won't show you results we haven't earned.",
  body: "PHX/GROWTH labels every figure on its results page \u201crepresentative\u201d and says plainly that the case studies aren\u2019t up yet. The same is true here, more so \u2014 these upgrades are new. You will not find a percentage, a multiple or a testimonial anywhere on this page, because there isn\u2019t an honest one to show yet.",
  founding:
    "What we can offer instead is the founding rate: the price you start at is the price you keep, for as long as the upgrade runs. Early accounts get the people building it, and when the numbers do exist, they will be real.",
} as const;

/**
 * The illustrative before/after work described on the Results page. Checked
 * like everything else — "built the offer + funnel", "rebuilt the site around
 * one clear CTA" and "wired tracking honest end to end" are all things an
 * upgrade might otherwise have tried to sell.
 */
export const RESULTS_WORK: string[] = [
  "Built the offer + funnel",
  "Generated a 14-day content calendar",
  "Launched a demo-booking landing page in an afternoon",
  "Rebuilt the site around one clear CTA",
  "Wired tracking honest end-to-end",
  "Reallocated budget to the two channels that actually sold",
  "Conversion-built pages and sharp offers lift revenue per visitor",
  "Every concept is tested on synthetic buyers before it spends",
];

/**
 * How the parent frames the whole automation page. Their words.
 *
 * This matters more than it looks. "Inspectable node by node… never a black
 * box" is a published standard, and it is the standard anything sold here has
 * to meet — an upgrade that quietly runs a closed loop would be a worse
 * product than the thing it attaches to, sold by the same company.
 */
export const AUTOMATION_SPINE = {
  eyebrow: "The Automation Spine",
  headline: "The loops that run while you sleep.",
  body:
    "Every decision PHXGrowth makes rides a real, auditable workflow — inspectable node by node for as long as we fly together, never a black box. These are the brains on the wing.",
} as const;

/**
 * The four loops — and, crucially, the node chain each one publishes.
 *
 * THE NODES ARE THE POINT
 *   The parent does not merely say "we optimise budget". It prints the
 *   workflow: Every 15m → Pull Meta Ads → Pull Google Ads → Pull TikTok Ads →
 *   Join + Shopify Profit → Marginal ROAS Model → Approval Gate → Apply
 *   Budgets → Log to Slack. Nine named steps, in order, on a public page.
 *
 *   Every one of those nodes is work already being done. Before these were in
 *   the repo the additive check was reading a one-line summary of each loop and
 *   passing anything the summary happened not to mention — the same failure
 *   mode that let an offer lab through when the Manifest item was terse and the
 *   detail lived in the revenue levers. `upgrades.test.ts` reads the chains now.
 */
export const AUTOMATION_LOOPS: {
  name: string;
  cadence: string;
  detail: string;
  /** The published workflow, in order, verbatim. */
  nodes: string[];
}[] = [
  {
    name: "Autonomous Budget Allocation",
    cadence: "Every 15 min",
    detail:
      "Pull spend and real profit across every channel, rank by marginal return, and move budget to the leaders before the platforms notice.",
    nodes: [
      "Every 15m",
      "Pull Meta Ads",
      "Pull Google Ads",
      "Pull TikTok Ads",
      "Join + Shopify Profit",
      "Marginal ROAS Model",
      "Approval Gate",
      "Apply Budgets",
      "Log to Slack",
    ],
  },
  {
    // Their heading is "Creative Genome Refresh". The repo carried "Creative
    // Genome" — the name of the underlying model rather than the loop — which
    // is the kind of near-miss that makes a check look like it ran.
    name: "Creative Genome Refresh",
    cadence: "On fatigue signal",
    detail:
      "The moment an ad shows fatigue: recombine its winning genes, render fresh variants in the Creative Forge, and ship them to the ad set.",
    nodes: [
      "Fatigue Detected",
      "Query Genome",
      "Compose Brief",
      "Forge Render",
      "Wait for Render",
      "Publish Variants",
    ],
  },
  {
    name: "Compliance Guardrail",
    cadence: "Pre-flight, every asset",
    detail:
      "Every asset clears pre-flight against the platform policy model before it goes live — approved, rewritten safer, or blocked.",
    nodes: [
      "Asset Submitted",
      "Policy Model",
      "Risk Branch",
      "Auto-Rewrite",
      "Approve to Queue",
      "Flag for Human",
    ],
  },
  {
    name: "Zero-to-Live Launch",
    cadence: "On new client URL",
    detail:
      "From one product URL: research, personas, strategy, first creative, tracking, and a live campaign — hands-off, wheels up.",
    nodes: [
      "Product URL In",
      "Scrape + Research",
      "Build Personas",
      "Draft Strategy",
      "Forge Creative",
      "Wire Tracking",
      "Launch Campaign",
      "Notify Client",
    ],
  },
];

/**
 * "One URL to live ads, in under 60 minutes." The parent's own clock.
 *
 * Held here because it is the sharpest thing either property claims about
 * speed, and it is therefore the bar an upgrade must not casually restate. If
 * anything sold on this site ever promises a fast launch, it is promising
 * something the parent already does in under an hour.
 */
export const LAUNCH_TIMELINE: { at: string; title: string; detail: string }[] = [
  {
    at: "T-0",
    title: "You paste one product URL",
    detail: "That's the entire brief. No kickoff call, no intake form, no sprint planning.",
  },
  {
    at: "T+8m",
    title: "Research + personas",
    detail: "It scrapes the market, reads your competitors, and builds synthetic buyer personas.",
  },
  {
    at: "T+21m",
    title: "Strategy + launch set",
    detail:
      "Drafts the channel + budget plan across Meta, Google & TikTok, then stages the launch ad set — every concept pre-tested on synthetic buyers before a dollar moves.",
  },
  {
    at: "T+44m",
    title: "Tracking wired honest",
    detail:
      "Pixels and CAPI in place, Shopify margin plugged in as ground truth so every decision steers by real profit.",
  },
  {
    at: "T+58m",
    title: "Campaign live",
    detail:
      "It goes live and pings your Slack war room: “It's flying.” Optimization starts today, not next month.",
  },
];

/**
 * The flagship engagement. Private, by application, and explicitly bespoke —
 * which is exactly why an upgrade cannot hide behind "but that's custom". If a
 * client commissions this, anything here can be engineered into it, and the
 * page says so rather than pretending otherwise.
 */
export const FLAGSHIP = {
  name: "Automated AI Systems",
  tagline: "Your business, running itself.",
  badge: "Flagship \u00b7 Private build",
  access: "By application",
  /**
   * Their scoping terms, verbatim. Load-bearing for this whole site: it is the
   * sentence that says the flagship is neither productised nor always
   * available, which is precisely the gap a fixed-price, fixed-scope
   * automation build sits in.
   */
  scoping:
    "Scoped and quoted in writing after a private consult. We take a limited number of builds each quarter \u2014 every one is engineered, not configured.",
  summary:
    "We engineer the loops above — and the ones your business is missing — into one bespoke system: lead intake, follow-up, fulfillment, reporting and ad optimization, working around the clock without you. Engineered to your stack, never templated.",
  includes: [
    "Systems audit + automation map of your whole funnel",
    "Custom-engineered agent crew + workflow suite",
    "CRM, ad platforms, Slack and email — wired end to end",
    "Approval gates, audit logs and dry-run safety on every loop",
    "White-glove install and training",
    "Licensed to your business for as long as we fly together",
  ],
} as const;

export const REVENUE_LEVERS: { code: string; name: string; claim: string; bullets: string[] }[] = [
  {
    code: "AOV",
    name: "Average Order Value",
    claim: "More revenue out of every order the ads bring in.",
    bullets: [
      "Offer architecture managed like media: bundles, thresholds, post-purchase upsells",
      "Landing pages kept congruent with the ad promise — message match is a KPI",
      "Price-point and offer tests flown with the same kill rules as ad tests",
      "The checkout path audited every quarter — leaks fixed before budget scales",
    ],
  },
  {
    code: "LTV",
    name: "Customer Lifetime Value",
    claim: "More revenue out of every customer, long after the click.",
    bullets: [
      "Prospecting seeded from your best repeat cohorts — not lookalike guesswork",
      "Existing customers suppressed, so spend only hunts new money",
      "Acquisition steered toward the cohorts that actually repurchase",
      "Paid synced with retention flows, so the second order costs nothing",
    ],
  },
];

export const CREATION_DISCLAIMER = "We don't make your ads. We make them make money.";

export type Billing = "monthly" | "one_time";

export interface Upgrade {
  key: string;
  name: string;
  /** Which PHX/GROWTH service this bolts onto. */
  attachesTo: ServiceKey;
  /** One line, in the owner's language, on what changes. */
  promise: string;
  /** Why demand for this is rising into 2027. A mechanism, not a slogan. */
  demandCase: string;
  /** Exactly what is delivered. Concrete enough that the price reads as earned. */
  delivers: string[];
  /** Cents. */
  price: number;
  billing: Billing;
  /** The single hardest thing this fixes — the card's kicker. */
  fixes: string;
  /**
   * True for the automation builds — upgrades that ship a running loop rather
   * than a service performed for you.
   *
   * The distinction is real and worth marking. The Motion Unit sends a crew to
   * film; the Job Runner installs a workflow that keeps running after everyone
   * has gone home. Both are upgrades, but only the second one has to answer for
   * what happens at 3am, which is why the builds carry the parent's published
   * standard — inspectable node by node, with a gate on anything that moves
   * money — and the others do not need to.
   */
  build?: boolean;
  /**
   * Builds only, and required for them: what you can see and stop.
   *
   * A dedicated field rather than a line in `delivers`, because the first
   * version of this rule read the delivers prose for words like "visible" and
   * "read-out" — and a monthly report is not the same claim as being able to
   * look inside a running loop. The check passed on copy that happened to
   * contain the right word while saying the wrong thing, which is the exact
   * shape of a test that is not testing anything.
   */
  oversight?: string;
  /** One per service: the one most clients take first. */
  leading?: boolean;
  /** The apex upgrade — gets the gold treatment, exactly one on the page. */
  apex?: boolean;

  // ---- Single-seat fields. Required on every seat; a test enforces it. ----

  /**
   * When this operator is on duty. The parent's homepage runs a section called
   * "The shift board", so a seat that does not state its shift is speaking a
   * different language from the house it attaches to.
   */
  shift?: string;
  /**
   * The refusal. What this seat will not do, stated before anybody asks.
   *
   * Every seat carries one and none of them is decorative. A single operator
   * hired alone is a deliberately narrow purchase, and the failure mode of
   * selling narrow things is that the buyer fills in the edges optimistically
   * and discovers the truth in month two. Cheaper to lose the sale here.
   */
  wont?: string;
  /** How this seat relates to demand you did not pay for — the site's thesis. */
  unpaid?: string;
  /**
   * Minimum number of *other* seats this one needs to make sense.
   *
   * Only Tower sets it. Tower is a commander, and a commander hired with
   * nothing to command is a monitoring product for an empty room.
   * `checkSeats()` reads this and the page refuses to price the basket until
   * it is satisfied.
   */
  requiresCrew?: number;
}

/**
 * THE SEATS
 *
 * DIRECTION
 *   The parent's Agents page makes the offer in one sentence: "10 operators.
 *   Three ways to hire them." The three ways are Pilot ($5,000/mo), Squadron
 *   ($12,500/mo) and Fleet Command ($30,000/mo). This file is the fourth way.
 *
 *   The opening is not a gap in their catalogue — it is a consequence of what
 *   they are. PHX/GROWTH is a media buying desk, so every tier is priced
 *   against a budget in flight and the operators are bundled by how much spend
 *   they are steering. That is the right way to sell a media desk. It also
 *   means four operators whose work never touches an ad account are only
 *   reachable at $30,000 a month.
 *
 * THE RULES
 *   1. NO SPEND, NO SEAT. A seat may only exist for an operator that does
 *      useful work with zero ad budget behind it. Six fail this and are listed
 *      in LOCKED below, each with the reason and the tier that unlocks them.
 *   2. NEVER UNDERCUT THE DESK. Where the parent already sells the same job à
 *      la carte, the seat carries the parent's own published price rather than
 *      a cheaper one. Closer is the case in point: phxgrowth.com/pricing lists
 *      AI Phone Agents "from $995/mo", so the Closer seat is $995/mo. Winning
 *      a client by underpricing the desk you are attached to is a way to lose
 *      both.
 *   3. SAY WHAT IT WON'T DO. Every seat carries a `wont` line. A single
 *      operator hired alone is a narrow thing, and the fastest way to make a
 *      narrow thing feel dishonest is to describe only its edges that flatter.
 *   4. TALK THEM OUT OF IT. Where a parent tier is better value, the page says
 *      so and links there. `checkSeats()` below is that rule in code.
 *
 * THE 2027 FILTER, RESTATED
 *   Unpaid demand is the whole thesis of this property. Paid acquisition keeps
 *   getting more expensive and less measurable; the customers a business does
 *   not pay for — the search it ranks for, the reviews that carry it, the call
 *   it actually answers — are the ones whose economics improve as everyone
 *   else's degrade. Every seat here is on that side of the line, and that is
 *   not a coincidence: it is rule 1 doing its job.
 */
export const UPGRADES: Upgrade[] = [
  {
    key: "seat-closer",
    name: "Closer",
    attachesTo: "ai-employees",
    promise: "Answers every call and lead in under a minute. Missed calls get called back.",
    demandCase:
      "A caller who reaches voicemail dials the next number, and for most local businesses the phone is still where the money calls. Answering it around the clock used to be a staffing line nobody could justify against the handful of calls that arrive after six; it is now a software line. The seat is priced at the desk's own published rate for this work rather than under it.",
    delivers: [
      "Inbound calls and form leads worked within sixty seconds, day or night",
      "Missed calls rung back automatically rather than left as a voicemail",
      "Qualification on fit and intent, then booked straight to your calendar",
      "Persistent follow-up across email, SMS and DM until the deal is booked or dead",
      "Every call transcribed and on your deck before you wake up",
    ],
    price: 99500,
    billing: "monthly",
    fixes: "The phone nobody answers",
    build: true,
    oversight:
      "Closer talks to your customers, so everything it can commit you to waits for you. A quote and a payment are hard-held — they sit in the queue until you release them, and every release is recorded against your name. A booking or a follow-up is time-held instead: visible in the queue with a countdown you can cancel inside, because a sixty-second promise held for a day is not a promise.",
    shift: "24/7/365",
    wont: "Quote a price it hasn't been given a rate card for, or take a payment. Both wait for you.",
    unpaid: "Works the demand you already generated — it does not create any.",
    leading: true,
  },
  {
    key: "seat-herald",
    name: "Herald",
    attachesTo: "website-creation",
    promise: "Wins the searches your buyers type — the clicks you don't pay for.",
    demandCase:
      "Every other operator on the board is downstream of a budget. Herald is the one whose output keeps arriving after you stop spending, which is exactly why it is the hardest one to justify buying at the tier that currently carries it. Unpaid search compounds slowly and only for whoever started earlier, so the cost of waiting a year is a year.",
    delivers: [
      "The keywords your buyers actually type, hunted and ranked by winnability",
      "Pages shipped against them — written, built and published, not recommended",
      "Google Business Profile worked weekly: posts, categories, photos, Q&A",
      "Map pack position watched daily and defended when it slips",
      "A monthly read-out of what moved, what didn't, and what ships next",
    ],
    price: 115000,
    billing: "monthly",
    fixes: "Invisible in the searches you already sell to",
    build: true,
    oversight:
      "Herald changes things the public can see — pages on your own site and the fields on your Google Business Profile that decide whether the map pack shows you at all. Both are hard-held: nothing publishes and no category, hour or service area changes until you have read it and released it.",
    shift: "Continuous · reports Mondays",
    wont: "Buy a single click. Herald is the unpaid side of the board — paid search is Vector's job and Vector needs a flight plan.",
    unpaid: "Pure unpaid demand. Nothing here is downstream of an ad budget.",
    leading: true,
    apex: true,
  },
  {
    key: "seat-tower",
    name: "Tower",
    attachesTo: "ai-employees",
    promise: "Watches whatever you have flying and names the problem before you notice it.",
    demandCase:
      "Every seat on this page runs unattended, which is the point of it and also the risk. A phone agent that silently stops answering is worse than no phone agent, because you stop checking. Tower is the operator whose entire job is noticing — and it is the cheapest insurance on the board precisely because it produces nothing on its own.",
    delivers: [
      "Every seat you run health-checked continuously, not on a schedule you have to remember",
      "Incidents named in plain English with the next action attached, inside five minutes",
      "A weekly board of what each operator did, what it cost and what it returned",
      "Escalation to a human the moment something is stuck rather than slow",
    ],
    price: 85000,
    billing: "monthly",
    fixes: "An operator that quietly stopped working",
    shift: "24/7/365",
    wont: "Make the call for you. Tower reports and escalates; it does not overrule an operator or change your settings.",
    unpaid: "Oversight, not demand. It makes the other seats trustworthy.",
    /**
     * The one seat with a prerequisite, and it is a real one rather than a
     * packaging trick. Tower is a commander — hired with nothing to command it
     * is a monitoring dashboard for an empty room, and selling that would be
     * the exact thing this page exists to stop. `checkSeats()` enforces it.
     */
    requiresCrew: 2,
  },
  {
    key: "seat-echo",
    name: "Echo",
    attachesTo: "ai-employees",
    promise: "Turns happy customers into stars, and catches the unhappy ones first.",
    demandCase:
      "Star rating is the one number that changes the cost of every click a business will ever buy, paid or not, and it is set by whoever happens to feel strongly enough to type. The lever is timing: the same customer asked at the right hour and asked three weeks later are two different outcomes. It is the cheapest seat here and the one that most reliably makes the others cheaper.",
    delivers: [
      "The review ask timed to the moment a job actually landed well",
      "Unhappy customers routed to you privately before they route themselves publicly",
      "Every review answered in your voice, including the bad ones",
      "Rating and volume tracked against the competitors in your map pack",
    ],
    price: 59000,
    billing: "monthly",
    fixes: "A rating set by whoever felt strongest",
    build: true,
    oversight:
      "Echo speaks in your voice in public, which makes a bad sentence expensive in a way a bad ad never is. A reply to a review is hard-held and waits for you. A review request is time-held on a twelve-hour window — long enough to read the queue over a coffee, short enough that the ask still lands while the job is fresh.",
    shift: "24/7/365",
    wont: "Write a review, buy a review, or bury one. It asks, it routes, it replies — that is the whole of it.",
    unpaid: "Pure unpaid demand, and it lowers the price of the paid kind too.",
  },
];

/**
 * The six that are not for sale here, and why.
 *
 * This list is doing more work than the four above it. An owner reading a
 * roster of ten with four prices on it will ask what happened to the other
 * six, and the answer has to be better than silence. Each of these fails rule
 * 1 — no useful work without a budget in flight — except Relay, which fails
 * rule 2 instead: the parent already sells that job for less than a seat here
 * could honestly cost.
 *
 * Every entry routes to the tier that actually unlocks it. That is the point:
 * six of the ten cards on this page are advertisements for phxgrowth.com.
 */
export interface LockedSeat {
  name: string;
  /** Their role line, as the Agents page states it. */
  role: string;
  /** Their one-liner, near enough verbatim. */
  does: string;
  /** Why it cannot be a single seat. */
  reason: string;
  /** The FLIGHT_PLANS key that unlocks it. */
  unlockedBy: string;
}

export const LOCKED: LockedSeat[] = [
  {
    name: "Vector",
    role: "Autonomous Media Buyer",
    does: "Moves your budget to whatever is making money — every fifteen minutes.",
    reason:
      "The entire job is moving a budget. With no budget there is nothing to move, and a media buyer with nothing to buy is a subscription to a graph.",
    unlockedBy: "pilot",
  },
  {
    name: "Prism",
    role: "Creative Genome Director",
    does: "Ships the next winning ad before the old one wears out.",
    reason:
      "Prism works from what the current ads are doing — which hooks are fatiguing, which frames still hold. Nothing running means nothing to learn from, and it would be inventing rather than directing.",
    unlockedBy: "squadron",
  },
  {
    name: "Ledger",
    role: "Profit & Attribution Analyst",
    does: "Checks platform claims against your books, every run.",
    reason:
      "There are no platform claims to check. Ledger exists to catch the gap between what Meta says it did and what your bank says happened; with no spend, both sides of that comparison are zero.",
    unlockedBy: "squadron",
  },
  {
    name: "Atlas",
    role: "Growth Strategist",
    does: "Builds the plan before a dollar leaves the runway.",
    reason:
      "The plan Atlas builds is a spend plan — channel fit, budget split, the order experiments run in. It is genuinely useful and it is genuinely about money you are about to spend on ads.",
    unlockedBy: "fleet",
  },
  {
    name: "Shield",
    role: "Compliance Guard",
    does: "Clears every ad before it spends — no banned accounts.",
    reason:
      "Shield is a pre-flight check on ads. No ads, no pre-flight. Selling it as a standalone would be selling a fire door for a building with no fire.",
    unlockedBy: "fleet",
  },
  {
    name: "Relay",
    role: "Automation Engineer",
    does: "Keeps every decision wired to a real action.",
    reason:
      "This one is not locked, it is just cheaper over there. Wingman is $1,500/mo and includes three working automations built for you in week one plus an employee in Slack. A single Relay seat could not honestly beat that, so we don't offer one.",
    unlockedBy: "wingman",
  },
];

export function serviceByKey(key: ServiceKey): ParentService | undefined {
  return PARENT_SERVICES.find((s) => s.key === key);
}

export function upgradesFor(service: ServiceKey): Upgrade[] {
  return UPGRADES.filter((u) => u.attachesTo === service);
}

/** The upgrades that ship a running loop rather than a service performed for you. */
export function automationBuilds(): Upgrade[] {
  return UPGRADES.filter((u) => u.build);
}

export function upgradeByKey(key: string): Upgrade | undefined {
  return UPGRADES.find((u) => u.key === key);
}

/** Cheapest monthly upgrade, for the "from" line in the hero. */
export function entryPrice(): number {
  return Math.min(...UPGRADES.filter((u) => u.billing === "monthly").map((u) => u.price));
}


/**
 * Bundles — the reason this site exists as a separate property.
 *
 * DIRECTION
 *   phxgrowth.com sells the growth programme. This branch sells the deluxe
 *   combinations the main site does not carry: the upgrades stacked, priced
 *   below the sum of their parts, at a ticket the main site has no slot for.
 *
 *   A bundle here is not a discount dressed as a package. Each one exists
 *   because its members compound — Herald's ranking work is worth more when
 *   somebody is also earning the third-party citations a model reads, and a
 *   voice operator is worth more when its transcripts are being graded every
 *   month. That compounding is the argument; the saving is the incentive.
 *
 * BLUEPRINTS
 *   Members are upgrade keys, and the tests enforce what a bundle has to be:
 *   at least two real members, priced below the à la carte sum, and above its
 *   dearest single member — a "bundle" cheaper than one of its own parts is a
 *   pricing bug, not an offer. Every total on the page and in the enquiry is
 *   computed from these keys, never typed.
 */
export interface Bundle {
  key: string;
  name: string;
  /** Upgrade keys. Validated at module load. */
  members: string[];
  /** One line on what the combination does that the parts don't. */
  promise: string;
  /** Why these specific ones compound. */
  rationale: string;
  /** Cents per month. */
  price: number;
  /** The apex bundle — gold, exactly one. */
  apex?: boolean;
}

/**
 * Crews — seats that are worth more sitting next to each other.
 *
 * A crew here is not a discount wearing a name. Each one exists because its
 * members feed each other: Echo has nothing to time its review ask against
 * unless somebody answered the phone, and Herald's map-pack work is graded by
 * the star rating Echo is defending. The compounding is the argument and the
 * saving is only the incentive.
 *
 * The tests hold the shape: at least two real members, priced under the sum of
 * its parts and over its dearest single member. A crew that costs less than
 * one of its own seats is a pricing bug rather than an offer.
 */
export const BUNDLES: Bundle[] = [
  {
    key: "front-desk",
    name: "The Front Desk",
    members: ["seat-closer", "seat-echo"],
    promise: "Answer every call, then turn the good ones into stars.",
    rationale:
      "These two are the front and back of the same minute. Closer decides whether a caller becomes a customer; Echo decides whether that customer becomes the reason the next one calls. Run Closer alone and the goodwill it earns evaporates unrecorded. Run Echo alone and it is asking for reviews about jobs that a missed phone call meant you never won.",
    price: 144000,
  },
  {
    key: "unpaid-crew",
    name: "The Unpaid Crew",
    members: ["seat-herald", "seat-echo"],
    promise: "The two operators that bring you customers you never paid for.",
    rationale:
      "Rankings and rating are one system pretending to be two. Google reads review velocity and response rate as ranking input, so Echo's work lifts Herald's; and Herald's map-pack position is what puts the profile in front of enough people for Echo to have anybody to ask. Bought singly each is slower than it needs to be, and both of them compound, which means the delay is permanent rather than recoverable.",
    price: 159000,
  },
  {
    key: "full-board",
    name: "The Full Board",
    members: ["seat-closer", "seat-herald", "seat-tower", "seat-echo"],
    promise: "Every seat on this page, with Tower watching all of them.",
    rationale:
      "This is the whole unpaid side of the operation: found without paying for the click, answered on the first ring, asked for the review at the right hour, and watched around the clock by the one operator whose job is noticing when another has stopped. It is also the only configuration in which Tower makes sense at full stretch — three operators to command rather than the two it needs as a minimum. Fleet Command is the only other place all four are available, and it is $30,000/mo with a media budget attached.",
    price: 325000,
    apex: true,
  },
];

// Fail at import rather than rendering a bundle that prices nothing.
for (const b of BUNDLES) {
  for (const m of b.members) {
    if (!UPGRADES.some((u) => u.key === m)) {
      throw new Error(`Bundle "${b.key}" references unknown upgrade: ${m}`);
    }
  }
}

export function bundleByKey(key: string): Bundle | undefined {
  return BUNDLES.find((b) => b.key === key);
}

export function bundleMembers(bundle: Bundle): Upgrade[] {
  return bundle.members
    .map((k) => upgradeByKey(k))
    .filter((u): u is Upgrade => Boolean(u));
}

/** What the same basket costs bought one at a time. */
export function bundleListPrice(bundle: Bundle): number {
  return bundleMembers(bundle).reduce((sum, u) => sum + u.price, 0);
}

/** Monthly saving versus à la carte. Always positive — a test enforces it. */
export function bundleSaving(bundle: Bundle): number {
  return bundleListPrice(bundle) - bundle.price;
}


/* ==========================================================================
   THE CHECK
   --------------------------------------------------------------------------
   The one piece of logic on this site that can lose a sale, and the reason
   the rest of the page is believable.

   A single-seat desk attached to a bundled parent has an obvious failure
   mode: a visitor ticks four seats, reaches $3,585/mo, buys, and finds out
   later that $5,000 would have bought all four *plus* an autonomous media
   buyer. That is not a pricing error — both numbers are correct — but it is
   the kind of correct that ends a relationship, and the person it costs is
   the one who trusted the page.

   So the arithmetic runs in public, live, while they are choosing. Every
   verdict below either confirms the basket or points at phxgrowth.com, and
   two of the six actively route revenue away from this property.

   Kept as a pure function of the seat list so `upgrades.test.ts` can assert
   the awkward cases directly — Tower alone, the full board, the Wingman
   collision — rather than through the DOM.
   ========================================================================== */

export type CheckTone = "ok" | "warn" | "elsewhere";

export interface SeatCheck {
  /** Cents per month for the chosen seats, before any crew pricing. */
  total: number;
  /** ok — proceed. warn — fix something. elsewhere — go to the parent. */
  tone: CheckTone;
  /** The verdict headline. Short enough to read at a glance. */
  verdict: string;
  /** The reasoning, in the owner's language. */
  detail: string;
  /** Set when the honest answer is a parent tier. Renders as a link out. */
  goTo?: FlightPlan;
  /** Set when a named crew prices this exact basket for less. */
  crew?: Bundle;
  /**
   * True when this basket must not be reservable at all.
   *
   * Distinct from `tone`, and the distinction is the point. A "warn" verdict
   * still lets you buy — it is saying there may be a better deal, which is
   * advice. `blocked` is saying the configuration does not work, and a page
   * that prints "we would rather not sell you one" above a live Reserve
   * button has said nothing at all.
   */
  blocked?: boolean;
}

/** Cents for a set of seat keys. Unknown keys are ignored rather than thrown. */
export function seatTotal(keys: string[]): number {
  return keys.reduce((sum, k) => sum + (upgradeByKey(k)?.price ?? 0), 0);
}

/**
 * Does a named crew cover exactly this basket? Same members, no more, no less.
 * An exact match is the only honest prompt — offering a crew that contains
 * seats they did not ask for is an upsell wearing a discount's clothes.
 */
function exactCrew(keys: string[]): Bundle | undefined {
  const want = [...keys].sort().join("|");
  return BUNDLES.find((b) => [...b.members].sort().join("|") === want);
}

export function checkSeats(keys: string[]): SeatCheck {
  const seats = keys.map((k) => upgradeByKey(k)).filter((u): u is Upgrade => Boolean(u));
  const total = seats.reduce((sum, u) => sum + u.price, 0);
  const crew = exactCrew(seats.map((s) => s.key));
  const wingman = flightPlanByKey("wingman")!;
  const pilot = flightPlanByKey("pilot")!;

  if (seats.length === 0) {
    return {
      total: 0,
      tone: "ok",
      verdict: "Nothing selected.",
      detail:
        "Pick a seat. The running total, and whether a PHX/GROWTH flight plan would be the cheaper answer, both appear here as you go.",
    };
  }

  // Prerequisites first. A basket that cannot work should not be priced at
  // all — showing a total under an unmet requirement teaches the visitor the
  // requirement is soft.
  const unmet = seats.find((s) => s.requiresCrew && seats.length - 1 < s.requiresCrew);
  if (unmet) {
    const short = unmet.requiresCrew! - (seats.length - 1);
    return {
      total,
      tone: "warn",
      blocked: true,
      verdict: `${unmet.name} needs ${short} more seat${short === 1 ? "" : "s"}.`,
      detail: `${unmet.name} is a commander — its whole job is watching the other operators and telling you when one has stopped. Hired with ${seats.length - 1 === 0 ? "nothing" : "only one seat"} to watch it is a monitoring product for an empty room, and we would rather not sell you one. Add ${short} more seat${short === 1 ? "" : "s"} or drop it.`,
    };
  }

  // The Pilot line. Four seats land at $3,585 and Pilot is $5,000 — close
  // enough that anybody spending on ads at all is better off over there,
  // because Pilot carries a media buyer this desk cannot sell at any price.
  if (total >= pilot.monthly) {
    return {
      total,
      tone: "elsewhere",
      verdict: "Buy the flight plan instead.",
      detail: `This basket is ${formatCurrency(total)}/mo. Pilot is ${pilot.price} and adds an autonomous media buyer on one channel — the single thing no seat on this page is allowed to sell you. At this number you are paying single-seat rates for something the desk packages for less.`,
      goTo: pilot,
    };
  }

  if (total >= pilot.monthly * 0.7) {
    return {
      total,
      tone: "warn",
      verdict: `Within ${formatCurrency(pilot.monthly - total)} of Pilot.`,
      detail: `${formatCurrency(total)}/mo here, ${pilot.price} for Pilot. If a dollar of ad spend is in your plans this year, close the gap and go there — you get these operators' work plus a media buyer, and the fee only starts once spend is actually being managed. If you are not running ads, this basket is the right answer and Pilot would be waste.`,
      goTo: pilot,
      crew,
    };
  }

  // The Wingman collision. Wingman is $1,500/mo for three built automations
  // plus an employee in Slack, and it is genuinely better value than a single
  // mid-priced seat for anybody whose actual problem is plumbing.
  if (seats.length === 1 && total >= wingman.monthly) {
    const only = seats[0];
    return {
      total,
      tone: "warn",
      verdict: `Compare this against Wingman first.`,
      detail: `One seat at ${formatCurrency(total)}/mo is more than Wingman, which is ${wingman.price} for three working automations built for you in week one and an employee in Slack. Take the ${only.name} seat if ${only.name.toLowerCase() === "herald" ? "unpaid search" : "this specific job"} is the thing you actually need done. If your problem is that nothing in your business talks to anything else, Wingman is the better buy and we will say so.`,
      goTo: wingman,
      crew,
    };
  }

  if (crew) {
    return {
      total,
      tone: "ok",
      verdict: `${crew.name} prices this for ${formatCurrency(crew.price)}/mo.`,
      detail: `You have picked exactly the seats in ${crew.name}, which is ${formatCurrency(bundleSaving(crew))}/mo less than buying them one at a time. Same operators, same shifts, one line on the invoice.`,
      crew,
    };
  }

  return {
    total,
    tone: "ok",
    verdict: `${formatCurrency(total)}/mo, month to month.`,
    detail: `${seats.length} seat${seats.length === 1 ? "" : "s"}, no setup fee, and nothing over at phxgrowth.com covers this for less. Every operator here is on the unpaid side of the board — none of it needs an ad budget behind it to work.`,
  };
}

/**
 * The promise the page is held to. Stated here so the hero, the metadata and
 * the share card cannot say three different things.
 */
export const THESIS = {
  eyebrow: "The fourth way to hire the crew",
  headline: "Hire one operator. Not the whole crew.",
  // Both counts are interpolated rather than typed. The split between what can
  // be sold as a seat and what cannot has already moved twice as the parent's
  // pricing page was read properly, and a hardcoded "four" was wrong both times.
  body: `PHX/GROWTH hires its ten operators three ways — ${FLIGHT_PLANS[1].price}, ${FLIGHT_PLANS[2].price} or ${FLIGHT_PLANS[3].price} a month. ${UPGRADES.length} of the ten do work that never touches an ad account. Those ${UPGRADES.length} you can hire one at a time.`,
} as const;

/**
 * The guarantee, matched word-for-word in substance to the parent's 30-Day
 * Flight Check. Offering a *different* guarantee on a property of the same
 * brand would make a client wonder which one applies — so it is the same one.
 */
export const FLIGHT_CHECK = {
  label: "The 30-Day Flight Check",
  body: "Every seat runs under the same flight check as the rest of the house. Fly it for 30 days. If it hasn't cut waste and shipped work that moves your numbers, we'll make it right or part as friends — no lock-in, and your accounts and data leave with you.",
} as const;

/**
 * The fine print, in plain English — the parent's own section title.
 *
 * The commitment is the objection on any monthly line, and it is a sharper
 * objection here than on the parent: a seat is a small purchase, which means
 * a visitor is deciding fast and will not email to ask. Every answer below is
 * one they would otherwise have had to guess at, and two of them recommend
 * spending money somewhere other than this page.
 */
export const FAIR_QUESTIONS: { q: string; a: string }[] = [
  {
    q: "Do I have to be a PHX/GROWTH client already?",
    a: "No, and that is the whole point of this desk. The flight plans over at phxgrowth.com assume you are running ads with them. A seat assumes nothing — every operator here does useful work with zero ad budget behind it. If you already fly with PHX/GROWTH, a seat appears on your existing invoice instead of opening a second account.",
  },
  {
    q: "Why can't I hire the other six?",
    a: "Because five of them would not work and we would be taking your money for a dashboard. Vector, Prism, Ledger, Atlas and Shield all read from a live ad account — with no spend in flight they have nothing to optimise, learn from, reconcile, plan or clear. Relay is the exception: it works fine standalone, but Wingman does that job for $1,500/mo including two more automations than a seat would come with, so buying it here would be a worse deal. Every one of the six links to the tier that actually unlocks it.",
  },
  {
    q: "How does this bill?",
    a: "Monthly, month-to-month, no setup fee and no termination fee — the same terms the parent publishes. Cancel ahead of any renewal and you are out in five business days with your accounts and data. There is no annual commitment on any seat. If you already fly with PHX/GROWTH the seat is added to your existing PHX/GROWTH invoice rather than opening a second account; if you don't, it is billed on its own and nothing else is required of you.",
  },
  {
    q: "Does a seat come with a performance fee?",
    a: "No. The parent's performance fee is a percentage of ad spend it actively manages — 5% on Pilot, 3.5% on Squadron, 2% on Fleet Command. No seat on this page manages ad spend, so no seat carries a fee. What you see is the whole number.",
  },
  {
    q: "Is a seat cheaper than the flight plan?",
    a: "Sometimes, and the page will tell you when it is not. One or two seats are far cheaper than any tier that carries those operators. Once a basket climbs past about $3,500/mo the arithmetic turns over, because Pilot is $5,000 and includes a media buyer no seat is allowed to sell. The Check runs that comparison live while you choose and links out when the honest answer is over there.",
  },
  {
    q: "Do you have case studies for these seats?",
    a: "No, and we won't pretend otherwise. PHX/GROWTH's own results page labels every figure representative and says plainly the case studies aren't up yet; this desk is newer still. You'll find no percentage, multiple or testimonial anywhere on this page, because there isn't an honest one to show. What you get instead is the founding rate — the price you start at is the price you keep — and the people building it.",
  },
  {
    q: "Who actually does the work?",
    a: "The same operators, run by the same team, on the same infrastructure as the flight plans. A seat is not a lighter version of Closer or Herald; it is Closer or Herald, hired alone. You keep one point of contact and the same Slack war room.",
  },
];
