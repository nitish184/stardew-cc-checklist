import { describe, expect, it } from "vitest";
import { applyGiftChange, giftersOf, type GiftRow, type GiftState } from "./gifts";

const row = (over: Partial<GiftRow> = {}): GiftRow => ({
  board_id: "main",
  villager_id: "abigail",
  given_by: "Alice",
  given_at: "2026-07-10T00:00:00.000Z",
  ...over,
});

describe("applyGiftChange", () => {
  it("records a giver on INSERT", () => {
    const next = applyGiftChange({}, { eventType: "INSERT", new: row() });
    expect(giftersOf(next, "abigail")).toEqual(["Alice"]);
  });

  it("accumulates multiple givers for the same villager", () => {
    let s: GiftState = {};
    s = applyGiftChange(s, { eventType: "INSERT", new: row({ given_by: "Alice" }) });
    s = applyGiftChange(s, { eventType: "INSERT", new: row({ given_by: "Bob" }) });
    expect(giftersOf(s, "abigail").sort()).toEqual(["Alice", "Bob"]);
  });

  it("DELETE removes only that giver, keeping the others", () => {
    let s: GiftState = {};
    s = applyGiftChange(s, { eventType: "INSERT", new: row({ given_by: "Alice" }) });
    s = applyGiftChange(s, { eventType: "INSERT", new: row({ given_by: "Bob" }) });
    s = applyGiftChange(s, { eventType: "DELETE", old: row({ given_by: "Alice" }) });
    expect(giftersOf(s, "abigail")).toEqual(["Bob"]);
  });

  it("DELETE of the last giver drops the villager key entirely", () => {
    let s: GiftState = applyGiftChange({}, { eventType: "INSERT", new: row() });
    s = applyGiftChange(s, { eventType: "DELETE", old: row() });
    expect(s).toEqual({});
  });

  it("is idempotent and does not mutate the previous state", () => {
    const start: GiftState = {};
    const once = applyGiftChange(start, { eventType: "INSERT", new: row() });
    const twice = applyGiftChange(once, { eventType: "INSERT", new: row() });
    expect(twice).toEqual(once);
    expect(start).toEqual({});
  });
});
