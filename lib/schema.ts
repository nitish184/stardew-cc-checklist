import { z } from "zod";

export const SEASONS = ["spring", "summer", "fall", "winter"] as const;
export const QUALITIES = ["any", "silver", "gold", "iridium"] as const;
export const WEATHERS = ["any", "sunny", "rain"] as const;
export const TIMES = ["any", "day", "night"] as const;
export const SOURCES = [
  "forage",
  "crop",
  "fish",
  "mine",
  "artisan",
  "animal",
  "cook",
  "shop",
  "combat",
  "money",
] as const;

const slug = z.string().regex(/^[a-z0-9-]+$/, "must be a kebab-case slug");

export const BundleItemSchema = z.object({
  id: slug,
  name: z.string().min(1),
  sprite: z.string().startsWith("/sprites/"),
  quantity: z.number().int().positive(),
  quality: z.enum(QUALITIES),
  seasons: z.array(z.enum(SEASONS)).min(1),
  weather: z.enum(WEATHERS),
  time: z.enum(TIMES),
  source: z.enum(SOURCES),
  location: z.string().min(1),
  dayGated: z.boolean(),
  howToGet: z.string().min(1),
});

export const BundleSchema = z
  .object({
    id: slug,
    name: z.string().min(1),
    color: z.string().min(1),
    needed: z.number().int().positive(),
    items: z.array(BundleItemSchema).min(1),
  })
  .refine((b) => b.needed <= b.items.length, {
    message: "needed cannot exceed the number of item slots",
    path: ["needed"],
  })
  .refine((b) => new Set(b.items.map((i) => i.id)).size === b.items.length, {
    message: "item slot ids must be unique within a bundle",
    path: ["items"],
  });

export const RoomSchema = z.object({
  id: slug,
  name: z.string().min(1),
  bundles: z.array(BundleSchema).min(1),
});

export const DatasetSchema = z.object({
  version: z.number().int().positive(),
  game: z.string().min(1),
  rooms: z.array(RoomSchema).min(1),
});

export const GiftItemSchema = z.object({
  id: slug,
  name: z.string().min(1),
  sprite: z.string().startsWith("/sprites/"),
});

export const VillagerSchema = z.object({
  id: slug,
  name: z.string().min(1),
  portrait: z.string().startsWith("/portraits/"),
  loved: z.array(GiftItemSchema),
  liked: z.array(GiftItemSchema),
});

export const VillagersDatasetSchema = z.object({
  version: z.number().int().positive(),
  game: z.string().min(1),
  villagers: z.array(VillagerSchema).min(1),
});

export type BundleItem = z.infer<typeof BundleItemSchema>;
export type GiftItem = z.infer<typeof GiftItemSchema>;
export type Villager = z.infer<typeof VillagerSchema>;
export type VillagersDataset = z.infer<typeof VillagersDatasetSchema>;
export type Bundle = z.infer<typeof BundleSchema>;
export type Room = z.infer<typeof RoomSchema>;
export type Dataset = z.infer<typeof DatasetSchema>;
export type Quality = (typeof QUALITIES)[number];
export type Season = (typeof SEASONS)[number];
export type Source = (typeof SOURCES)[number];
