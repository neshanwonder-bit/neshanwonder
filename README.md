# neshanwonder

Your closet, on your device. Snap clothes → AI tags them → tell it where you're going → get outfit suggestions.

## What it does

1. **Add pieces.** Snap a photo of one garment; Claude vision auto-tags it (category, colors, pattern, fit, formality, warmth, seasons). Edit the tags before saving.
2. **Browse closet.** Grid of every saved piece, filterable by category. Tap any item to edit or mark it as in laundry / donated.
3. **Pick an outfit.** Type the occasion ("dinner date", "errands"). The current season comes from today's date. Claude picks 3 outfits using only your clean pieces. Hit ↻ Randomize to cycle options.

Storage is entirely on-device (IndexedDB). No login, no sync, no backend except a thin Next.js API route that proxies Claude API calls so the key stays server-side.

## Run locally

```sh
npm install
cp .env.example .env.local   # then paste your Anthropic API key
npm run dev
```

Open `http://localhost:3000` on your phone (same Wi-Fi) or laptop.

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel dashboard → **New Project** → import the repo. Framework auto-detects as Next.js.
3. Under **Environment Variables** add `ANTHROPIC_API_KEY` = your key.
4. Deploy. You get a `*.vercel.app` URL — keep it to yourself.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- `@anthropic-ai/sdk` — Claude Opus 4.8 for both vision tagging and outfit suggestions
- `idb` — IndexedDB wrapper for on-device storage
- Zod for runtime validation

## Notes

- No auth. Anyone with the URL can burn your API credits. Personal use only — don't share the deploy URL.
- Storage is per-browser. Switching phones / clearing site data wipes your closet.
- Photos are kept full-size in IndexedDB; expect ~100KB-1MB per item.
