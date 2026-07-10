-- Shared Community Center board. One global board (board_id defaults to 'main').
-- Static content (rooms/bundles/items) lives in the repo; this table holds only
-- mutable shared state: which slots are checked and by whom.
create table if not exists public.checks (
  board_id   text not null default 'main',
  slot_id    text not null,
  checked_by text not null,
  checked_at timestamptz not null default now(),
  primary key (board_id, slot_id)
);

-- Clients read + subscribe with the anon key; all writes go through the app's
-- passphrase-gated server routes using the service_role key (which bypasses RLS).
alter table public.checks enable row level security;
create policy "public read checks" on public.checks for select using (true);

alter publication supabase_realtime add table public.checks;

-- "Gifted this week" tracker: one row per (villager, giver) on a board. A player
-- toggles their own mark per villager; "New week" clears the whole board's gifts.
create table if not exists public.gifts (
  board_id    text not null default 'main',
  villager_id text not null,
  given_by    text not null,
  given_at    timestamptz not null default now(),
  primary key (board_id, villager_id, given_by)
);
alter table public.gifts enable row level security;
create policy "public read gifts" on public.gifts for select using (true);
alter publication supabase_realtime add table public.gifts;
