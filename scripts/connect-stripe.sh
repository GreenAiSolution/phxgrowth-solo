#!/usr/bin/env bash
#
# Connect Stripe to PHX/GROWTH SOLO, end to end, from one paste.
#
#   ./scripts/connect-stripe.sh
#
# WHY THIS EXISTS
#   A secret key must be typed by the person who owns it, so that step cannot
#   be automated away. Everything downstream of it can be, and every one of
#   those steps is a place a hand-run integration goes quietly wrong: a price
#   ID pasted into the wrong variable, a webhook secret copied with a trailing
#   space, six of seven prices pushed to Vercel. This does all of it in one
#   pass and verifies the result.
#
# WHAT IT TOUCHES
#   .env (local) and the Vercel Production environment. It prints the key's
#   mode and asks before it pushes anything to Vercel — nothing reaches
#   production without an explicit yes.
set -euo pipefail
cd "$(dirname "$0")/.."

# Node 18 cannot run the toolchain here; brew's node is required.
export PATH="/opt/homebrew/bin:$PATH"

bold=$(tput bold 2>/dev/null || true); dim=$(tput dim 2>/dev/null || true)
red=$(tput setaf 1 2>/dev/null || true); grn=$(tput setaf 2 2>/dev/null || true)
ylw=$(tput setaf 3 2>/dev/null || true); rst=$(tput sgr0 2>/dev/null || true)

echo ""
echo "${bold}Connect Stripe → PHX/GROWTH SOLO${rst}"
echo "${dim}Your key goes from your clipboard into .env and to Stripe. Nothing else sees it.${rst}"
echo ""

# ---------------------------------------------------------------- the key ---
#
# A hidden prompt needs a real keyboard. Run through anything that pipes stdin
# — Claude Code's `!` prefix, a CI step, `sh script < /dev/null` — and `read`
# gets EOF immediately, the key is empty, and without this check the script
# marches on to complain that "" is not a valid Stripe key. That message sends
# you looking at your key when the problem is the terminal.
if [[ ! -t 0 ]]; then
  cat <<'NOTTY'
This needs a real terminal — it can't read a hidden password through a pipe.

Open Terminal (Cmd+Space, type "Terminal") and run:

    cd ~/Addtophxgrowth && ./scripts/connect-stripe.sh

Nothing you type there is recorded anywhere, which is the other reason to
run it from there rather than through a chat window.
NOTTY
  exit 1
fi

printf "Paste your Stripe secret key (input is hidden): "
read -rs KEY
echo ""

if [[ -z "${KEY}" ]]; then
  echo "${red}Nothing pasted. Stopping.${rst}"; exit 1
fi
if [[ ! "${KEY}" =~ ^sk_(test|live)_[A-Za-z0-9]{20,}$ ]]; then
  echo "${red}That doesn't look like a Stripe secret key.${rst}"
  echo "It should start sk_test_ or sk_live_. Restricted keys (rk_) won't work —"
  echo "this needs to create products, prices and a webhook endpoint."
  exit 1
fi

if [[ "${KEY}" == sk_live_* ]]; then
  MODE="LIVE"
  echo "${red}${bold}  This is a LIVE key. Real cards, real money.  ${rst}"
  printf "Type ${bold}LIVE${rst} to confirm, or anything else to stop: "
  read -r CONFIRM
  [[ "${CONFIRM}" == "LIVE" ]] || { echo "Stopped."; exit 1; }
else
  MODE="TEST"
  echo "${grn}  Test mode. No real money can move.  ${rst}"
fi
echo ""

# ------------------------------------------------------------- write .env ---
# Portable in-place edit: macOS sed needs the empty -i argument.
touch .env
if grep -q '^STRIPE_SECRET_KEY=' .env; then
  # Written via a temp file rather than `sed -i "s|...|$KEY|"` on purpose —
  # the key would otherwise appear in the sed expression, and therefore in
  # the process list of every other user on the machine.
  grep -v '^STRIPE_SECRET_KEY=' .env > .env.tmp
  printf 'STRIPE_SECRET_KEY=%s\n' "${KEY}" >> .env.tmp
  mv .env.tmp .env
else
  printf 'STRIPE_SECRET_KEY=%s\n' "${KEY}" >> .env
fi
chmod 600 .env
echo "${grn}✓${rst} key saved to .env (${MODE}, mode 600)"

# ------------------------------------------- products, prices and webhook ---
echo ""
echo "${bold}Creating products, prices and the webhook…${rst}"
OUT=$(STRIPE_SECRET_KEY="${KEY}" npx tsx scripts/setup-stripe-seats.ts 2>&1) || {
  echo "${red}Stripe setup failed:${rst}"; echo "${OUT}"; exit 1
}
echo "${OUT}" | sed '/# ---- ENV LINES ----/,/# ---- END ENV LINES ----/d'

ENVBLOCK=$(echo "${OUT}" | sed -n '/# ---- ENV LINES ----/,/# ---- END ENV LINES ----/p' \
  | grep -E '^STRIPE_(PRICE|WEBHOOK)' || true)

if [[ -z "${ENVBLOCK}" ]]; then
  echo "${red}No price IDs came back. Stopping before anything is half-wired.${rst}"; exit 1
fi

# Merge: drop any previous value for each name, then append the new one.
while IFS= read -r line; do
  name="${line%%=*}"
  grep -v "^${name}=" .env > .env.tmp || true
  mv .env.tmp .env
  printf '%s\n' "${line}" >> .env
done <<< "${ENVBLOCK}"
chmod 600 .env
echo "${grn}✓${rst} $(echo "${ENVBLOCK}" | wc -l | tr -d ' ') values written to .env"

# ------------------------------------------------------------ verify local --
echo ""
echo "${bold}Checking the site agrees it's configured…${rst}"
if npx tsx -e '
  import { billingGaps } from "./src/lib/seat-billing";
  const gaps = billingGaps();
  if (gaps.length) { console.error("still missing: " + gaps.join(", ")); process.exit(1); }
  console.log("billing reports fully configured");
' 2>&1 | tail -2; then
  echo "${grn}✓${rst} local wiring complete"
else
  echo "${red}Local check failed — not pushing to Vercel.${rst}"; exit 1
fi

# ----------------------------------------------------------------- Vercel ---
echo ""
echo "${bold}Push these to Vercel Production?${rst}"
echo "${dim}This is what makes the live site able to take payment.${rst}"
printf "y/N: "
read -r PUSH
if [[ "${PUSH}" != "y" && "${PUSH}" != "Y" ]]; then
  echo "Skipped. Run this again any time, or push by hand with: vercel env add"
  exit 0
fi

push_var() {
  local name="$1" value="$2"
  npx vercel env rm "${name}" production --yes >/dev/null 2>&1 || true
  printf '%s' "${value}" | npx vercel env add "${name}" production >/dev/null 2>&1 \
    && echo "  ${grn}✓${rst} ${name}" \
    || echo "  ${red}✗${rst} ${name}"
}

echo ""
push_var STRIPE_SECRET_KEY "${KEY}"
while IFS= read -r line; do
  push_var "${line%%=*}" "${line#*=}"
done <<< "${ENVBLOCK}"

echo ""
echo "${ylw}One last step:${rst} redeploy so the new variables are picked up —"
echo "  npx vercel deploy --prod --yes"
echo ""
if [[ "${MODE}" == "TEST" ]]; then
  echo "Then buy a seat with test card ${bold}4242 4242 4242 4242${rst}, any future"
  echo "expiry, any CVC. You should get an email the moment it clears."
fi
echo ""
