"use client";

import { useMemo, useState } from "react";
import { useGifts } from "@/lib/useGifts";
import { giftersOf } from "@/lib/gifts";
import type { GiftItem, Villager } from "@/lib/schema";

const hideImg = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.style.display = "none";
};

export function GiftsPanel({ villagers, name }: { villagers: Villager[]; name: string }) {
  const { state, toggle, ready } = useGifts();
  const [search, setSearch] = useState("");
  const [onlyLoved, setOnlyLoved] = useState(false);

  const interactive = ready && name.trim() !== "";
  const q = search.trim().toLowerCase();
  const shown = useMemo(
    () => (q ? villagers.filter((v) => v.name.toLowerCase().includes(q)) : villagers),
    [villagers, q],
  );

  return (
    <div>
      <p className="panel-note">
        Track who your group has gifted this week. Each person marks their own gifts; a villager
        can be gifted twice per week in-game. Hit <strong>New week</strong> to clear.
      </p>
      <div className="controls">
        <input
          className="control control--search"
          type="search"
          placeholder="Search villagers…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className="control control--check">
          <input
            type="checkbox"
            checked={onlyLoved}
            onChange={(e) => setOnlyLoved(e.target.checked)}
          />
          Loved only
        </label>
        <NewWeekButton />
      </div>

      <div className="villagers">
        {shown.map((v) => {
          const givers = giftersOf(state, v.id);
          const mine = givers.includes(name);
          return (
            <div key={v.id} className={`villager${givers.length ? " villager--gifted" : ""}`}>
              <header className="villager__head">
                <img
                  className="villager__portrait"
                  src={v.portrait}
                  alt=""
                  width={48}
                  height={48}
                  onError={hideImg}
                />
                <span className="villager__name">{v.name}</span>
                <label className="villager__toggle">
                  <input
                    type="checkbox"
                    checked={mine}
                    disabled={!interactive}
                    onChange={() => toggle(v.id, name)}
                  />
                  Gifted
                </label>
              </header>
              {givers.length > 0 && (
                <p className="villager__givers">✓ {givers.join(", ")}</p>
              )}
              <GiftList label="Loved" items={v.loved} kind="loved" />
              {!onlyLoved && <GiftList label="Liked" items={v.liked} kind="liked" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GiftList({ label, items, kind }: { label: string; items: GiftItem[]; kind: string }) {
  if (items.length === 0) return null;
  return (
    <div className={`giftlist giftlist--${kind}`}>
      <span className="giftlist__label">{label}</span>
      <ul className="gift-chips">
        {items.map((i) => (
          <li key={i.id} className="gift-chip">
            <img
              className="gift-chip__sprite"
              src={i.sprite}
              alt=""
              width={24}
              height={24}
              onError={hideImg}
            />
            {i.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

function NewWeekButton() {
  const [busy, setBusy] = useState(false);
  async function reset() {
    if (!window.confirm("Start a new week? This clears every 'gifted' mark for everyone.")) return;
    setBusy(true);
    await fetch("/api/gift/reset", { method: "POST" }).catch(() => null);
    setBusy(false);
  }
  return (
    <button className="btn btn--danger" type="button" onClick={reset} disabled={busy}>
      {busy ? "Clearing…" : "New week"}
    </button>
  );
}
