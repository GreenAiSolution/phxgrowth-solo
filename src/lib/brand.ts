/**
 * Single source of truth for brand identity.
 * Change it here and it updates the marketing site, the client console,
 * the admin console, page metadata, and transactional email defaults.
 *
 * POSITIONING
 *   This is not an agency and does not sell a growth programme — phxgrowth.com
 *   does that. This is the single-seat desk.
 *
 *   The parent's Agents page states the offer plainly: "10 operators. Three
 *   ways to hire them." Those three ways are Pilot at $5,000/mo, Squadron at
 *   $12,500/mo and Fleet Command at $30,000/mo, and six of the ten operators
 *   only appear at the top one. This property is the fourth way — one
 *   operator, one price, month to month.
 *
 *   It exists because of a specific asymmetry. PHX/GROWTH is a media buying
 *   desk and everything over there is priced as if a budget is flying. But
 *   Closer answers the phone, Herald wins unpaid search, Echo works reviews
 *   and Tower watches the board — none of that needs a dollar of ad spend
 *   behind it, and all of it currently costs $30,000/mo to reach.
 *
 * ALIGNMENT
 *   Everything below is taken from phxgrowth.com itself rather than invented.
 *   The mark is `PHX/GROWTH` — "PHX" in the cyan→magenta gradient, "/GROWTH"
 *   solid white, both heavily letter-spaced — and this property wears the same
 *   mark with a gold SOLO attached, because a separate logo would read as a
 *   separate company. Gold is the parent's apex accent (it marks their Fleet
 *   Command tier), and the joke is deliberate: gold is exactly what you are
 *   avoiding paying for by being here.
 *
 *   The name avoids "The Hangar" on purpose. That is taken — phxgrowth.com's
 *   footer links "The Hangar · our work" to their /proof page, and two pages
 *   on the same brand called the same thing is a support ticket.
 *
 *   The house voice is aviation throughout: flight plans, pilots, squadrons,
 *   shifts, the shift board, pre-flight, zero-to-live, war room, the 30-day
 *   flight check. Copy on this site should sound like it came off the same
 *   runway.
 */
export const BRAND = {
  /** Full name, used in prose and metadata. */
  name: "PHX/GROWTH SOLO",
  /** Wordmark part one — renders in the cyan→magenta gradient. */
  wordmarkLead: "PHX",
  /** Wordmark part two — renders solid white. */
  wordmarkMid: "/GROWTH",
  /** Wordmark part three — the gold chip marking this as the single-seat desk. */
  wordmarkAccent: "SOLO",
  /** Compact mark for the sidebar / mobile top bar. */
  shortName: "PHX/GROWTH SOLO",
  /** How the agency signs comments and replies to clients. */
  teamName: "PHX/GROWTH team",
  /** Primary domain — drives default email senders. */
  domain: "phxgrowth.com",
  /** Default transactional sender (override with EMAIL_FROM). */
  fromEmail: "no-reply@phxgrowth.com",
  /**
   * Where agency-bound notifications land by default — enquiries, requests,
   * critical alerts. Overridable with AGENCY_NOTIFY_EMAIL, but baked in so a
   * fresh deploy with zero env config still reaches a human.
   */
  notifyEmail: "jadengreen808@gmail.com",
  tagline: "Hire one PHX/GROWTH operator. Not the whole crew.",

  /**
   * The house this bolts onto. Every string here is quoted from phxgrowth.com
   * so the two properties cannot describe the same company differently.
   */
  parent: {
    name: "PHX/GROWTH",
    url: "https://phxgrowth.com",
    /** Their own words, from the site footer. */
    tagline: "The autonomous media buyer that flies your ad spend to profit.",
    email: "admin@phxgrowth.com",
    relationship:
      "the single-seat desk for PHX/GROWTH — the fourth way to hire the crew, one operator at a time, without a media budget behind it",
  },
} as const;
