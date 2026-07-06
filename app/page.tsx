"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllItems } from "@/lib/db";
import type { ClosetItem, Category } from "@/lib/schema";
import { CATEGORIES } from "@/lib/schema";

export default function HomePage() {
  const [items, setItems] = useState<ClosetItem[] | null>(null);
  const [filter, setFilter] = useState<Category | "all">("all");

  useEffect(() => {
    getAllItems().then(setItems);
  }, []);

  const filtered = items?.filter((i) => filter === "all" || i.category === filter) ?? [];

  return (
    <main className="mx-auto max-w-md px-4 pb-32 pt-6">
      <header className="mb-6 flex items-baseline justify-between">
        <h1 className="font-display text-3xl">neshanwonder</h1>
        <span className="text-xs text-ink/60">{items?.length ?? "·"} pieces</span>
      </header>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        <FilterPill active={filter === "all"} onClick={() => setFilter("all")}>
          All
        </FilterPill>
        {CATEGORIES.map((c) => (
          <FilterPill key={c} active={filter === c} onClick={() => setFilter(c)}>
            {c}
          </FilterPill>
        ))}
      </div>

      {items === null ? (
        <p className="text-sm text-ink/60">Loading closet…</p>
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((item) => (
            <Link
              key={item.id}
              href={`/item/${item.id}`}
              className="group flex flex-col rounded-2xl bg-white/60 p-2 shadow-sm transition hover:shadow"
            >
              <div className="checker aspect-square overflow-hidden rounded-xl">
                <img
                  src={item.imageDataUrl}
                  alt={item.subcategory}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="px-1 pt-2 pb-1">
                <p className="truncate text-sm font-medium capitalize">{item.subcategory}</p>
                <p className="text-xs text-ink/60 capitalize">{item.colors.slice(0, 2).join(" / ")}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-ink/10 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-around px-4 py-3">
          <NavLink href="/">Closet</NavLink>
          <NavLink href="/insights">Insights</NavLink>
          <Link
            href="/add"
            className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-cream shadow-lg"
          >
            + Add
          </Link>
          <NavLink href="/outfit">Outfit</NavLink>
        </div>
      </nav>
    </main>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 rounded-full border px-3 py-1 text-xs capitalize transition ${
        active ? "border-ink bg-ink text-cream" : "border-ink/20 text-ink/70"
      }`}
    >
      {children}
    </button>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm text-ink/70 hover:text-ink">
      {children}
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-ink/20 p-8 text-center">
      <p className="font-display text-xl">Your closet is empty.</p>
      <p className="mt-2 text-sm text-ink/60">Tap + Add to photograph your first piece.</p>
    </div>
  );
}
