import type { Availability, Category, ClosetItem, Season } from "./schema";
import { CATEGORIES, SEASONS } from "./schema";

export interface Insights {
  total: number;
  active: number; // pieces still in rotation (not donated/lost)
  byCategory: { key: Category; count: number }[];
  byAvailability: { key: Availability; count: number }[];
  colors: { name: string; count: number }[];
  formality: number[]; // index 0 => level 1 … index 4 => level 5
  warmth: number[];
  seasonCoverage: { key: Season; count: number }[];
  brands: { name: string; count: number }[];
  avgFormality: number | null;
  observations: string[];
}

function tally<T extends string>(values: T[]): Map<T, number> {
  const m = new Map<T, number>();
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
  return m;
}

export function computeInsights(items: ClosetItem[]): Insights {
  const active = items.filter((i) => i.availability !== "donated" && i.availability !== "lost");

  const catTally = tally(active.map((i) => i.category));
  const byCategory = CATEGORIES.map((key) => ({ key, count: catTally.get(key) ?? 0 })).sort(
    (a, b) => b.count - a.count,
  );

  const availTally = tally(items.map((i) => i.availability));
  const byAvailability = [...availTally.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);

  const colorTally = tally(active.flatMap((i) => i.colors.map((c) => c.trim().toLowerCase())));
  const colors = [...colorTally.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const formality = [0, 0, 0, 0, 0];
  const warmth = [0, 0, 0, 0, 0];
  for (const i of active) {
    if (i.formality >= 1 && i.formality <= 5) formality[i.formality - 1]++;
    if (i.warmth >= 1 && i.warmth <= 5) warmth[i.warmth - 1]++;
  }

  const seasonTally = tally(active.flatMap((i) => i.seasons));
  const seasonCoverage = SEASONS.map((key) => ({ key, count: seasonTally.get(key) ?? 0 }));

  const brandTally = tally(
    active.map((i) => i.brand?.trim()).filter((b): b is string => !!b),
  );
  const brands = [...brandTally.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const avgFormality = active.length
    ? active.reduce((s, i) => s + i.formality, 0) / active.length
    : null;

  return {
    total: items.length,
    active: active.length,
    byCategory,
    byAvailability,
    colors,
    formality,
    warmth,
    seasonCoverage,
    brands,
    avgFormality,
    observations: buildObservations(active, byCategory, seasonCoverage, colors),
  };
}

function buildObservations(
  active: ClosetItem[],
  byCategory: { key: Category; count: number }[],
  seasonCoverage: { key: Season; count: number }[],
  colors: { name: string; count: number }[],
): string[] {
  const out: string[] = [];
  if (active.length === 0) return out;

  // Missing staples.
  const missing = byCategory.filter((c) => c.count === 0).map((c) => c.key);
  if (missing.includes("shoes")) out.push("No shoes tagged yet — outfits will feel unfinished.");
  const otherMissing = missing.filter((m) => m !== "shoes");
  if (otherMissing.length) {
    out.push(`Nothing in your closet for: ${otherMissing.join(", ")}.`);
  }

  // Top vs bottom balance.
  const tops = byCategory.find((c) => c.key === "top")?.count ?? 0;
  const bottoms = byCategory.find((c) => c.key === "bottom")?.count ?? 0;
  if (bottoms > 0 && tops / bottoms >= 3) {
    out.push(`You have ${tops} tops but only ${bottoms} bottoms — a mismatched ratio.`);
  } else if (tops > 0 && bottoms === 0) {
    out.push("Tops but no bottoms — add some to unlock outfit suggestions.");
  }

  // Weakest season.
  const weakest = [...seasonCoverage].sort((a, b) => a.count - b.count)[0];
  const strongest = [...seasonCoverage].sort((a, b) => b.count - a.count)[0];
  if (weakest && strongest && strongest.count > 0 && weakest.count <= strongest.count / 2) {
    out.push(`${cap(weakest.key)} is your thinnest season (${weakest.count} pieces).`);
  }

  // Dominant color.
  if (colors[0] && active.length >= 4 && colors[0].count >= Math.ceil(active.length * 0.4)) {
    out.push(`${cap(colors[0].name)} dominates your palette — ${colors[0].count} pieces.`);
  }

  return out;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
