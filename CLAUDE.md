# CLAUDE.md

Guidance for Claude Code (and any future model) working in this repo. Read this first — it's the fastest way to be productive here without re-deriving the architecture every session.

## What this is

**neshanwonder** — a personal closet planner. Snap a photo of a garment → Claude vision tags it → describe an occasion → Claude suggests outfits from your own clean pieces. Everything is on-device; there is no user database and no accounts.

## Stack

- **Next.js 14** (App Router) + **TypeScript** (strict) + **Tailwind**
- **`@anthropic-ai/sdk`** — Claude for vision tagging and outfit suggestions, called only from server-side API routes
- **`idb`** — IndexedDB wrapper; all closet data lives in the browser
- **`zod`** — runtime validation of request bodies and model output
- Deployed on Vercel

## Commands

```sh
npm install
cp .env.example .env.local   # paste ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
npm run build                # production build — run before declaring a change done
npm run lint                 # next lint
npm run eval -- ./img.jpg    # prompt eval harness (needs `npm run dev` running); see scripts/eval-prompts.mjs
```

There is no unit-test suite yet. Verify changes with `npm run build`, the `npm run eval` harness (exercises the AI routes against sample inputs), and by exercising the flow in the browser.

## Architecture

```
app/
  page.tsx            # closet grid (home), filter by category
  add/page.tsx        # capture a photo, review AI tags, save
  item/[id]/page.tsx  # edit one item, change availability
  outfit/page.tsx     # enter occasion, get 3 outfit suggestions
  api/
    tag-item/route.ts       # POST image → tags (vision)
    suggest-outfit/route.ts # POST wardrobe + occasion → outfits
lib/
  schema.ts       # Zod schemas + TS types — the source of truth for data shape
  db.ts           # IndexedDB CRUD (client-only, "use client")
  season.ts       # current season from today's date
  bg-removal.ts   # client-side image background removal
```

**Data flow:** UI (client) reads/writes IndexedDB via `lib/db.ts`. When AI is needed, the client POSTs to an API route; the route calls the Anthropic SDK server-side so the API key never reaches the browser. Model output is parsed and re-validated with the matching Zod schema before it's trusted.

## Conventions that matter here

- **`lib/schema.ts` is the source of truth.** Categories, patterns, fits, seasons, availability, the `ClosetItem`/`Tags`/`Outfit` shapes, **and** the API-facing JSON Schemas (`TAGS_JSON_SCHEMA`, `OUTFIT_JSON_SCHEMA`) all live here. Change types here first, then let the type errors guide the rest.
- **Two schemas per model call — now compiler-guarded.** Each model call needs a plain **JSON Schema** (for the SDK's `output_config.format`) *and* a **Zod** schema (to re-validate the result). Both live in `lib/schema.ts`, side by side, with `ExactKeys<...>` compile-time assertions: if the JSON Schema's field set drifts from the Zod type, `tsc`/`next build` fails. So you still update both when adding a field, but forgetting is now a build error, not a silent runtime rejection.
- **Do NOT replace the hand-written JSON Schemas with the SDK's `zodOutputFormat`.** It was tried and rejected: with this Zod build it downgrades `enum` fields to plain `string` (dropping server-side enforcement) and overwrites the field descriptions with stringified constraint blobs. The hand-written schemas keep enforced enums and model-guiding descriptions — keep them.
- **Never trust model output.** Both routes re-validate with Zod and return `502` with the raw text on failure. `suggest-outfit` additionally filters returned `item_ids` down to ids that actually exist in the submitted wardrobe. Preserve that guard — it's what stops the model from inventing items.
- **`db.ts` is client-only** (`"use client"`). Don't import it into an API route or server component.
- **Secrets stay server-side.** `ANTHROPIC_API_KEY` is read by `new Anthropic()` inside routes only. Never expose it to the client or log it. `.env.local` is gitignored — keep it that way.
- **Images are stored full-size in IndexedDB** (~100KB–1MB each). Both a processed `imageDataUrl` and the `originalImageDataUrl` are kept per item.

## Model versions

The API routes pin **`claude-opus-4-8`** (the current Opus generation). The broader current lineup also includes the **Claude 5 family** (e.g. `claude-sonnet-5` for cheaper high-volume calls, `claude-fable-5` for the hardest reasoning). When updating models:

- Vision tagging (`tag-item`) and outfit reasoning (`suggest-outfit`) both benefit from a strong model, but tagging is high-volume — a smaller/faster model there can cut cost with little quality loss.
- Both routes already use structured output via `output_config.format` with a `json_schema`. Keep that pattern; it's the reliable way to get parseable results.
- Before bumping a model id, confirm the id against current Anthropic docs (the `claude-api` skill is the reference) rather than guessing a name.

## Gotchas

- **Storage is per-browser.** Clearing site data or switching devices wipes the closet. There is intentionally no sync.
- **No auth.** Anyone with the deploy URL can spend your API credits. This is personal-use software; don't share the URL.
- **API routes use `runtime = "nodejs"` and `maxDuration = 60`.** Vision + generation can be slow; don't lower these without reason.
