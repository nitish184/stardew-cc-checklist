# PRD: Stardew Valley Community Center Checklist

> Status: ready-for-agent
> Repo (to be created): `nitish184/stardew-cc-checklist` (public)
> Stack: Next.js on Vercel + Supabase (Postgres + realtime)

## Problem Statement

My friends and I are playing a co-op Stardew Valley save and trying to complete the
Community Center together. We currently track "who has what / what's left to donate" in
our heads or a messy chat thread. It's easy to double-collect items, forget that a fish is
only catchable when it's raining or at night, or lose track of which bundle still needs
what. We want one shared, always-current checklist that everyone can see and tick off,
that also tells us *how* to get each item and *when* it's obtainable.

## Solution

A cute, pixel-art (Junimo bundle-menu style) website with **one shared global checklist**
of every default Community Center bundle item for Stardew 1.6. Anyone in the group opens
the link, enters a shared passphrase, picks a display name, and ticks off items. Ticks sync
in **real-time** — when a friend donates a Parsnip and ticks it, everyone else sees it
within about a second without refreshing, labelled "checked by <name>."

Each item shows its sprite; hovering (desktop) or tapping (mobile) reveals *how to get it*
plus tags for season, weather, time of day, source type, location, and any day-gating.
Progress bars show how close the group is to finishing each room and the whole Center. An
"available now" helper highlights what we can actually go collect this in-game season.

## User Stories

1. As a co-op player, I want a single shared checklist, so that my friends and I all see the same donation progress.
2. As a co-op player, I want ticks to appear in real-time, so that we don't double-collect an item someone just handled.
3. As a co-op player, I want each tick attributed to a name, so that we know who has already grabbed or donated something.
4. As a first-time visitor, I want to enter a shared passphrase, so that random people who find the URL can't grief our board.
5. As a first-time visitor, I want to pick a display name once, so that my ticks are attributed without me creating an account.
6. As a returning visitor, I want the site to remember my name, so that I don't re-enter it every visit.
7. As a player, I want items grouped by room and bundle, so that the checklist mirrors the actual Community Center menu.
8. As a player, I want to see all six rooms (Crafts, Pantry, Fish Tank, Boiler, Bulletin, Vault), so that nothing is missing.
9. As a player, I want each bundle to show "X of Y needed", so that I know how many items a bundle actually requires.
10. As a player, I want to see required quantity per item (e.g. 5 Wheat), so that I collect enough.
11. As a player, I want to see required quality per item (e.g. Gold Parsnip), so that I don't donate the wrong quality.
12. As a player, I want a bundle to auto-mark complete when enough qualifying items are ticked, so that I don't have to track the count manually.
13. As a player, I want a season filter, so that I can see what's relevant to the current in-game season.
14. As a player, I want to hover an item image on desktop to see how to get it, so that I don't have to leave the site to check the wiki.
15. As a mobile player, I want to tap an item image to see the same "how to get" info, so that the site works on my phone.
16. As a player, I want season/weather/time tags on items, so that I know a fish is e.g. "Rain only" or "Night only."
17. As a player, I want a source-type tag (forage/crop/fish/mine/artisan/animal/cook/shop/combat), so that I can tell at a glance how to obtain each item.
18. As a player, I want a location tag, so that I know where to go (specific river/lake/ocean, mine floor range, desert, etc.).
19. As a player, I want day-gated items flagged (Traveling Cart Fri/Sun, festival-only, vendor days), so that I don't miss limited windows.
20. As a player, I want overall CC completion as a progress bar, so that I feel our collective progress.
21. As a player, I want per-room and per-bundle progress, so that I can see which room is lagging.
22. As a player, I want to filter by source type and by tag, so that I can plan a fishing day or a foraging day.
23. As a player, I want a text search box, so that I can quickly find a specific item.
24. As a player, I want to hide completed items, so that I can focus on what's left.
25. As a player, I want an "available now" mode where I set the current season and whether it's raining, so that the site highlights what I can collect right now.
26. As a group admin, I want a passphrase-gated "reset board" action, so that we can start fresh for a new co-op save.
27. As a player, I want to untick an item, so that mistakes can be corrected.
28. As a player, I want the site to look like Stardew (pixel art, wood panels, Junimo colors), so that it feels part of the game.
29. As a player, I want the site to load fast and work on a laptop or phone, so that anyone in the group can use it anywhere.
30. As a player, I want the checklist to be accurate to Stardew 1.6 default (non-remixed) bundles, so that I can trust it.
31. As a player, I want to see which items span multiple seasons, so that I know an item isn't lost if I miss one season.
32. As a player, I want clear visual state for ticked vs unticked items, so that the board is scannable at a glance.

## Implementation Decisions

**Application**
- Next.js app deployed on Vercel from a public GitHub repo `nitish184/stardew-cc-checklist`.
- Supabase (Postgres + realtime subscriptions) as the shared backend.
- One global board (single co-op save at a time). Multiple independent boards are out of scope.

