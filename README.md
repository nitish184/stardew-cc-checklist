# Stardew Co-op Tracker

*A cute, pixel-art, shared realtime checklist for finishing the Stardew Valley Community Center with friends.*

![CI](https://github.com/admin-ortus-solutions/stardew-cc-checklist/actions/workflows/ci.yml/badge.svg)

Playing a co-op Stardew Valley save and trying to complete the Community Center together? This is one shared, always-current board that everyone in your group can open, tick off, and watch update in real time — no more double-collecting a Parsnip someone already donated, or losing track of which bundle still needs what. It also carries the full Stardew 1.6 bundle dataset with per-item "how to get" info, and a second tab for tracking villager gifts.

**Live demo:** https://stardew-cc-checklist.vercel.app

## Screenshots

<!-- Screenshots are pending. Add the images below and remove these comments. -->

<!-- TODO: screenshot of the Community Center tab (rooms, bundles, progress bars) -->
![Community Center](docs/screenshot-cc.png)

<!-- TODO: screenshot of an item info tooltip showing "how to get" + season/source tags -->
![Item info tooltip](docs/screenshot-tooltip.png)

<!-- TODO: screenshot of the Gifts tab (villager portraits + weekly gift tracker) -->
![Gifts tab](docs/screenshot-gifts.png)

## Features

**Shared Community Center board**

- One global shared board, synced across everyone in real time via Supabase Realtime — a friend's tick shows up on your screen within about a second, no refresh.
- Per-item attribution: every checked item is labelled with the display name of whoever checked it.
- Passphrase gate so random people who find the URL can't grief your board.
- Pick a display name once; it's remembered in your browser (no accounts, no login).
- Overall Community Center progress bar plus per-room progress bars.
- Bundles auto-complete based on how many qualifying items are ticked (honouring N-of-M, required quantity, and required quality).
- Filters: text search, season, source type, "available now" (set the current season and whether it's raining to highlight what you can collect right now), and "hide completed".
- Item info tooltips — hover on desktop, tap on mobile — showing how to get each item plus tags for season, weather, time of day, source, and location.
- Passphrase-gated "Reset board" action to start fresh for a new co-op save.

**Gifts tab**

- Loved and liked gifts for all 34 giftable villagers, each with their portrait.
- A shared "gifted this week" tracker: each person marks their own gifts per villager (a villager can be gifted twice per week in-game), and everyone sees who has already gifted whom.
- "New week" action to clear all gift marks and start the week over.
- Villager search and a "loved only" filter.

**The dataset**

- Full Stardew 1.6 default (non-remixed) Community Center: 6 rooms, 30 bundles, 129 items.
- Every item carries required quantity, required quality, season(s), weather, time of day, source, location, day-gating, and a "how to get" description.
- All content is validated against a Zod schema — the schema is the single source of truth for the dataset's shape and the app's types.

**Look and feel**

- Pixel-art "Junimo bundle menu" theming — wood-plank and parchment surfaces, Junimo greens and browns — echoing the in-game Community Center bundle screen.
- Pixel fonts (Pixelify Sans for display, VT323 for body).
- Works on laptop and phone.

## Tech stack

- **[Next.js 15](https://nextjs.org/)** (App Router) + **[React 19](https://react.dev/)**
- **[TypeScript](https://www.typescriptlang.org/)**
- **[Zod](https://zod.dev/)** — dataset validation and the single source of truth for types
- **[Supabase](https://supabase.com/)** (Postgres + Realtime) — the shared board and gift-tracker state
- **[Vitest](https://vitest.dev/)** — unit tests (~71 tests)
- **[Vercel](https://vercel.com/)** — hosting

## Getting started

### Prerequisites

- **Node.js 22+**
- A **[Supabase](https://supabase.com/)** project (free tier is fine). Supabase is required today — the shared board and gift tracker read and write to it.

### 1. Install

```bash
git clone https://github.com/admin-ortus-solutions/stardew-cc-checklist.git
cd stardew-cc-checklist
npm install
```

### 2. Configure environment variables

Copy the example file and fill in the values:

```bash
cp .env.example .env.local
```

<!-- Note: create a `.env.example` documenting these four keys (values left blank) for contributors. -->

| Variable | What it is | Where to get it |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (public). | Supabase dashboard → Project Settings → API → Project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key; used by the browser to read and subscribe. | Supabase dashboard → Project Settings → API → Project API keys → `anon` `public`. |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key; used only server-side to write. **Never exposed to the client.** | Supabase dashboard → Project Settings → API → Project API keys → `service_role`. Keep this secret. |
| `BOARD_PASSPHRASE` | The shared passphrase that gates the board — a secret **you choose**. Anyone with it can view and edit the board. | You make it up. Share it with your co-op group; don't commit it. |

### 3. Set up the database

Apply the schema to your Supabase project. It creates the `public.checks` and `public.gifts` tables, enables row-level security (public read; writes go through the app's passphrase-gated server routes using the service-role key), and adds both tables to the realtime publication.

Run `supabase/schema.sql` against your project — for example, paste its contents into the Supabase dashboard **SQL Editor** and run it, or apply it with the Supabase CLI.

### 4. Fetch sprites and portraits

Item sprites and villager portraits are sourced from the Stardew Valley Wiki (no hotlinking — they're downloaded locally). Both scripts are idempotent, so you can re-run them any time.

```bash
node scripts/fetch-sprites.mjs       # item sprites -> public/sprites/
node scripts/fetch-gift-assets.mjs   # gift-item sprites + villager portraits -> public/sprites/ and public/portraits/
```

### 5. Run the dev server

```bash
npm run dev
```

Open http://localhost:3000, enter your `BOARD_PASSPHRASE`, pick a display name, and start ticking.

## Available scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server. |
| `npm run build` | Build for production. |
| `npm run start` | Start the production server (after a build). |
| `npm test` | Run the test suite once (`vitest run`). |
| `npm run test:watch` | Run tests in watch mode. |
| `npm run typecheck` | Type-check the project (`tsc --noEmit`). |

## Project structure

```
.
├── app/                 # Next.js App Router: root layout, page, and API routes
│   └── api/             #   passphrase auth + board/gift mutation & reset routes (service-role writes)
├── components/          # React UI: App shell, Checklist, GiftsPanel, Gate, NameBar
├── lib/                 # Domain logic + data access: Zod schema, pure progress/filter/tag/gift
│                        #   functions (with co-located *.test.ts), Supabase clients, board/gift hooks
├── data/                # Zod-validated JSON datasets: community-center.json, villagers.json (+ tests)
├── scripts/             # One-off asset fetchers for sprites and villager portraits
├── supabase/            # schema.sql — tables, RLS policies, realtime publication
└── public/              # Fetched sprites and portraits (populated by the scripts)
```

## Testing

Tests run on [Vitest](https://vitest.dev/) — roughly 71 tests. They focus on external behaviour: pure domain functions (bundle progress, "available now", filters/search, gift logic) and dataset integrity (every item validates against the Zod schema, every bundle's `needed` never exceeds its item count, etc.).

```bash
npm test
```

## Deployment

The app deploys to [Vercel](https://vercel.com/). Set all four environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `BOARD_PASSPHRASE`) in the Vercel project settings, and make sure your Supabase project has had `supabase/schema.sql` applied. Push to the connected branch and Vercel builds and deploys.

## Contributing

Contributions are welcome. Please see [CONTRIBUTING.md](CONTRIBUTING.md) for how to get set up and what to expect.

## License

Released under the [MIT License](LICENSE).

## Disclaimer & attribution

This is an unofficial, fan-made companion tool. It is **not affiliated with, endorsed by, or associated with ConcernedApe.** *Stardew Valley* and all game assets are © ConcernedApe. Item sprites and villager portraits are sourced from the [Stardew Valley Wiki](https://stardewvalleywiki.com/) and are used here for a non-commercial fan tool, not for redistribution.

## Acknowledgements

- The [Stardew Valley Wiki](https://stardewvalleywiki.com/) — the source of the bundle data, sprites, and portraits.
- ConcernedApe, for making Stardew Valley.
</content>
