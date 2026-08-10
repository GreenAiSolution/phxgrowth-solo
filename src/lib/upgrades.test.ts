import { describe, it, expect } from "vitest";
import { ACTION_KINDS } from "@/lib/gate";
import {
  PARENT_SERVICES,
  FLIGHT_PLANS,
  OPERATORS,
  operatorByName,
  MANIFEST,
  REVENUE_LEVERS,
  AUTOMATION_LOOPS,
  AUTOMATION_SPINE,
  LAUNCH_TIMELINE,
  FLAGSHIP,
  RESULTS_WORK,
  HOUSE_STRIP,
  HOME_CLAIMS,
  PROOF_POSTURE,
  CREATION_DISCLAIMER,
  UPGRADES,
  BUNDLES,
  bundleByKey,
  bundleMembers,
  bundleListPrice,
  bundleSaving,
  serviceByKey,
  upgradesFor,
  automationBuilds,
  upgradeByKey,
  entryPrice,
  THESIS,
  FLIGHT_CHECK,
  FAIR_QUESTIONS,
  seatsNeedingSpend,
  flightPlanByKey,
  checkSeats,
  seatTotal,
  RECEIPTS,
  RECEIPTS_INTRO,
} from "@/lib/upgrades";

describe("the services these attach to", () => {
  it("names all three PHX/GROWTH à la carte services once each", () => {
    const keys = PARENT_SERVICES.map((s) => s.key);
    expect(keys).toEqual(["premium-ai-ads", "ai-employees", "website-creation"]);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("carries the parent's own price, bullets and a stated ceiling", () => {
    // The ceiling is what the upgrades answer. Without it the page is just a
    // second menu competing with the agency's own.
    for (const s of PARENT_SERVICES) {
      expect(s.priceLabel, s.key).toMatch(/\$[\d,]+/);
      expect(s.includes.length, s.key).toBeGreaterThanOrEqual(4);
      expect(s.role.length, s.key).toBeGreaterThan(40);
      expect(s.ceiling.length, s.key).toBeGreaterThan(100);
    }
  });

  it("resolves by key", () => {
    expect(serviceByKey("ai-employees")?.name).toBe("AI Employees");
    expect(serviceByKey("nope" as never)).toBeUndefined();
  });
});

describe("the flight plans", () => {
  it("lists all four of the parent's managed tiers, cheapest first", () => {
    // Wingman used to be missing from this file, and its absence was not
    // cosmetic: it is the cheapest way into the house at $1,500/mo, and the
    // Check has to compare a single seat against it or the page recommends
    // buying here when buying there is better.
    expect(FLIGHT_PLANS.map((p) => p.name)).toEqual([
      "Wingman",
      "Pilot",
      "Squadron",
      "Fleet Command",
    ]);
    const monthly = FLIGHT_PLANS.map((p) => p.monthly);
    expect(monthly).toEqual([...monthly].sort((a, b) => a - b));
  });

  it("drops the spend fee as the tier rises, where there is one", () => {
    // Wingman is filtered rather than asserted on — its fee line is
    // "+ $450/mo per extra automation" and contains no percentage at all.
    const fees = FLIGHT_PLANS.filter((p) => /%/.test(p.fee)).map((p) =>
      Number(p.fee.match(/([\d.]+)%/)![1]),
    );
    expect(fees.length).toBe(3);
    expect(fees).toEqual([...fees].sort((a, b) => b - a));
  });

  it("states each tier's monthly price and its label consistently", () => {
    for (const p of FLIGHT_PLANS) {
      const label = Number(p.price.replace(/[^\d]/g, ""));
      expect(label * 100, `${p.name} label vs cents`).toBe(p.monthly);
    }
  });

  it("marks at most one tier per badge", () => {
    const badges = FLIGHT_PLANS.map((p) => p.badge).filter(Boolean);
    expect(new Set(badges).size).toBe(badges.length);
  });
});

describe("rule one: every upgrade is attached", () => {
  it("attaches every upgrade to a real service", () => {
    // The load-bearing rule of the whole site. An upgrade that attaches to
    // nothing is a second agency in disguise.
    const known = new Set(PARENT_SERVICES.map((s) => s.key));
    for (const u of UPGRADES) {
      expect(known.has(u.attachesTo), `${u.key} → ${u.attachesTo}`).toBe(true);
    }
  });

  it("flags every seat sold against the ad desk as needing spend", () => {
    // This test used to assert the opposite — that nothing could be sold
    // against Premium AI Ads at all — which is what kept the seat count at
    // four. The rule it enforced was solving the wrong problem: a system and
    // an operator are different units of sale, so they never collided. What
    // survives is the honest half. Anything attached to the ad desk genuinely
    // does need a live account, and must say so.
    const adSeats = upgradesFor("premium-ai-ads");
    expect(adSeats.length, "nothing attaches to the ad desk any more").toBeGreaterThan(0);
    for (const u of adSeats) {
      expect(u.needsSpend, `${u.name} sits on the ad desk but is not flagged`).toBe(true);
    }
    expect(PARENT_SERVICES.flatMap((s) => upgradesFor(s.key)).length).toBe(UPGRADES.length);
  });

  it("sells every operator on the roster, exactly once", () => {
    // All ten, one at a time. A roster that quietly loses one is the version a
    // visitor is right to be suspicious of.
    const sold = UPGRADES.map((u) => u.name);
    expect(sold.length).toBe(OPERATORS.length);
    expect(new Set(sold).size).toBe(OPERATORS.length);
    for (const o of OPERATORS) {
      expect(sold, `${o.name} is on the roster but has no seat`).toContain(o.name);
    }
  });

  it("keeps every seat under Wingman, the parent's cheapest door", () => {
    // Rule 2, in code. A single seat priced above the parent's entry tier is a
    // worse buy than the parent's own entry tier, and a desk that sells you the
    // worse buy has no claim on being believed about anything else.
    const wingman = flightPlanByKey("wingman")!;
    for (const u of UPGRADES) {
      expect(
        u.price,
        `${u.name} at ${u.price} is not under Wingman's ${wingman.monthly}`,
      ).toBeLessThan(wingman.monthly);
    }
  });

  it("makes every spend-dependent seat admit it needs a budget", () => {
    // Rule 4. These five are sold rather than hidden, which only stays honest
    // for as long as each one says what it needs before the money moves.
    const needing = UPGRADES.filter((u) => u.needsSpend);
    expect(needing.length, "nothing is flagged as needing spend any more").toBeGreaterThan(0);
    for (const u of needing) {
      const said = `${u.wont ?? ""} ${u.unpaid ?? ""} ${u.demandCase}`.toLowerCase();
      expect(
        /ad account|ad budget|spend|paid side|running ads|in flight/.test(said),
        `${u.name} needs a live ad account and never says so`,
      ).toBe(true);
    }
  });

  it("keeps Closer pinned to the price the parent publishes", () => {
    // Rule 1, and the only price on the board that is not ours to choose.
    // phxgrowth.com/pricing lists AI Phone Agents "from $995/mo".
    expect(upgradeByKey("seat-closer")!.price).toBe(99500);
  });
});

describe("rule two: every upgrade is additive", () => {
  it("never sells what the parent service already includes", () => {
    // The rule that keeps this honest. `includes` is a verbatim copy of
    // PHX/GROWTH's own bullet list, so if they ever start shipping one of
    // these as standard, this fails and the upgrade has to change or go.
    // Selling a client something they already pay for loses the sale AND the
    // relationship.
    for (const u of UPGRADES) {
      const service = serviceByKey(u.attachesTo)!;
      for (const included of service.includes) {
        const claim = [u.name, u.promise, ...u.delivers].join(" ").toLowerCase();
        // Compare on the distinctive words of the parent's bullet, ignoring
        // filler, so "Fresh creative on demand" is caught but "on" is not.
        const distinctive = included
          .toLowerCase()
          .split(/[^a-z]+/)
          .filter((w) => w.length > 4);
        const overlap = distinctive.filter((w) => claim.includes(w));
        expect(
          overlap.length,
          `${u.key} restates "${included}" from ${service.name} (${overlap.join(", ")})`,
        ).toBeLessThan(distinctive.length);
      }
    }
  });
});

describe("rule three: a seat is an operator, named and unchanged", () => {
  /**
   * This rule used to say the exact opposite, and the inversion is the whole
   * pivot in one test.
   *
   * The old catalogue sold work *around* the crew, so the check was that no
   * upgrade described the same job as one of the ten operators — an overlap
   * meant a client was being sold something they already paid for. The
   * catalogue now sells the operators themselves, one at a time, so overlap is
   * no longer the failure. Selling a *different* thing under an operator's
   * name would be: a "Closer" seat that is not Closer is the one dishonesty
   * this product line makes easy.
   */
  it("names a real operator, spelled the way the parent spells it", () => {
    const roster = new Map(OPERATORS.map((o) => [o.name, o]));
    for (const u of UPGRADES) {
      expect(roster.has(u.name), `${u.key} is not one of the parent's ten operators`).toBe(true);
    }
  });

  it("describes the job that operator actually does", () => {
    // The inverse of the old overlap check, with the same machinery. A seat
    // must share vocabulary with its own operator's published description —
    // if it shares none, it is a different product wearing the name.
    const STOP = new Set([
      "against", "across", "before", "between", "their", "there", "these", "those",
      "which", "while", "where", "every", "other", "about", "after", "still",
      "customer", "customers", "business", "clients", "client",
    ]);
    const words = (text: string) =>
      new Set(
        text
          .toLowerCase()
          .split(/[^a-z]+/)
          .filter((w) => w.length > 5 && !STOP.has(w)),
      );

    for (const u of UPGRADES) {
      const op = OPERATORS.find((o) => o.name === u.name)!;
      const claim = words([u.promise, ...u.delivers].join(" "));
      const covered = words(op.covers);
      const shared = [...covered].filter((w) => claim.has(w));
      expect(
        shared.length,
        `${u.key} shares no vocabulary with ${op.name}'s published job — is it really ${op.name}?`,
      ).toBeGreaterThanOrEqual(1);
    }
  });

  it("only raises Pilot when a seat in the basket actually needs ad spend", () => {
    // The most expensive bad advice this page could give. A basket of operators
    // that never touch an ad account is not a worse Pilot, and telling that
    // buyer to spend $5,000/mo on a managed media tier they have no budget for
    // would cost them more than anything else on the site.
    const unpaidKeys = UPGRADES.filter((u) => !u.needsSpend).map((u) => u.key);
    const verdict = checkSeats(unpaidKeys);
    expect(verdict.goTo?.key, "sent an ads-free basket to a media tier").not.toBe("pilot");

    // And the converse: once a spend-dependent seat is in there at a real
    // number, the page has to say so rather than quietly take the money.
    const withSpend = checkSeats(seatsNeedingSpend().map((u) => u.key));
    expect(withSpend.goTo?.key).toBe("pilot");
  });

  it("makes every seat state its shift, its refusal and its relation to paid demand", () => {
    for (const u of UPGRADES) {
      expect(u.shift, `${u.key} never says when it is on duty`).toBeTruthy();
      // The refusal is the honesty device of the whole board. A narrow product
      // sold without its edges gets filled in optimistically by the buyer.
      expect(u.wont, `${u.key} never says what it won't do`).toBeTruthy();
      expect(u.wont!.length, u.key).toBeGreaterThan(40);
      expect(u.unpaid, `${u.key} never places itself against paid demand`).toBeTruthy();
    }
  });
});

describe("rule four: nothing the Manifest already promises", () => {
  it("carries the house credential strip", () => {
    expect(HOUSE_STRIP.length).toBeGreaterThanOrEqual(4);
    expect(HOME_CLAIMS.length).toBeGreaterThanOrEqual(4);
  });

  it("carries the automation spine and the flagship engagement", () => {
    expect(AUTOMATION_LOOPS.length).toBeGreaterThanOrEqual(4);
    for (const l of AUTOMATION_LOOPS) {
      expect(l.detail.length, l.name).toBeGreaterThan(60);
      expect(l.cadence.length, l.name).toBeGreaterThan(3);
      // The node chain, not just the summary. A loop held here without its
      // published steps is a check reading a description of the work instead
      // of the work.
      expect(l.nodes.length, `${l.name} has no published node chain`).toBeGreaterThanOrEqual(6);
      for (const n of l.nodes) expect(n.length, `${l.name}: "${n}"`).toBeGreaterThan(2);
    }
    expect(FLAGSHIP.includes.length).toBeGreaterThanOrEqual(6);
  });

  it("holds the spine's own framing, because it is a standard we inherit", () => {
    // "Inspectable node by node… never a black box" is published. Anything
    // sold here runs to that standard or it is a worse product than the thing
    // it bolts onto, sold by the same company.
    expect(AUTOMATION_SPINE.body).toContain("node by node");
    expect(AUTOMATION_SPINE.body).toContain("never a black box");
  });

  it("holds the flagship's scoping terms", () => {
    // This sentence is what makes a productised automation build honest: the
    // flagship is bespoke, by application, and rationed. If it ever stops
    // being any of those, the builds sold here need re-arguing.
    expect(FLAGSHIP.scoping).toContain("limited number of builds each quarter");
    expect(FLAGSHIP.scoping).toContain("engineered, not configured");
  });

  it("holds the parent's launch clock end to end", () => {
    expect(LAUNCH_TIMELINE.length).toBeGreaterThanOrEqual(5);
    expect(LAUNCH_TIMELINE[0]!.at).toBe("T-0");
    // The claim is "under 60 minutes" — the last mark has to still be inside it.
    const last = Number(LAUNCH_TIMELINE[LAUNCH_TIMELINE.length - 1]!.at.match(/\d+/)![0]);
    expect(last).toBeLessThan(60);
  });

  it("keeps upgrade names clear of the flagship's own vocabulary", () => {
    // The flagship promises "white-glove install and training". An upgrade
    // called The Training Lab sat directly across that phrase and would have
    // had a client asking which training they were buying — so it is now the
    // Tuning Lab. Same work, no ambiguity.
    const flagshipWords = FLAGSHIP.includes.join(" ").toLowerCase();
    for (const u of UPGRADES) {
      const head = u.name.toLowerCase().replace(/^the /, "").split(" ")[0];
      expect(flagshipWords, `${u.key} name collides with the flagship`).not.toContain(head);
    }
  });

  it("carries both revenue levers with their bullets", () => {
    expect(REVENUE_LEVERS.map((l) => l.code)).toEqual(["AOV", "LTV"]);
    for (const l of REVENUE_LEVERS) {
      expect(l.bullets.length, l.code).toBeGreaterThanOrEqual(4);
    }
  });

  it("lists all twelve numbered items", () => {
    expect(MANIFEST).toHaveLength(12);
    expect(MANIFEST.map((m) => m.n)).toEqual([
      "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12",
    ]);
    for (const m of MANIFEST) {
      expect(m.detail.length, m.title).toBeGreaterThan(30);
    }
  });

  it("quotes the boundary the whole site depends on", () => {
    // The Ad Management hero. If PHX/GROWTH ever starts making ads, the
    // Motion Unit is not additive any more and this catalogue loses its
    // largest item — so the sentence is pinned here where it will be noticed.
    expect(CREATION_DISCLAIMER).toContain("don't make your ads");
  });

  it("sells nothing the Manifest already promises", () => {
    // Third pass of the same check, against the strictest list yet. This one
    // cut an offer lab (07), a tracking rebuild (02) and a conversion lab
    // (06). The pattern is consistent: everything looks additive until the
    // parent's own words are sitting in the same file.
    //
    // The five spend-dependent seats are exempt, and the exemption is the
    // whole point of them rather than a hole in the rule. The Manifest is what
    // the *system* covers, twelve items deep. Vector genuinely is Manifest 03
    // sold on its own, without the other eleven — that is the product. What
    // the seats must not do is claim the system, which the next test checks.
    const STOP = new Set([
      "against", "across", "before", "between", "their", "there", "these", "those",
      "which", "while", "where", "every", "other", "about", "after", "still",
      "actually", "really", "whoever", "little",
    ]);
    const words = (text: string) =>
      new Set(
        text
          .toLowerCase()
          .split(/[^a-z]+/)
          .filter((w) => w.length > 5 && !STOP.has(w)),
      );

    // Both the Manifest and the revenue levers. A Manifest-only check let an
    // offer-lab upgrade through, because item 07 is terse ("AOV is a managed
    // number") while the detail that actually kills it — "offer architecture
    // managed like media: bundles, thresholds, post-purchase upsells" — is in
    // the AOV lever. Checking half the parent's scope is worse than checking
    // none, because it reads as a check that passed.
    const scope = [
      ...MANIFEST.map((m) => ({ label: `Manifest ${m.n} "${m.title}"`, text: `${m.title} ${m.detail}` })),
      ...REVENUE_LEVERS.flatMap((l) =>
        l.bullets.map((b) => ({ label: `${l.code} lever`, text: b })),
      ),
      ...AUTOMATION_LOOPS.map((l) => ({ label: `loop "${l.name}"`, text: `${l.name} ${l.detail}` })),
      // The published node chains, each as ONE item rather than one per node.
      //
      // A loop's one-line summary is a description; its node list is the actual
      // work, step by named step, and they are not the same scope. "Autonomous
      // Budget Allocation" says nothing in its summary about pulling Shopify
      // profit or gating on approval — its chain names both.
      //
      // Per-node items were the first attempt and were silently vacuous: a node
      // is two or three words, so after the length filter most carry zero or
      // one checkable word, and an item holding one word can never exceed a
      // two-word threshold. It would have read as eight more checks passing
      // while testing nothing. Joined, each chain carries five to ten
      // distinctive words and a three-word overlap fails, which is a real bar.
      ...AUTOMATION_LOOPS.map((l) => ({
        label: `loop "${l.name}" node chain`,
        text: l.nodes.join(" "),
      })),
      ...LAUNCH_TIMELINE.map((t) => ({
        label: `launch clock ${t.at} "${t.title}"`,
        text: `${t.title} ${t.detail}`,
      })),
      ...FLAGSHIP.includes.map((b) => ({ label: `${FLAGSHIP.name} engagement`, text: b })),
      ...RESULTS_WORK.map((w) => ({ label: "Results-page work", text: w })),
      ...HOME_CLAIMS.map((c) => ({ label: "Homepage claim", text: c })),
    ];

    for (const u of UPGRADES.filter((x) => !x.needsSpend)) {
      const claim = words([u.name, u.promise, ...u.delivers].join(" "));
      for (const item of scope) {
        const covered = words(item.text);
        const shared = [...covered].filter((w) => claim.has(w));
        expect(
          shared.length,
          `${u.key} overlaps ${item.label} on: ${shared.join(", ")}`,
        ).toBeLessThanOrEqual(2);
      }
    }
  });

  it("stops a spend-dependent seat claiming the whole system", () => {
    // The replacement bar for the five seats exempted above. Each of them is
    // deliberately a slice of the Manifest sold on its own, so overlapping one
    // item is the product working. Overlapping half the list would be a seat
    // impersonating Ad Management at a fifth of the price, which is the exact
    // thing that would make this desk dishonest rather than cheap.
    const words2 = (text: string) =>
      new Set(
        text
          .toLowerCase()
          .split(/[^a-z]+/)
          .filter((w) => w.length > 5),
      );
    for (const u of UPGRADES.filter((x) => x.needsSpend)) {
      const claim = words2([u.name, u.promise, ...u.delivers].join(" "));
      const touched = MANIFEST.filter((m) => {
        const covered = words2(`${m.title} ${m.detail}`);
        return [...covered].filter((w) => claim.has(w)).length >= 3;
      });
      expect(
        touched.length,
        `${u.key} reaches into ${touched.length} Manifest items (${touched
          .map((m) => m.n)
          .join(", ")}) — that is the desk, not a seat`,
      ).toBeLessThanOrEqual(2);
    }
  });
});

describe("the automation builds", () => {
  /**
   * A build is an upgrade that keeps running after everyone has gone home,
   * which makes it a different kind of promise from one where a crew turns up
   * and films something. The parent has already published the standard such a
   * thing is held to — "inspectable node by node… never a black box" — and it
   * would be a strange thing to sell a loop, next to that page, that nobody
   * can look inside.
   */
  const builds = () => UPGRADES.filter((u) => u.build);

  it("marks the ones that act in the outside world", () => {
    expect(builds().length).toBeGreaterThanOrEqual(3);
    expect(automationBuilds().map((u) => u.key)).toEqual(builds().map((u) => u.key));
  });

  it("states what you can see and stop, on every one", () => {
    // The load-bearing rule for this whole product line. A build that cannot
    // be looked inside is worse than the loops it sits beside, sold by the
    // same company, and a client would be right to notice.
    //
    // This reads a dedicated field rather than sniffing the delivers prose for
    // words like "visible" or "read-out". The prose version passed on The
    // Comeback purely because it promised a monthly report — which is not the
    // same claim as being able to open a running loop and halt it. A check
    // that a reassuring word appears somewhere is not a check.
    for (const u of builds()) {
      expect(u.oversight, `${u.key} ships a loop and never says what you can see`).toBeDefined();
      expect(u.oversight!.length, u.key).toBeGreaterThan(120);
    }
  });

  it("gives no oversight promise to anything that is not a build", () => {
    // The field means "this loop runs unattended and here is your handle on
    // it". On an upgrade where a human turns up and does the work, it would be
    // reassurance about a risk that does not exist.
    for (const u of UPGRADES.filter((x) => !x.build)) {
      expect(u.oversight, `${u.key} is not a build but claims oversight`).toBeUndefined();
    }
  });

  it("gates the ad-desk seat that spends, and no other ad-desk seat", () => {
    // This used to forbid any gated seat on the ad desk at all, which followed
    // from nothing being sold there. Now Vector is, and it is the one seat on
    // the board that spends a client's money — so the rule inverts: it must be
    // gated, and the four ad-desk seats that only report must not be.
    const adDesk = UPGRADES.filter((u) => u.attachesTo === "premium-ai-ads");
    for (const u of adDesk) {
      const shouldGate = u.key === "seat-vector";
      expect(Boolean(u.build), `${u.key} gate flag`).toBe(shouldGate);
    }
  });

  it("gates exactly the seats that can act, and only those", () => {
    // Tower is the control here: its published refusal is that it does not
    // overrule an operator or change your settings. An operator that cannot
    // act needs no gate, and giving it one would imply it can.
    // This used to read "everything except Tower", which was true while the
    // board was four seats and all three of the others acted. On a board of
    // ten it is wrong in both directions, so the two sets are named.
    //
    // Acting means reaching into the outside world on your behalf: spending,
    // publishing, messaging, moving money. Producing a number, a plan, a brief
    // or a verdict is not acting, and giving those a gate would imply they can
    // do something they cannot.
    const ACTS = ["Closer", "Herald", "Echo", "Vector", "Relay"];
    const OBSERVES = ["Tower", "Prism", "Ledger", "Atlas", "Shield"];
    expect([...ACTS, ...OBSERVES].sort()).toEqual(UPGRADES.map((u) => u.name).sort());

    const gated = new Set(builds().map((u) => u.name));
    for (const name of ACTS) {
      expect(gated.has(name), `${name} acts on your behalf and must run behind the gate`).toBe(
        true,
      );
    }
    for (const name of OBSERVES) {
      expect(gated.has(name), `${name} only reports — a gate would imply it can act`).toBe(false);
    }
  });

  it("puts the one operator that spends money behind a manual ceiling", () => {
    // Vector is the sharpest thing this desk sells. Reallocating inside an
    // agreed total can run on a timer; raising the total cannot, ever.
    const vector = upgradeByKey("seat-vector")!;
    expect(vector.build, "Vector spends your money and must be gated").toBe(true);
    const raise = ACTION_KINDS.find((k) => k.key === "budget.raise");
    expect(raise, "there is no gated action for raising the spend ceiling").toBeDefined();
    expect(raise!.movesMoney).toBe(true);
    expect(raise!.minimumHold, "raising the ceiling must never run on a timer").toBe("MANUAL");
  });

  it("keeps them out of the flagship's lane", () => {
    // The flagship engineers exactly this, so the only honest space for a
    // productised version is the one its own scoping sentence leaves open:
    // bespoke, by application, and rationed per quarter.
    expect(FLAGSHIP.access).toBe("By application");
    expect(FLAGSHIP.scoping).toMatch(/limited number/);
    for (const u of builds()) {
      expect(u.billing, `${u.key} must be a standing price, not a quote`).toBe("monthly");
    }
  });

  it("sells at least one crew made entirely of acting seats", () => {
    // Was "one crew carries every acting seat", which stopped being possible
    // when Vector and Relay joined the board — a crew of Closer, Herald, Echo,
    // Vector and Relay is not a thing anybody wants, it is just the gated ones
    // in a bag. What still matters is that the gate is a normal part of a crew
    // rather than an exception bolted onto single seats.
    const gated = new Set(builds().map((u) => u.key));
    const crew = BUNDLES.find((b) => b.members.every((m) => gated.has(m)));
    expect(crew, "no crew is made purely of gated seats").toBeDefined();
  });
});

describe("the upgrades", () => {
  it("has no duplicate keys or names", () => {
    const keys = UPGRADES.map((u) => u.key);
    const names = UPGRADES.map((u) => u.name);
    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(names).size).toBe(names.length);
  });

  it("marks exactly one leading seat per service that has any", () => {
    // Premium AI Ads deliberately has none — rule one forbids it — so the
    // loop skips empty services rather than demanding a seat exist to lead.
    for (const s of PARENT_SERVICES) {
      const seats = upgradesFor(s.key);
      if (seats.length === 0) continue;
      const leading = seats.filter((u) => u.leading);
      expect(leading.length, `${s.key}: ${leading.map((u) => u.key).join(", ")}`).toBe(1);
    }
  });

  it("marks exactly one apex upgrade on the whole page", () => {
    // Gold is the parent's apex accent and they spend it once, on Fleet
    // Command. Spending it twice here would flatten the same signal.
    expect(UPGRADES.filter((u) => u.apex).length).toBe(1);
  });

  it("lists each service most expensive first", () => {
    for (const s of PARENT_SERVICES) {
      const prices = upgradesFor(s.key).map((u) => u.price);
      expect(prices, s.key).toEqual([...prices].sort((a, b) => b - a));
    }
  });

  it("prices every upgrade below the service it attaches to", () => {
    // An upgrade that costs more than the thing it upgrades is not an upgrade.
    for (const u of UPGRADES) {
      const service = serviceByKey(u.attachesTo)!;
      const parent = Number(service.priceLabel.replace(/[^\d]/g, "")) * 100;
      expect(u.price, `${u.key} vs ${service.name}`).toBeLessThan(parent);
    }
  });

  it("argues the demand rather than asserting it", () => {
    for (const u of UPGRADES) {
      expect(u.demandCase.length, u.key).toBeGreaterThan(200);
      expect(u.promise.length, u.key).toBeGreaterThan(30);
      expect(u.fixes.length, u.key).toBeGreaterThan(10);
    }
  });

  it("says concretely what is delivered", () => {
    for (const u of UPGRADES) {
      expect(u.delivers.length, u.key).toBeGreaterThanOrEqual(3);
      for (const line of u.delivers) {
        expect(line.length, `${u.key}: "${line}"`).toBeGreaterThan(20);
      }
    }
  });

  it("claims no outcomes at all, anywhere", () => {
    // The parent labels every figure on its results page "representative" and
    // says the case studies aren't up yet. An upgrade counter quoting hard
    // numbers next to that would be the less honest of the two properties —
    // so this checks the whole page's copy, not just the catalogue.
    const everything = [
      ...UPGRADES.flatMap((u) => [u.name, u.promise, u.demandCase, u.fixes, ...u.delivers]),
      PROOF_POSTURE.headline,
      PROOF_POSTURE.body,
      PROOF_POSTURE.founding,
      THESIS.headline,
      THESIS.body,
      ...FAIR_QUESTIONS.flatMap((f) => [f.q, f.a]),
    ].join(" ");

    // A percentage is only allowed if it is one of PHX/GROWTH's real
    // performance-fee rates being quoted as a price. Stating what something
    // costs is not a results claim, and a check that couldn't tell the
    // difference would force the fee answer to go vague — which would be a
    // worse page, not a more honest one.
    const feeRates = new Set(
      FLIGHT_PLANS.filter((p) => /%/.test(p.fee)).map((p) => p.fee.match(/[\d.]+%/)![0]),
    );
    for (const pct of everything.match(/\d+(\.\d+)?\s?%/g) ?? []) {
      expect(feeRates.has(pct.replace(/\s/g, "")), `"${pct}" is not one of the real fee rates`).toBe(
        true,
      );
    }

    expect(everything).not.toMatch(/\d+(\.\d+)?\s?[x×]\s/i);
    expect(everything).not.toMatch(/\b(guarantee[ds]?|guaranteed) (results?|roas|revenue|growth)\b/i);
  });

  it("says out loud that there are no results to show yet", () => {
    expect(PROOF_POSTURE.body.length).toBeGreaterThan(150);
    expect(PROOF_POSTURE.founding.length).toBeGreaterThan(80);
    // The founding rate is the thing offered in place of proof; without it the
    // section is an apology rather than a position.
    expect(PROOF_POSTURE.founding.toLowerCase()).toContain("founding");
    const caseStudies = FAIR_QUESTIONS.find((f) => f.q.toLowerCase().includes("case studies"));
    expect(caseStudies, "the objection has to be answered where it is asked").toBeDefined();
  });

  it("quotes no invented statistics", () => {
    // The pitch of this page is that it tells the truth about what it sells.
    // A fabricated "+312%" anywhere destroys that, and it is the easiest thing
    // in the world to add later without thinking.
    const copy = UPGRADES.flatMap((u) => [u.promise, u.demandCase, u.fixes, ...u.delivers]).join(" ");
    expect(copy).not.toMatch(/\d+(\.\d+)?\s?%/);
    expect(copy).not.toMatch(/\d+(\.\d+)?\s?[x×]\s+(more|better|faster|higher|return)/i);
  });

  it("resolves by key and reports a real entry price", () => {
    expect(upgradeByKey("seat-closer")?.name).toBe("Closer");
    expect(upgradeByKey("not-a-thing")).toBeUndefined();
    const low = entryPrice();
    expect(UPGRADES.some((u) => u.billing === "monthly" && u.price === low)).toBe(true);
  });
});

describe("the page's promise", () => {
  it("makes an argument and names the parent agency", () => {
    // The floor used to be 150 characters, which was guarding against a stub.
    // The page has since been deliberately cut back — the coverage map now
    // makes visually what three paragraphs used to make in prose — so the
    // guard is length-light and meaning-heavy instead.
    expect(THESIS.headline.length).toBeGreaterThan(15);
    expect(THESIS.body.length).toBeGreaterThan(60);
    expect(THESIS.body).toContain("PHX/GROWTH");
  });

  it("counts the upgrades rather than spelling the number", () => {
    // Seven upgrades have been cut as the parent's pages arrived. A hardcoded
    // count in the thesis would have been wrong three separate times.
    expect(THESIS.body).toContain(String(UPGRADES.length));
  });

  it("offers the parent's guarantee rather than a different one", () => {
    // A second, different guarantee on the upgrade counter would leave a
    // client unsure which one applies to what.
    expect(FLIGHT_CHECK.label).toContain("30-Day Flight Check");
    expect(FLIGHT_CHECK.body).toContain("30 days");
    expect(FLIGHT_CHECK.body).toContain("no lock-in");
  });

  it("answers the objections in plain English", () => {
    expect(FAIR_QUESTIONS.length).toBeGreaterThanOrEqual(4);
    for (const f of FAIR_QUESTIONS) {
      expect(f.q.endsWith("?"), f.q).toBe(true);
      expect(f.a.length, f.q).toBeGreaterThan(100);
    }
  });

  it("states the parent's real performance fees, in the parent's order", () => {
    const fee = FAIR_QUESTIONS.find((f) => f.q.includes("performance fee"));
    expect(fee).toBeDefined();
    for (const plan of FLIGHT_PLANS.filter((p) => /%/.test(p.fee))) {
      expect(fee!.a, plan.name).toContain(plan.fee.match(/[\d.]+%/)![0]);
      expect(fee!.a).toContain(plan.name);
    }
  });
});

describe("the deluxe bundles", () => {
  it("has unique keys and names", () => {
    const keys = BUNDLES.map((b) => b.key);
    const names = BUNDLES.map((b) => b.name);
    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(names).size).toBe(names.length);
  });

  it("bundles at least two real upgrades", () => {
    // A "bundle" of one is a rename with a discount attached.
    for (const b of BUNDLES) {
      expect(b.members.length, b.key).toBeGreaterThanOrEqual(2);
      expect(new Set(b.members).size, `${b.key} repeats a member`).toBe(b.members.length);
      expect(bundleMembers(b).length, `${b.key} has a dead member`).toBe(b.members.length);
    }
  });

  it("always costs less than buying the parts", () => {
    // The whole incentive. If this ever inverts, the page is charging more for
    // the convenience of one invoice, which is the opposite of an offer.
    for (const b of BUNDLES) {
      expect(bundleSaving(b), b.key).toBeGreaterThan(0);
      expect(b.price, b.key).toBeLessThan(bundleListPrice(b));
    }
  });

  it("always costs more than its dearest single member", () => {
    // A bundle cheaper than one of its own parts is a pricing bug that would
    // let somebody buy the stack to get the one item at a discount.
    for (const b of BUNDLES) {
      const dearest = Math.max(...bundleMembers(b).map((u) => u.price));
      expect(b.price, `${b.key} undercuts its own dearest member`).toBeGreaterThan(dearest);
    }
  });

  it("marks exactly one apex bundle, and it is the largest ticket on the site", () => {
    const apex = BUNDLES.filter((b) => b.apex);
    expect(apex).toHaveLength(1);
    const dearestUpgrade = Math.max(...UPGRADES.map((u) => u.price));
    const dearestBundle = Math.max(...BUNDLES.map((b) => b.price));
    expect(apex[0].price).toBe(dearestBundle);
    expect(apex[0].price).toBeGreaterThan(dearestUpgrade);
  });

  it("argues why the members compound, rather than just listing them", () => {
    for (const b of BUNDLES) {
      expect(b.promise.length, b.key).toBeGreaterThan(30);
      expect(b.rationale.length, b.key).toBeGreaterThan(200);
    }
  });

  it("claims no outcomes", () => {
    const copy = BUNDLES.flatMap((b) => [b.name, b.promise, b.rationale]).join(" ");
    expect(copy).not.toMatch(/\d+(\.\d+)?\s?%/);
    expect(copy).not.toMatch(/\d+(\.\d+)?\s?[x×]\s/i);
  });

  it("resolves by key", () => {
    expect(bundleByKey("full-board")?.apex).toBe(true);
    expect(bundleByKey("nope")).toBeUndefined();
  });

  it("never mixes spend-dependent seats into a crew that does not need spend", () => {
    // This replaced a rule that every seat must appear in some crew. That was
    // right on a board of four and wrong on a board of ten: the desk now sells
    // any combination you like, and manufacturing a crew for each leftover
    // seat would be packaging for the test's benefit rather than the buyer's.
    //
    // What matters instead is that a crew never smuggles in an operator that
    // silently needs an ad budget. A buyer picking "the one that answers the
    // phone and asks for reviews" must not end up paying for something with
    // nothing to work on.
    for (const b of BUNDLES) {
      const members = bundleMembers(b);
      const needing = members.filter((m) => m.needsSpend);
      expect(
        needing.length === 0 || needing.length === members.length,
        `${b.key} mixes ${needing.map((m) => m.name).join(", ")} in with seats that need no spend`,
      ).toBe(true);
    }
  });

  it("keeps the ads-free side of the board fully crewed", () => {
    // The seats anybody can use regardless of budget are the ones that earn a
    // named crew, and all of them should be reachable inside one.
    const bundled = new Set(BUNDLES.flatMap((b) => b.members));
    const alwaysUseful = UPGRADES.filter((u) => !u.needsSpend && u.key !== "seat-relay");
    for (const u of alwaysUseful) {
      expect(bundled.has(u.key), `${u.key} needs no ad budget but is in no crew`).toBe(true);
    }
  });
});

