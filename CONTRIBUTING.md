# Contributing

Thanks for helping improve the Stardew CC Checklist. This is a small Next.js +
Supabase app; contributions of any size are welcome.

## Local setup

See the [README](README.md) for full setup. In short: install dependencies with
`npm install`, copy `.env.example` to `.env.local` and fill in the values, then
run `npm run dev`.

## Running checks

- `npm test` — run the Vitest suite once.
- `npm run test:watch` — watch mode while developing.
- `npm run typecheck` — `tsc --noEmit`, must pass with no errors.

Both `npm run typecheck` and `npm test` must be green before you open a PR.

## Conventions

- **TDD with Vitest.** Pure logic lives in `lib/` with co-located `*.test.ts`
  files (e.g. `lib/progress.ts` + `lib/progress.test.ts`). Write the test first,
  then make it pass.
- **Zod schemas are the single source of truth.** All data shapes are defined in
  `lib/schema.ts`. TypeScript types are derived with `z.infer<typeof Schema>` —
  never hand-write a type that duplicates a schema.
- **Keep UI in `components/`.** Business logic should stay pure and testable in
  `lib/`; components consume it. Don't put game rules inside React components.

## Adding a bundle or villager to the dataset

Game content lives in Zod-validated JSON under `data/`. To add or edit content:

1. Edit the relevant file in `data/` (bundles or villagers), following the
   existing structure — ids are kebab-case slugs, sprites start with
   `/sprites/`, portraits with `/portraits/`.
2. Run `npm test`. The dataset is validated against `DatasetSchema` /
   `VillagersDatasetSchema`, so schema violations show up as failing tests.
3. Fix any validation errors and re-run until green.

## Commit style

Concise, imperative commit messages ("Add greenhouse bundle", not "Added..." or
"Adding..."). Keep each commit focused.

**Do not add AI/Claude co-author attribution** to commits or PRs.

## Pull requests

1. Fork the repo and create a branch off `main`.
2. Make your change; ensure `npm run typecheck` and `npm test` both pass.
3. Add tests for any new logic in `lib/`.
4. Open a PR against `main` describing what changed and why.
