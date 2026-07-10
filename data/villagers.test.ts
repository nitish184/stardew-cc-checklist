import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import raw from "./villagers.json";
import { VillagersDatasetSchema } from "../lib/schema";

const PUBLIC = join(__dirname, "..", "public");

describe("villagers dataset", () => {
  const villagers = VillagersDatasetSchema.parse(raw).villagers;

  it("covers all 34 giftable villagers with unique ids", () => {
    expect(villagers.length).toBe(34);
    const ids = villagers.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every villager at least one loved gift", () => {
    for (const v of villagers) expect(v.loved.length).toBeGreaterThan(0);
  });

  it("has a committed portrait for every villager", () => {
    for (const v of villagers) {
      expect(existsSync(join(PUBLIC, v.portrait)), `missing ${v.portrait}`).toBe(true);
    }
  });

  it("uses valid /sprites/ paths for every gift item", () => {
    for (const v of villagers) {
      for (const item of [...v.loved, ...v.liked]) {
        expect(item.sprite.startsWith("/sprites/")).toBe(true);
      }
    }
  });
});
