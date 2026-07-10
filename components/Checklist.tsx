"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  computeBundleProgress,
  computeOverallProgress,
  computeRoomProgress,
  type CheckedItems,
} from "@/lib/progress";
import {
  emptyFilter,
  filterItems,
  isAvailableNow,
  type ItemFilter,
} from "@/lib/filters";
import { useBoard } from "@/lib/useBoard";
import { itemTags } from "@/lib/tags";
import type { BoardState } from "@/lib/board";
import { SEASONS, type Bundle, type BundleItem, type Room, type Season, type Source } from "@/lib/schema";

export function Checklist({ rooms, name }: { rooms: Room[]; name: string }) {
  const { checked, attribution, toggle, ready } = useBoard(rooms);
  const [filter, setFilter] = useState<ItemFilter>(emptyFilter);
  const [availNow, setAvailNow] = useState(false);
  const [curSeason, setCurSeason] = useState<Season>("spring");
  const [raining, setRaining] = useState(false);

  const hasName = name.trim() !== "";
  const interactive = ready && hasName;
  const isCompleted = (item: BundleItem) => Boolean(checked[item.id]);
  const sources = useMemo(() => collectSources(rooms), [rooms]);
  const overall = computeOverallProgress(rooms, checked);

  const filterActive =
    filter.season !== null ||
    filter.source !== null ||
    filter.search.trim() !== "" ||
    filter.hideCompleted;

  return (
    <div>
      <div className="overall">
        <ProgressBar
          label="Community Center"
          complete={overall.complete}
          total={overall.total}
          fraction={overall.fraction}
          big
        />
      </div>

      <div className="controls">
        <input
          className="control control--search"
          type="search"
          placeholder="Search items…"
          value={filter.search}
          onChange={(e) => setFilter({ ...filter, search: e.target.value })}
        />
        <select
          className="control"
          value={filter.season ?? ""}
          onChange={(e) =>
            setFilter({ ...filter, season: (e.target.value || null) as Season | null })
          }
        >
          <option value="">All seasons</option>
          {SEASONS.map((s) => (
            <option key={s} value={s}>
              {cap(s)}
            </option>
          ))}
        </select>
        <select
          className="control"
          value={filter.source ?? ""}
          onChange={(e) =>
            setFilter({ ...filter, source: (e.target.value || null) as Source | null })
          }
        >
          <option value="">All sources</option>
          {sources.map((s) => (
            <option key={s} value={s}>
              {cap(s)}
            </option>
          ))}
        </select>
        <label className="control control--check">
          <input
            type="checkbox"
            checked={filter.hideCompleted}
            onChange={(e) => setFilter({ ...filter, hideCompleted: e.target.checked })}
          />
          Hide completed
        </label>
        <label className="control control--check">
          <input
            type="checkbox"
            checked={availNow}
            onChange={(e) => setAvailNow(e.target.checked)}
          />
          Available now
        </label>
        {availNow && (
          <>
            <select
              className="control"
              value={curSeason}
              onChange={(e) => setCurSeason(e.target.value as Season)}
            >
              {SEASONS.map((s) => (
                <option key={s} value={s}>
                  {cap(s)}
                </option>
              ))}
            </select>
            <label className="control control--check">
              <input
                type="checkbox"
                checked={raining}
                onChange={(e) => setRaining(e.target.checked)}
              />
              Raining
            </label>
          </>
        )}
        <ResetButton />
      </div>

      <div className="rooms">
        {rooms.map((room) => {
          const roomProgress = computeRoomProgress(room, checked);
          const visibleBundles = room.bundles
            .map((bundle) => ({
              bundle,
              items: filterItems(bundle.items, filter, isCompleted),
            }))
            .filter(({ items }) => items.length > 0);

          if (filterActive && visibleBundles.length === 0) return null;

          return (
            <section key={room.id} className="room">
              <div className="room__head">
                <h2>{room.name}</h2>
                <ProgressBar
                  label=""
                  complete={roomProgress.complete}
                  total={roomProgress.total}
                  fraction={roomProgress.fraction}
                />
              </div>
              <div className="bundles">
                {visibleBundles.map(({ bundle, items }) => (
                  <BundleCard
                    key={bundle.id}
                    bundle={bundle}
                    items={items}
                    checked={checked}
                    attribution={attribution}
                    onToggle={(item) => toggle(item, name)}
                    interactive={interactive}
                    availNow={availNow}
                    curSeason={curSeason}
                    raining={raining}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function ProgressBar({
  label,
  complete,
  total,
  fraction,
  big,
}: {
  label: string;
  complete: number;
  total: number;
  fraction: number;
  big?: boolean;
}) {
  const pct = Math.round(fraction * 100);
  return (
    <div className={`progress${big ? " progress--big" : ""}`}>
      <div className="progress__meta">
        {label && <span className="progress__label">{label}</span>}
        <span className="progress__count">
          {complete}/{total} bundles · {pct}%
        </span>
      </div>
      <div className="progress__track">
        <div className="progress__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function BundleCard({
  bundle,
  items,
  checked,
  attribution,
  onToggle,
  interactive,
  availNow,
  curSeason,
  raining,
}: {
  bundle: Bundle;
  items: BundleItem[];
  checked: CheckedItems;
  attribution: BoardState;
  onToggle: (item: BundleItem) => void;
  interactive: boolean;
  availNow: boolean;
  curSeason: Season;
  raining: boolean;
}) {
  const progress = computeBundleProgress(bundle, checked);
  const shown = Math.min(progress.satisfied, progress.needed);

  return (
    <div className={`bundle bundle--${bundle.color}${progress.isComplete ? " bundle--complete" : ""}`}>
      <header className="bundle__header">
        <span className="bundle__name">{bundle.name}</span>
        <span className="bundle__count">
          {shown} of {progress.needed}
          {progress.isComplete ? " ✓" : ""}
        </span>
      </header>
      <ul className="items">
        {items.map((item) => {
          const isChecked = Boolean(checked[item.id]);
          const available = availNow && isAvailableNow(item, curSeason, raining);
          const dimmed = availNow && !available;
          return (
            <li
              key={item.id}
              className={`item${isChecked ? " item--checked" : ""}${
                available ? " item--available" : ""
              }${dimmed ? " item--dimmed" : ""}`}
            >
              <input
                type="checkbox"
                className="item__check"
                id={item.id}
                checked={isChecked}
                disabled={!interactive}
                onChange={() => onToggle(item)}
              />
              <ItemInfo item={item} />
              <label className="item__name" htmlFor={item.id}>
                {item.name}
              </label>
              {item.quantity > 1 && <span className="item__qty">×{item.quantity}</span>}
              {item.quality !== "any" && <span className="item__quality">{item.quality}</span>}
              {isChecked && attribution[item.id]?.checkedBy && (
                <span className="item__by">{attribution[item.id].checkedBy}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ItemInfo({ item }: { item: BundleItem }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDocPointer);
    return () => document.removeEventListener("pointerdown", onDocPointer);
  }, [open]);

  return (
    <div
      className="item__info"
      ref={ref}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="item__trigger"
        aria-expanded={open}
        aria-label={`How to get ${item.name}`}
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse") {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
      >
        <img className="item__sprite" src={item.sprite} alt="" width={32} height={32} />
      </button>
      {open && (
        <div className="item__pop" role="tooltip">
          <p className="pop__how">{item.howToGet}</p>
          <ul className="pop__tags">
            {itemTags(item).map((t, i) => (
              <li key={i} className={`tag tag--${t.kind}`}>
                {t.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ResetButton() {
  const [busy, setBusy] = useState(false);
  async function reset() {
    if (!window.confirm("Reset the whole board? This clears every tick for everyone.")) return;
    setBusy(true);
    await fetch("/api/reset", { method: "POST" }).catch(() => null);
    setBusy(false);
  }
  return (
    <button className="btn btn--danger" type="button" onClick={reset} disabled={busy}>
      {busy ? "Resetting…" : "Reset board"}
    </button>
  );
}

function collectSources(rooms: Room[]): Source[] {
  const set = new Set<Source>();
  for (const room of rooms)
    for (const bundle of room.bundles)
      for (const item of bundle.items) set.add(item.source);
  return [...set].sort();
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