**Data model**
- Static content (rooms → bundles → items with all metadata) lives as versioned JSON in the repo, validated against a schema. This is the source of truth for structure; it is not stored in the DB.
- Item shape includes: id, display name, sprite path, bundle membership, required quantity, required quality, season(s), weather, time-of-day, source type, location, day-gating flag, and a "how to get" description string.
- Bundle shape includes: id, room, display name, `needed` (N of M), and the list of item ids.
- Supabase stores only mutable shared state: a `checks` table keyed by item id (or bundle-item slot) with `checked_by` (name), `checked_at`. The board is a single logical board; a board id column is included to allow reset (new board id) without deleting history if desired.

**Realtime + identity**
- Client subscribes to the `checks` table via Supabase realtime; incoming changes merge into local state through a pure reducer.
- Display name is chosen on first visit and stored in the browser (localStorage). No auth provider.

**Passphrase gate (server-enforced)**
- A Next.js server route validates a submitted passphrase against an env-var value and, on success, sets an httpOnly cookie. Board data/mutations require that cookie server-side. The passphrase is a "keep randoms out" measure, explicitly not bank-grade security.
- Supabase service credentials never reach the client; the anon key + RLS is scoped so that only the app's gated paths can mutate.

**Bundle completion logic**
- `computeBundleProgress(bundle, checkedItems)` is a pure function returning satisfied count, needed count, and `isComplete`, honoring N-of-M, per-item quantity, and quality. UI derives all progress bars from this.

**"Available now" + filters**
- `isAvailableNow(item, season, isRaining)` and the filter/search predicates are pure functions over the dataset. Season filter, source-type filter, tag filter, text search, and hide-completed all compose over the same item list.

**Assets**
- Item sprites are fetched from the Stardew wiki and committed to the repo as local PNGs (~150–200 small images). No hotlinking.

**Aesthetic**
- Pixel-art Stardew styling: wood-panel/parchment surfaces, pixel font, Junimo greens/browns, echoing the in-game bundle menu.

**Reset**
- A passphrase-gated action clears/rotates the board so a new co-op save starts empty.

**Deployment**
- GitHub account `nitish184`, Vercel account `nat-ortus-admin`, Supabase (login pending at deploy time). Flagged: these appear to be work accounts, not the personal one requested; proceeding per user instruction.

## Testing Decisions

Good tests here assert **external behavior**, not implementation details — given a dataset
and a set of ticks, what does the user-visible result compute to — and keep Supabase and the
network at arm's length.

- **Pure domain module (primary seam, no mocks):**
  - `computeBundleProgress(bundle, checkedItems)` — N-of-M satisfied, quantity thresholds, quality requirements, and `isComplete` boundary (one short of complete vs exactly complete vs over-complete).
  - `isAvailableNow(item, season, isRaining)` — season match, rain-only items, multi-season items, always-available items.
  - Filter/search predicates — source-type filter, tag filter, text search (case-insensitive, partial), hide-completed, and combinations.
- **Dataset integrity test:** the 1.6 JSON validates against a schema — every item has all required fields; every bundle's `needed <= items.length`; all tags come from the allowed vocabulary; sprite paths resolve to committed files.
- **Passphrase route (integration seam):** correct passphrase → httpOnly cookie set and access granted; wrong/absent passphrase → 401 and no cookie.
- **Realtime apply-reducer:** `applyRemoteChange(state, event)` merges an incoming tick/untick into local state idempotently (duplicate events don't double-apply; untick removes attribution).
- **E2E (optional, Playwright):** enter passphrase → tick an item → reload → item still checked and attributed. Nice-to-have, not required for first ship.

Prior art: none yet (greenfield). The pure-function unit tests establish the pattern; later
tests should follow the same "feed data in, assert visible result out" style.

## Out of Scope

- Remixed/randomized bundles (only default 1.6 bundles).
- The Joja / Movie Theater alternative route.
- Real user accounts / OAuth login.
- Multiple simultaneous boards or per-player private progress (single global board only).
- Non-Community-Center tracking (Museum, 100% perfection, shipping collection, etc.).
- Native mobile apps.
- Bank-grade security / abuse protection beyond the shared passphrase gate.
- Localization / multi-language.

## Further Notes

- The **dataset is the largest lift** and the most error-prone part; it will be sourced from
  the Stardew wiki and should be sanity-checked by the group against a few known bundles
  before being fully trusted.
- Sprites are ConcernedApe's copyrighted assets, used for a private friend-group fan tool;
  acceptable for this low-stakes personal use, not for redistribution.
- Because the board is a single global one, a visible "reset" is important before starting a
  new save so old ticks don't confuse the group.
- Build order: scaffold app → build + validate 1.6 dataset → fetch/commit sprites → UI
  (checklist, tooltips, filters, progress) → Supabase realtime + passphrase gate → deploy.
