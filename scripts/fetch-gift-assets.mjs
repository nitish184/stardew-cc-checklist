#!/usr/bin/env node
// Downloads gift-item sprites (into public/sprites/<slug>.png) and villager
// portraits (into public/portraits/<id>.png) referenced by data/villagers.json,
// from the Stardew Valley wiki. Same md5-path strategy as fetch-sprites.mjs.
// Idempotent. Items whose sprite already exists are skipped; genuine misses are
// reported and simply render without an icon in the UI.

import { readFileSync, existsSync, mkdirSync, writeFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { get } from "node:https";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DATA = join(ROOT, "data", "villagers.json");
const SPRITES = join(ROOT, "public", "sprites");
const PORTRAITS = join(ROOT, "public", "portraits");

// slug -> exact wiki file name, for items/portraits whose wiki filename is not
// just "<Name with spaces as underscores>.png".
const ITEM_OVERRIDES = {
  "strange-doll-green": "Strange_Doll_(green).png",
  "strange-doll-yellow": "Strange_Doll_(yellow).png",
};
const PORTRAIT_OVERRIDES = {};

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
const isPng = (buf) => buf && buf.length > 4 && buf.subarray(0, 4).equals(PNG_MAGIC);

function imageUrl(wikiFile) {
  const h = createHash("md5").update(wikiFile).digest("hex");
  return `https://stardewvalleywiki.com/mediawiki/images/${h[0]}/${h[0]}${h[1]}/${encodeURIComponent(wikiFile)}`;
}

function fetchBuffer(url, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    const req = get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      const { statusCode, headers } = res;
      if (statusCode >= 300 && statusCode < 400 && headers.location) {
        res.resume();
        if (redirectsLeft <= 0) return reject(new Error("too many redirects"));
        return resolve(fetchBuffer(new URL(headers.location, url).toString(), redirectsLeft - 1));
      }
      if (statusCode !== 200) {
        res.resume();
        return reject(new Error("HTTP " + statusCode));
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
    });
    req.on("error", reject);
    req.setTimeout(30000, () => req.destroy(new Error("timeout")));
  });
}

async function fetchInto(dir, slug, wikiFile, downloaded, failed) {
  const dest = join(dir, slug + ".png");
  if (existsSync(dest) && statSync(dest).size > 0 && isPng(readFileSync(dest))) return "skip";
  try {
    const buf = await fetchBuffer(imageUrl(wikiFile));
    if (!isPng(buf)) {
      failed.push({ slug, wikiFile, reason: "not a PNG" });
      return "fail";
    }
    writeFileSync(dest, buf);
    downloaded.push(slug);
    return "ok";
  } catch (err) {
    failed.push({ slug, wikiFile, reason: err.message });
    return "fail";
  }
}

async function main() {
  mkdirSync(SPRITES, { recursive: true });
  mkdirSync(PORTRAITS, { recursive: true });
  const data = JSON.parse(readFileSync(DATA, "utf8"));

  const items = new Map();
  for (const v of data.villagers)
    for (const i of [...v.loved, ...v.liked]) if (!items.has(i.id)) items.set(i.id, i.name);

  const downloaded = [];
  const failed = [];

  for (const [slug, name] of items) {
    const wikiFile = ITEM_OVERRIDES[slug] ?? name.replace(/ /g, "_") + ".png";
    await fetchInto(SPRITES, slug, wikiFile, downloaded, failed);
  }
  const itemFails = failed.length;

  for (const v of data.villagers) {
    const wikiFile = PORTRAIT_OVERRIDES[v.id] ?? v.name.replace(/ /g, "_") + ".png";
    await fetchInto(PORTRAITS, v.id, wikiFile, downloaded, failed);
  }

  console.log("=== Summary ===");
  console.log(`gift items      : ${items.size}`);
  console.log(`portraits       : ${data.villagers.length}`);
  console.log(`downloaded      : ${downloaded.length}`);
  console.log(`item failures   : ${itemFails}`);
  console.log(`portrait fails  : ${failed.length - itemFails}`);
  if (failed.length) {
    console.log("\nMissing (render without icon):");
    for (const f of failed) console.log(`  ${f.slug}  (tried "${f.wikiFile}")  -> ${f.reason}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