describe("the Check", () => {
  /**
   * The one piece of logic on this site that can lose a sale.
   *
   * It is tested harder than anything else in this file because its failure
   * mode is silent and expensive in both directions: too eager and it sends
   * paying visitors to phxgrowth.com for no reason; too quiet and somebody
   * spends $3,585/mo on four seats when $5,000 would have bought all four plus
   * a media buyer. Both numbers are correct, which is exactly why a person
   * cannot be relied on to catch it.
   */
  const ALL = UPGRADES.map((u) => u.key);
  const cheapest = [...UPGRADES].sort((a, b) => a.price - b.price)[0]!;

  it("prices an empty basket at nothing and asks for a pick", () => {
    const r = checkSeats([]);
    expect(r.total).toBe(0);
    expect(r.tone).toBe("ok");
    expect(r.goTo).toBeUndefined();
  });

  it("ignores keys that are not seats rather than throwing", () => {
    // The keys arrive from a URL and from click handlers. A stale bookmark
    // must not be able to crash the only interactive thing on the page.
    expect(checkSeats(["not-a-seat"]).total).toBe(0);
    expect(checkSeats(["not-a-seat", cheapest.key]).total).toBe(cheapest.price);
  });

  it("sums exactly the catalogue prices", () => {
    expect(seatTotal(ALL)).toBe(UPGRADES.reduce((s, u) => s + u.price, 0));
  });

  it("refuses to endorse Tower without a crew to command", () => {
    // Tower's own copy says its job is watching the other operators. Sold
    // alone it is a monitoring product for an empty room, and the page must
    // not print a confident total under one.
    const tower = UPGRADES.find((u) => u.name === "Tower")!;
    expect(tower.requiresCrew).toBeGreaterThan(0);

    const alone = checkSeats([tower.key]);
    expect(alone.tone).toBe("warn");
    expect(alone.verdict).toContain("Tower");

    const withOne = checkSeats([tower.key, cheapest.key]);
    expect(withOne.tone, "one companion is still short of the requirement").toBe("warn");
  });

  it("clears Tower once it has enough to watch", () => {
    const tower = UPGRADES.find((u) => u.name === "Tower")!;
    const others = UPGRADES.filter((u) => u.name !== "Tower")
      .slice(0, tower.requiresCrew!)
      .map((u) => u.key);
    expect(checkSeats([tower.key, ...others]).verdict).not.toContain("needs");
  });

  it("prices every single seat below the cheapest way into the parent's house", () => {
    // A pricing invariant rather than a behaviour, and the more important of
    // the two. Wingman is $1,500/mo and includes three built automations plus
    // an employee in Slack. A seat dearer than that is a worse deal than the
    // thing it sits next to, sold by the same brand — and the person who
    // notices will be the client, in month two.
    const wingman = flightPlanByKey("wingman")!;
    for (const u of UPGRADES) {
      expect(u.price, `${u.key} costs more than Wingman (${wingman.price})`).toBeLessThan(
        wingman.monthly,
      );
    }
  });

  it("keeps the Wingman redirect armed for the day that stops being true", () => {
    // The redirect branch is unreachable at today's prices, which is the
    // correct state for a guard and the wrong state for untested code. If a
    // future price rise makes a seat dearer than Wingman, the page must send
    // the visitor there rather than recommend itself.
    const wingman = flightPlanByKey("wingman")!;
    const dear = UPGRADES.filter((u) => u.price >= wingman.monthly && !u.requiresCrew);
    for (const u of dear) {
      expect(checkSeats([u.key]).goTo?.key, u.key).toBe("wingman");
    }
    // Stated so this passing vacuously today reads as the intended outcome
    // rather than a hole somebody forgot to fill.
    expect(dear.length).toBe(0);
  });

  it("does not send a lone affordable seat anywhere, except the one it should", () => {
    const wingman = flightPlanByKey("wingman")!;
    // Relay is the deliberate exception and it costs this desk $850/mo every
    // time it fires. Wingman is $1,500 for three automations built for you
    // plus an employee in Slack; Relay alone maintains wiring you already
    // have. For most people asking for Relay, Wingman is the better buy and
    // the page says so instead of taking the money.
    const lone = UPGRADES.filter(
      (x) => x.price < wingman.monthly && !x.requiresCrew && x.key !== "seat-relay",
    );
    for (const u of lone) {
      expect(checkSeats([u.key]).goTo, u.key).toBeUndefined();
    }
    const relay = checkSeats(["seat-relay"]);
    expect(relay.goTo?.key, "Relay alone should recommend Wingman").toBe("wingman");
    expect(relay.tone).toBe("warn");
  });

  it("compares the whole board against Fleet Command, not Pilot", () => {
    // The board is now all ten operators and $9,985/mo, which is past Pilot's
    // price — but Pilot is one channel plus the desk, and recommending it to
    // somebody buying ten operators would be the worst advice on the page.
    // Fleet Command is the only tier that carries all ten, so that is the
    // comparison, and it is offered as information rather than a warning:
    // this desk is genuinely the cheaper way to get the operators.
    const r = checkSeats(ALL);
    expect(r.goTo?.key).toBe("fleet");
    expect(r.tone).toBe("ok");
    expect(r.total).toBeLessThan(flightPlanByKey("fleet")!.monthly);
  });

  it("never routes an ads-free basket to a media tier", () => {
    // The most expensive mistake this function could make. Somebody buying
    // only operators that work with no ad budget must never be told to go and
    // spend $5,000/mo on managed media.
    const adsFree = UPGRADES.filter((u) => !u.needsSpend).map((u) => u.key);
    const r = checkSeats(adsFree);
    expect(r.goTo?.key).not.toBe("pilot");
    expect(r.total).toBeGreaterThan(flightPlanByKey("pilot")!.monthly * 0.7);
  });

  it("redirects outright at or above Pilot's price", () => {
    const pilot = flightPlanByKey("pilot")!;
    // Constructed rather than taken from the catalogue: no real basket
    // reaches Pilot today, and the branch still has to be right when one does.
    // A basket of spend-dependent seats past Pilot's price is exactly the
    // case where the desk's version is the better buy, because Pilot wraps the
    // same operators in the audit, the tracking and a human on the hook.
    const r = checkSeats(seatsNeedingSpend().map((u) => u.key));
    expect(r.total).toBeGreaterThanOrEqual(pilot.monthly);
    expect(r.tone).toBe("elsewhere");
    expect(r.goTo?.key).toBe("pilot");
  });

  it("offers a crew when the basket is exactly one", () => {
    for (const b of BUNDLES) {
      const r = checkSeats(b.members);
      expect(r.crew?.key, `${b.key} is not offered for its own members`).toBe(b.key);
    }
  });

  it("never offers a crew that contains a seat they did not pick", () => {
    // An inexact match would be an upsell wearing a discount's clothes.
    const one = checkSeats([cheapest.key]);
    if (one.crew) {
      expect(one.crew.members).toEqual([cheapest.key]);
    }
  });

  it("always produces a verdict and a reason", () => {
    const baskets = [[], [cheapest.key], ALL, ...BUNDLES.map((b) => b.members)];
    for (const b of baskets) {
      const r = checkSeats(b);
      expect(r.verdict.length, JSON.stringify(b)).toBeGreaterThan(5);
      expect(r.detail.length, JSON.stringify(b)).toBeGreaterThan(60);
    }
  });

  it("routes to a real tier whenever it routes at all", () => {
    const baskets = [[], ALL, ...UPGRADES.map((u) => [u.key]), ...BUNDLES.map((b) => b.members)];
    for (const b of baskets) {
      const r = checkSeats(b);
      if (r.goTo) expect(FLIGHT_PLANS).toContain(r.goTo);
    }
  });
});

