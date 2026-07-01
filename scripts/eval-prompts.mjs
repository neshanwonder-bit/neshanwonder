#!/usr/bin/env node
// Prompt eval harness — exercises the real API routes against sample inputs so
// you can iterate on the tagging and outfit prompts and see what comes back.
//
// It calls the running dev server, so it tests the actual routes end-to-end
// (real prompt, real model, real Zod validation) with no logic duplicated here.
//
// Usage:
//   1. npm run dev                       (in another terminal; needs ANTHROPIC_API_KEY in .env.local)
//   2. npm run eval -- ./path/to/shirt.jpg ./path/to/jeans.png
//
// Any image paths you pass are sent through /api/tag-item. The outfit check
// always runs against a built-in sample wardrobe — no image needed.

import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";

const BASE = process.env.EVAL_BASE_URL ?? "http://localhost:3000";

const MEDIA_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

async function tagImages(paths) {
  for (const p of paths) {
    const mediaType = MEDIA_TYPES[extname(p).toLowerCase()];
    if (!mediaType) {
      console.log(`\n⚠ ${basename(p)}: unsupported extension — skipping`);
      continue;
    }
    const imageBase64 = (await readFile(p)).toString("base64");
    const { ok, status, json } = await post("/api/tag-item", { imageBase64, mediaType });
    console.log(`\n▶ tag-item · ${basename(p)}  [${status}]`);
    if (ok) console.log(JSON.stringify(json.tags, null, 2));
    else console.log("  error:", JSON.stringify(json));
  }
}

async function suggestOutfits() {
  const items = [
    { id: "a", category: "top", subcategory: "oxford shirt", colors: ["white"], pattern: "solid", fit: "regular", formality: 4, warmth: 2, seasons: ["spring", "fall"] },
    { id: "b", category: "bottom", subcategory: "chinos", colors: ["navy"], pattern: "solid", fit: "regular", formality: 3, warmth: 3, seasons: ["spring", "fall", "winter"] },
    { id: "c", category: "shoes", subcategory: "leather loafers", colors: ["brown"], pattern: "solid", fit: null, formality: 4, warmth: 2, seasons: ["spring", "fall"] },
    { id: "d", category: "top", subcategory: "graphic tee", colors: ["black"], pattern: "graphic", fit: "regular", formality: 2, warmth: 2, seasons: ["summer"] },
    { id: "e", category: "bottom", subcategory: "denim shorts", colors: ["blue"], pattern: "solid", fit: "regular", formality: 2, warmth: 1, seasons: ["summer"] },
    { id: "f", category: "outerwear", subcategory: "wool blazer", colors: ["charcoal"], pattern: "solid", fit: "regular", formality: 5, warmth: 4, seasons: ["fall", "winter"] },
  ];
  const cases = [
    { occasion: "dinner date", season: "fall" },
    { occasion: "running errands", season: "summer" },
  ];
  for (const c of cases) {
    const { status, ok, json } = await post("/api/suggest-outfit", { ...c, items });
    console.log(`\n▶ suggest-outfit · "${c.occasion}" (${c.season})  [${status}]`);
    if (!ok) {
      console.log("  error:", JSON.stringify(json));
      continue;
    }
    for (const outfit of json.outfits ?? []) {
      const names = outfit.item_ids
        .map((id) => items.find((i) => i.id === id)?.subcategory ?? id)
        .join(" + ");
      console.log(`  • ${names} — ${outfit.rationale}`);
    }
  }
}

async function main() {
  const imagePaths = process.argv.slice(2);
  console.log(`Eval target: ${BASE}`);
  try {
    await fetch(BASE);
  } catch {
    console.error(`\n✗ Could not reach ${BASE}. Start the dev server first: npm run dev`);
    process.exit(1);
  }
  if (imagePaths.length) await tagImages(imagePaths);
  else console.log("\n(no image paths given — skipping tag-item; pass some to test tagging)");
  await suggestOutfits();
}

main();
