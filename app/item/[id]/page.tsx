"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { deleteItem, getItem, putItem } from "@/lib/db";
import type { Availability, ClosetItem } from "@/lib/schema";
import { AVAILABILITY, CATEGORIES, SEASONS } from "@/lib/schema";

export default function ItemPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<ClosetItem | null | undefined>(undefined);

  useEffect(() => {
    if (!params?.id) return;
    getItem(params.id).then((i) => setItem(i ?? null));
  }, [params?.id]);

  if (item === undefined) return <main className="p-6 text-sm text-ink/60">Loading…</main>;
  if (item === null) return <main className="p-6 text-sm">Not found.</main>;

  function set<K extends keyof ClosetItem>(key: K, value: ClosetItem[K]) {
    if (!item) return;
    const next = { ...item, [key]: value };
    setItem(next);
    putItem(next);
  }

  function toggleSeason(s: (typeof SEASONS)[number]) {
    if (!item) return;
    const has = item.seasons.includes(s);
    set("seasons", has ? item.seasons.filter((x) => x !== s) : [...item.seasons, s]);
  }

  async function handleDelete() {
    if (!item) return;
    if (!confirm("Remove this piece from your closet?")) return;
    await deleteItem(item.id);
    router.push("/");
  }

  return (
    <main className="mx-auto max-w-md px-4 pb-32 pt-6">
      <header className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-sm text-ink/60">
          ← Closet
        </Link>
        <h1 className="font-display text-2xl capitalize">{item.subcategory}</h1>
        <button onClick={handleDelete} className="text-sm text-accent">
          Delete
        </button>
      </header>

      <div className="checker mb-5 overflow-hidden rounded-3xl">
        <img
          src={item.imageDataUrl}
          alt={item.subcategory}
          className="mx-auto aspect-square max-w-sm object-contain"
        />
      </div>

      <section className="space-y-4">
        <Row label="Type">
          <input
            className="input"
            value={item.subcategory}
            onChange={(e) => set("subcategory", e.target.value)}
          />
        </Row>

        <Row label="Category">
          <select
            className="input"
            value={item.category}
            onChange={(e) => set("category", e.target.value as ClosetItem["category"])}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Row>

        <Row label="Availability">
          <select
            className="input"
            value={item.availability}
            onChange={(e) => set("availability", e.target.value as Availability)}
          >
            {AVAILABILITY.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </Row>

        <Row label="Colors">
          <input
            className="input"
            value={item.colors.join(", ")}
            onChange={(e) =>
              set(
                "colors",
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
          />
        </Row>

        <Row label="Brand">
          <input
            className="input"
            value={item.brand ?? ""}
            onChange={(e) => set("brand", e.target.value || null)}
          />
        </Row>

        <Row label="Size">
          <input
            className="input"
            value={item.size ?? ""}
            onChange={(e) => set("size", e.target.value || null)}
          />
        </Row>

        <Row label={`Formality ${item.formality}/5`}>
          <input
            type="range"
            min={1}
            max={5}
            value={item.formality}
            onChange={(e) => set("formality", Number(e.target.value) as ClosetItem["formality"])}
            className="w-full"
          />
        </Row>

        <Row label={`Warmth ${item.warmth}/5`}>
          <input
            type="range"
            min={1}
            max={5}
            value={item.warmth}
            onChange={(e) => set("warmth", Number(e.target.value) as ClosetItem["warmth"])}
            className="w-full"
          />
        </Row>

        <Row label="Seasons">
          <div className="flex flex-wrap gap-2">
            {SEASONS.map((s) => (
              <button
                key={s}
                onClick={() => toggleSeason(s)}
                className={`rounded-full border px-3 py-1 text-xs capitalize ${
                  item.seasons.includes(s) ? "border-ink bg-ink text-cream" : "border-ink/20"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </Row>

        <Row label="Notes">
          <textarea
            className="input min-h-[80px]"
            value={item.notes ?? ""}
            onChange={(e) => set("notes", e.target.value || null)}
          />
        </Row>
      </section>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(0, 0, 0, 0.12);
          padding: 10px 12px;
          font-size: 14px;
        }
      `}</style>
    </main>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-wide text-ink/60">{label}</span>
      {children}
    </label>
  );
}
