"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getAllItems } from "@/lib/db";
import type { ClosetItem } from "@/lib/schema";
import { currentSeason, seasonLabel } from "@/lib/season";

type Outfit = { item_ids: string[]; rationale: string };

const QUICK_OCCASIONS = [
  "casual day out",
  "coffee with a friend",
  "dinner date",
  "work / office",
  "errands",
  "going out at night",
  "workout",
  "travel day",
];

export default function OutfitPage() {
  const [items, setItems] = useState<ClosetItem[]>([]);
  const [occasion, setOccasion] = useState("");
  const [season, setSeason] = useState(currentSeason());
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [shownIdx, setShownIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAllItems().then((all) => setItems(all.filter((i) => i.availability === "clean")));
  }, []);

  const itemMap = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  async function suggest() {
    if (!occasion.trim()) {
      setError("Pick an occasion first.");
      return;
    }
    if (items.length < 2) {
      setError("Add at least 2 clean pieces to your closet first.");
      return;
    }
    setLoading(true);
    setError(null);
    setOutfits([]);
    try {
      const summary = items.map((i) => ({
        id: i.id,
        category: i.category,
        subcategory: i.subcategory,
        colors: i.colors,
        pattern: i.pattern,
        fit: i.fit,
        formality: i.formality,
        warmth: i.warmth,
        seasons: i.seasons,
      }));
      const res = await fetch("/api/suggest-outfit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ occasion: occasion.trim(), season, items: summary }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `outfit api ${res.status}`);
      }
      const data = (await res.json()) as { outfits: Outfit[] };
      const valid = data.outfits.filter((o) => o.item_ids.length >= 2);
      if (valid.length === 0) throw new Error("No valid outfits returned. Try a different occasion.");
      setOutfits(valid);
      setShownIdx(0);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function randomize() {
    if (outfits.length <= 1) return;
    let next = shownIdx;
    while (next === shownIdx) next = Math.floor(Math.random() * outfits.length);
    setShownIdx(next);
  }

  const current = outfits[shownIdx];
  const currentItems = current?.item_ids.map((id) => itemMap.get(id)).filter(Boolean) as ClosetItem[];

  return (
    <main className="mx-auto max-w-md px-4 pb-32 pt-6">
      <header className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-sm text-ink/60">
          ← Closet
        </Link>
        <h1 className="font-display text-2xl">Pick an outfit</h1>
        <span className="w-12" />
      </header>

      <div className="mb-4">
        <label className="mb-1 block text-xs uppercase tracking-wide text-ink/60">Going to…</label>
        <input
          className="w-full rounded-2xl border border-ink/20 bg-white/70 px-4 py-3 text-base"
          placeholder="dinner date / errands / wedding"
          value={occasion}
          onChange={(e) => setOccasion(e.target.value)}
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {QUICK_OCCASIONS.map((o) => (
            <button
              key={o}
              onClick={() => setOccasion(o)}
              className="rounded-full border border-ink/15 px-3 py-1 text-xs text-ink/70"
            >
              {o}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 flex items-center justify-between rounded-2xl bg-white/50 px-4 py-3">
        <span className="text-xs uppercase tracking-wide text-ink/60">Season</span>
        <div className="flex gap-1">
          {(["spring", "summer", "fall", "winter"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSeason(s)}
              className={`rounded-full px-3 py-1 text-xs ${
                season === s ? "bg-ink text-cream" : "text-ink/60"
              }`}
            >
              {seasonLabel(s)}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={suggest}
        disabled={loading}
        className="mb-6 w-full rounded-full bg-ink py-4 text-base font-medium text-cream shadow-lg disabled:opacity-50"
      >
        {loading ? "Styling…" : outfits.length ? "Get new options" : "Style me"}
      </button>

      {error && (
        <div className="mb-4 rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-accent">
          {error}
        </div>
      )}

      {current && currentItems && (
        <section className="space-y-3">
          <div className="checker rounded-3xl bg-white/40 p-3">
            <div className="flex flex-col items-center gap-2">
              {currentItems.map((i) => (
                <img
                  key={i.id}
                  src={i.imageDataUrl}
                  alt={i.subcategory}
                  className="max-h-56 object-contain"
                />
              ))}
            </div>
          </div>
          <p className="text-center text-sm italic text-ink/70">{current.rationale}</p>
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            {currentItems.map((i) => (
              <Link
                key={i.id}
                href={`/item/${i.id}`}
                className="rounded-full border border-ink/15 px-3 py-1 text-xs capitalize"
              >
                {i.subcategory}
              </Link>
            ))}
          </div>
          <div className="flex justify-between pt-2 text-sm">
            <span className="text-ink/50">
              Option {shownIdx + 1} of {outfits.length}
            </span>
            <button onClick={randomize} className="font-medium text-accent">
              ↻ Randomize
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
