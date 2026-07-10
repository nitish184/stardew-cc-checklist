import { describe, expect, it } from "vitest";
import {
  applyRemoteChange,
  checkedItemsFromBoard,
  indexSlots,
  type BoardState,
  type CheckRow,
} from "./board";
import type { BundleItem, Room } from "./schema";

const slot = (id: string, over: Partial<BundleItem> = {}): BundleItem => ({
  id,
  name: id,
  sprite: `/sprites/${id}.png`,
  quantity: 1,
  quality: "any",
  seasons: ["spring"],
  weather: "any",
  time: "any",
  source: "forage",
  location: "Anywhere",
  dayGated: false,
  howToGet: "x",
  ...over,
});

const rooms: Room[] = [
  {
    id: "crafts-room",
    name: "Crafts Room",
    bundles: [
      { id: "b1", name: "B1", color: "green", needed: 1, items: [slot("gold-parsnip", { quality: "gold", quantity: 5 })] },
    ],
  },
];

const row = (over: Partial<CheckRow> = {}): CheckRow => ({
  board_id: "main",
  slot_id: "spring-foraging-wild-horseradish",
  checked_by: "Nitish",
  checked_at: "2026-07-10T00:00:00.000Z",
  ...over,
});

describe("applyRemoteChange", () => {
  it("adds attribution on INSERT", () => {
    const next = applyRemoteChange({}, { eventType: "INSERT", new: row() });
    expect(next).toEqual({
      "spring-foraging-wild-horseradish": {
        checkedBy: "Nitish",
        checkedAt: "2026-07-10T00:00:00.000Z",
      },
    });
  });

  it("removes attribution on DELETE", () => {
    const start: BoardState = {
      "spring-foraging-wild-horseradish": { checkedBy: "Nitish", checkedAt: "x" },
      "spring-foraging-leek": { checkedBy: "Sam", checkedAt: "y" },
    };
    const next = applyRemoteChange(start, { eventType: "DELETE", old: row() });
    expect(next).toEqual({ "spring-foraging-leek": { checkedBy: "Sam", checkedAt: "y" } });
  });

  it("is idempotent: a duplicate INSERT does not change the result", () => {
    const once = applyRemoteChange({}, { eventType: "INSERT", new: row() });
    const twice = applyRemoteChange(once, { eventType: "INSERT", new: row() });
    expect(twice).toEqual(once);
  });

  it("DELETE of an absent slot is a no-op", () => {
    const start: BoardState = { "spring-foraging-leek": { checkedBy: "Sam", checkedAt: "y" } };
    const next = applyRemoteChange(start, { eventType: "DELETE", old: row() });
    expect(next).toEqual(start);
  });

  it("UPDATE overwrites the attribution", () => {
    const start = applyRemoteChange({}, { eventType: "INSERT", new: row() });
    const next = applyRemoteChange(start, {
      eventType: "UPDATE",
      new: row({ checked_by: "Sam", checked_at: "later" }),
    });
    expect(next["spring-foraging-wild-horseradish"]).toEqual({
      checkedBy: "Sam",
      checkedAt: "later",
    });
  });

  it("does not mutate the previous state object", () => {
    const start: BoardState = {};
    applyRemoteChange(start, { eventType: "INSERT", new: row() });
    expect(start).toEqual({});
  });
});

describe("checkedItemsFromBoard", () => {
  const index = indexSlots(rooms);

  it("maps a checked slot to its full requirement (quantity + quality)", () => {
    const state: BoardState = { "gold-parsnip": { checkedBy: "Nitish", checkedAt: "x" } };
    expect(checkedItemsFromBoard(state, index)).toEqual({
      "gold-parsnip": { quantity: 5, quality: "gold" },
    });
  });

  it("ignores slot ids that are not in the dataset", () => {
    const state: BoardState = { "stale-slot": { checkedBy: "Nitish", checkedAt: "x" } };
    expect(checkedItemsFromBoard(state, index)).toEqual({});
  });
});