describe("the Check's refusals are actually refusals", () => {
  it("blocks the basket it says it would rather not sell", () => {
    // The page hides the reserve button on `blocked`. Without this flag the
    // verdict read "we would rather not sell you one" directly above a live
    // Reserve control, which is worse than not warning at all.
    const tower = UPGRADES.find((u) => u.name === "Tower")!;
    expect(checkSeats([tower.key]).blocked).toBe(true);
  });

  it("never blocks a basket it is merely advising on", () => {
    // A "buy the flight plan instead" verdict is advice, not a refusal — the
    // visitor is still allowed to buy the seats if they want them.
    const advisory = [UPGRADES.map((u) => u.key), ...BUNDLES.map((b) => b.members)];
    for (const b of advisory) {
      expect(checkSeats(b).blocked, JSON.stringify(b)).toBeFalsy();
    }
  });
});

describe("the receipts are checkable by a stranger", () => {
  const anchors = new Set(["#seats", "#check", "#locked", "#enquiry"]);

  it("gives every receipt somewhere to go", () => {
    // A receipt without a destination is an assertion wearing a receipt's
    // clothes. The whole section is worth less than nothing if one of these
    // is a dead end, because the visitor came here specifically to verify.
    expect(RECEIPTS.length).toBeGreaterThanOrEqual(3);
    for (const r of RECEIPTS) {
      expect(r.label.length, r.label).toBeGreaterThan(3);
      expect(r.claim.length, r.label).toBeGreaterThan(60);
      expect(r.check.length, r.label).toBeGreaterThan(25);
      if (r.external) {
        expect(r.href, r.label).toMatch(/^https:\/\//);
      } else {
        expect(anchors.has(r.href), `"${r.href}" is not a section on this page`).toBe(true);
      }
    }
  });

  it("sends the visitor somewhere we do not control", () => {
    // At least one has to leave the property. A page that verifies itself
    // using only itself is a closed loop, and a closed loop is what every
    // fabricated proof section already is.
    expect(RECEIPTS.some((r) => r.external)).toBe(true);
    expect(RECEIPTS.some((r) => r.href.includes("phxgrowth.com"))).toBe(true);
  });

  it("writes every check as an instruction the reader carries out", () => {
    // "Our pricing is transparent" is a claim. "Open their Agents page and
    // hold it against the numbers above" is a task. Only the second one can
    // be failed, which is the only reason either is worth printing.
    for (const r of RECEIPTS) {
      const first = r.check.split(" ")[0].toLowerCase();
      expect(
        ["tick", "read", "open", "click", "run", "check", "compare", "watch", "count"],
        `"${r.check}" does not start with something the reader does`,
      ).toContain(first);
      expect(r.check.toLowerCase(), r.label).not.toMatch(/^(we|our|the team)\b/);
    }
  });

  it("claims nothing about who or how big we are", () => {
    // The failure mode this section exists to prevent. A visitor cannot check
    // our headcount, our office, our client list or how long we have been
    // going, so none of it belongs on a page whose premise is that everything
    // on it can be checked. This is also the rule that keeps a photograph of
    // a team and a building off the page — an image asserts all four at once
    // and supports none of them.
    const copy = [
      RECEIPTS_INTRO.headline,
      RECEIPTS_INTRO.body,
      ...RECEIPTS.flatMap((r) => [r.label, r.claim, r.check]),
    ]
      .join(" ")
      .toLowerCase();
    for (const word of [
      "our team",
      "our office",
      "our staff",
      "headquarters",
      "trusted by",
      "clients served",
      "years of experience",
      "award",
      "industry-leading",
    ]) {
      expect(copy, `"${word}" is not something a visitor can verify`).not.toContain(word);
    }
  });

  it("quotes no statistics of its own", () => {
    // Same rule as the rest of the page, applied to the section that would be
    // the most tempting place to break it.
    const copy = RECEIPTS.flatMap((r) => [r.claim, r.check]).join(" ");
    expect(copy).not.toMatch(/\d+(\.\d+)?\s?%/);
    expect(copy).not.toMatch(/\d+(\.\d+)?\s?[x×]\s/i);
    // Counts of things that change go stale silently. "Six of ten" is fixed
    // by the catalogue and checked below; a test-suite size is not.
    expect(copy).not.toMatch(/\b\d{2,}\s+(tests|commits|customers|businesses)\b/i);
  });

  it("keeps the needs-a-budget claim tied to the catalogue", () => {
    // The one hardcoded ratio in the section. If a seat's `needsSpend` flag
    // changes, the receipt's sentence becomes false — so it fails here rather
    // than on the page, where only a customer would find it.
    const receipt = RECEIPTS.find((r) => /ad account|ad budget|running ads/i.test(r.claim));
    expect(receipt, "the needs-a-budget receipt has gone missing").toBeDefined();
    expect(UPGRADES.length).toBe(10);

    // Spelled out and read off the catalogue, so flipping a flag breaks the
    // test rather than quietly making the sentence false. The phrasing is free
    // to change; the numbers in it are not.
    const word = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
    const claim = receipt!.claim.toLowerCase();
    const n = seatsNeedingSpend().length;
    expect(claim, `should say ${word[n]} need a budget`).toContain(word[n]);
    expect(claim).toContain("ten");
  });
});
