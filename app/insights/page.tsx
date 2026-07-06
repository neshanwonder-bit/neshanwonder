"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getAllItems } from "@/lib/db";
import type { ClosetItem } from "@/lib/schema";
import { computeInsights, type Insights } from "@/lib/insights";
import { colorToHex, isLight } from "@/lib/colors";
import { seasonLabel } from "@/lib/season";

const FORMALITY_LABELS = ["Athletic", "Casual", "Smart", "Dressy", "Formal"];
const WARMTH_LABELS = ["Hot", "Warm", "Mild", "Cool", "Cold"];

export default function InsightsPage() {
  const [items, setItems] = useState<ClosetItem[] | null>(null);

  useEffect(() => {
    getAllItems().then(setItems);
  }, []);

  const insights = useMemo(() => (items ? computeInsights(items) : null), [items]);

  return (
    <main className="mx-auto max-w-md px-4 pb-24 pt-6">
      <header className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-sm text-ink/60">
          ← Closet
        </Link>
        <h1 className="font-display text-2xl">Insights</h1>
        <span className="w-12" />
      </header>

      {items === null ? (
        <p className="text-sm text-ink/60">Reading your closet…</p>
      ) : insights === null || insights.active === 0 ? (
        <EmptyState hasDonated={insights !== null && insights.total > 0} />
      ) : (
        <Body insights={insights} />
      )}
    </main>
  );
}

function Body({ insights }: { insights: Insights }) {
  const maxCat = Math.max(1, ...insights.byCategory.map((c) => c.count));
  const maxSeason = Math.max(1, ...insights.seasonCoverage.map((s) => s.count));
  const topColors = insights.colors.slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <Stat value={insights.active} label="in rotation" />
        <Stat value={insights.byCategory.filter((c) => c.count > 0).length} label="categories" />
        <Stat
          value={insights.avgFormality ? insights.avgFormality.toFixed(1) : "–"}
          label="avg formality"
        />
      </div>

      {insights.observations.length > 0 && (
        <Card title="What stands out">
          <ul className="space-y-2">
            {insights.observations.map((o, i) => (
              <li key={i} className="flex gap-2 text-sm text-ink/80">
                <span className="text-accent">•</span>
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card title="By category">
        <div className="space-y-2">
          {insights.byCategory.map((c) => (
            <BarRow key={c.key} label={c.key} count={c.count} max={maxCat} />
          ))}
        </div>
      </Card>

      {topColors.length > 0 && (
        <Card title="Palette">
          <div className="flex flex-wrap gap-2">
            {topColors.map((c) => {
              const hex = colorToHex(c.name);
              return (
                <div
                  key={c.name}
                  className="flex items-center gap-2 rounded-full bg-white/60 py-1 pl-1 pr-3"
                >
                  <span
                    className="h-6 w-6 rounded-full"
                    style={{
                      background: hex,
                      boxShadow: isLight(hex) ? "inset 0 0 0 1px rgba(0,0,0,0.15)" : undefined,
                    }}
                  />
                  <span className="text-xs capitalize text-ink/80">{c.name}</span>
                  <span className="text-xs text-ink/40">{c.count}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card title="Formality spread">
        <Histogram counts={insights.formality} labels={FORMALITY_LABELS} />
      </Card>

      <Card title="Warmth spread">
        <Histogram counts={insights.warmth} labels={WARMTH_LABELS} />
      </Card>

      <Card title="Season coverage">
        <div className="grid grid-cols-4 gap-2">
          {insights.seasonCoverage.map((s) => (
            <div key={s.key} className="rounded-xl bg-white/60 p-2 text-center">
              <div className="font-display text-xl">{s.count}</div>
              <div className="text-[11px] uppercase tracking-wide text-ink/50">
                {seasonLabel(s.key)}
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-ink/10">
                <div
                  className="h-full bg-accent/70"
                  style={{ width: `${(s.count / maxSeason) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {insights.brands.length > 0 && (
        <Card title="Top brands">
          <div className="flex flex-wrap gap-1.5">
            {insights.brands.slice(0, 10).map((b) => (
              <span
                key={b.name}
                className="rounded-full border border-ink/15 px-3 py-1 text-xs text-ink/70"
              >
                {b.name} <span className="text-ink/40">{b.count}</span>
              </span>
            ))}
          </div>
        </Card>
      )}

      {insights.byAvailability.some((a) => a.key !== "clean") && (
        <Card title="Right now">
          <div className="flex flex-wrap gap-2">
            {insights.byAvailability.map((a) => (
              <span
                key={a.key}
                className="rounded-full bg-white/60 px-3 py-1 text-xs capitalize text-ink/70"
              >
                {a.key}: <span className="font-medium text-ink">{a.count}</span>
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-2xl bg-white/60 px-3 py-4 text-center shadow-sm">
      <div className="font-display text-3xl leading-none">{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-wide text-ink/50">{label}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink/50">{title}</h2>
      <div className="rounded-3xl bg-white/40 p-4">{children}</div>
    </section>
  );
}

function BarRow({ label, count, max }: { label: string; count: number; max: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 flex-shrink-0 text-xs capitalize text-ink/70">{label}</span>
      <div className="h-4 flex-1 overflow-hidden rounded-full bg-ink/5">
        <div
          className="h-full rounded-full bg-ink/70"
          style={{ width: count ? `${Math.max(6, (count / max) * 100)}%` : "0%" }}
        />
      </div>
      <span className="w-5 flex-shrink-0 text-right text-xs tabular-nums text-ink/50">{count}</span>
    </div>
  );
}

function Histogram({ counts, labels }: { counts: number[]; labels: string[] }) {
  const max = Math.max(1, ...counts);
  return (
    <div className="flex items-end justify-between gap-2" style={{ height: 96 }}>
      {counts.map((c, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[11px] tabular-nums text-ink/50">{c || ""}</span>
          <div className="flex w-full flex-1 items-end">
            <div
              className="w-full rounded-t-md bg-accent/60"
              style={{ height: `${(c / max) * 100}%`, minHeight: c ? 4 : 0 }}
            />
          </div>
          <span className="text-[10px] leading-tight text-ink/50">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasDonated }: { hasDonated: boolean }) {
  return (
    <div className="rounded-3xl border border-dashed border-ink/20 p-8 text-center">
      <p className="font-display text-xl">No insights yet.</p>
      <p className="mt-2 text-sm text-ink/60">
        {hasDonated
          ? "Every piece is donated or lost. Add pieces you still own to see your wardrobe breakdown."
          : "Add a few pieces and this page fills with your wardrobe breakdown — categories, palette, season coverage and gaps."}
      </p>
      <Link
        href="/add"
        className="mt-4 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-cream"
      >
        + Add a piece
      </Link>
    </div>
  );
}
