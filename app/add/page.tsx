"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { blobToDataUrl, resizeImage } from "@/lib/bg-removal";
import { putItem } from "@/lib/db";
import type { ClosetItem, Tags } from "@/lib/schema";
import { CATEGORIES, FITS, PATTERNS, SEASONS } from "@/lib/schema";

type Stage = "idle" | "processing" | "review" | "saving";

export default function AddPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [statusMsg, setStatusMsg] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [tags, setTags] = useState<Tags | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setStage("processing");
    try {
      setStatusMsg("Resizing photo…");
      const resized = await resizeImage(file, 1280);
      const dataUrl = await blobToDataUrl(resized);
      setOriginalUrl(dataUrl);
      setImageUrl(dataUrl);

      setStatusMsg("Asking Claude what this is…");
      const tagInput = await resizeImage(resized, 1024, "image/jpeg", 0.85);
      const tagDataUrl = await blobToDataUrl(tagInput);
      const base64 = tagDataUrl.split(",")[1];
      const res = await fetch("/api/tag-item", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mediaType: "image/jpeg" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `tag api ${res.status}`);
      }
      const { tags: newTags } = (await res.json()) as { tags: Tags };
      setTags(newTags);
      setStage("review");
      setStatusMsg("");
    } catch (e) {
      setError((e as Error).message);
      setStage("idle");
    }
  }

  async function handleSave() {
    if (!tags || !imageUrl || !originalUrl) return;
    setStage("saving");
    const item: ClosetItem = {
      id: crypto.randomUUID(),
      imageDataUrl: imageUrl,
      originalImageDataUrl: originalUrl,
      ...tags,
      brand: null,
      size: null,
      notes: null,
      availability: "clean",
      createdAt: Date.now(),
    };
    await putItem(item);
    router.push("/");
  }

  return (
    <main className="mx-auto max-w-md px-4 pb-32 pt-6">
      <header className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-sm text-ink/60">
          ← Closet
        </Link>
        <h1 className="font-display text-2xl">Add piece</h1>
        <span className="w-12" />
      </header>

      {error && (
        <div className="mb-4 rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-accent">
          {error}
        </div>
      )}

      {stage === "idle" && (
        <div className="space-y-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="aspect-[3/4] w-full rounded-3xl border-2 border-dashed border-ink/30 bg-white/40 p-8 text-center transition hover:bg-white/60"
          >
            <p className="font-display text-2xl">Snap or upload</p>
            <p className="mt-2 text-sm text-ink/60">
              One garment on a plain-ish surface works best.
            </p>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>
      )}

      {stage === "processing" && (
        <div className="flex flex-col items-center gap-4 py-16">
          {imageUrl && (
            <img src={imageUrl} alt="" className="aspect-square max-w-xs rounded-2xl object-contain" />
          )}
          <div className="flex items-center gap-2 text-sm text-ink/70">
            <Spinner /> {statusMsg || "Working…"}
          </div>
        </div>
      )}

      {stage === "review" && tags && imageUrl && (
        <TagReview tags={tags} imageUrl={imageUrl} onChange={setTags} onSave={handleSave} />
      )}

      {stage === "saving" && (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      )}
    </main>
  );
}

function TagReview({
  tags,
  imageUrl,
  onChange,
  onSave,
}: {
  tags: Tags;
  imageUrl: string;
  onChange: (t: Tags) => void;
  onSave: () => void;
}) {
  function set<K extends keyof Tags>(key: K, value: Tags[K]) {
    onChange({ ...tags, [key]: value });
  }

  function toggleSeason(s: (typeof SEASONS)[number]) {
    const has = tags.seasons.includes(s);
    set("seasons", has ? tags.seasons.filter((x) => x !== s) : [...tags.seasons, s]);
  }

  return (
    <div className="space-y-4">
      <div className="checker overflow-hidden rounded-3xl">
        <img src={imageUrl} alt="" className="mx-auto aspect-square max-w-xs object-contain" />
      </div>

      <Field label="Type">
        <input
          className="input"
          value={tags.subcategory}
          onChange={(e) => set("subcategory", e.target.value)}
        />
      </Field>

      <Field label="Category">
        <SegmentedSelect
          options={CATEGORIES as unknown as string[]}
          value={tags.category}
          onChange={(v) => set("category", v as Tags["category"])}
        />
      </Field>

      <Field label="Colors (comma separated)">
        <input
          className="input"
          value={tags.colors.join(", ")}
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
      </Field>

      <Field label="Pattern">
        <SegmentedSelect
          options={PATTERNS as unknown as string[]}
          value={tags.pattern}
          onChange={(v) => set("pattern", v as Tags["pattern"])}
        />
      </Field>

      <Field label="Fit">
        <SegmentedSelect
          options={["—", ...FITS]}
          value={tags.fit ?? "—"}
          onChange={(v) => set("fit", v === "—" ? null : (v as Tags["fit"]))}
        />
      </Field>

      <Field label={`Formality: ${tags.formality}/5`}>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={tags.formality}
          onChange={(e) => set("formality", Number(e.target.value) as Tags["formality"])}
          className="w-full"
        />
      </Field>

      <Field label={`Warmth: ${tags.warmth}/5 (1 = hot weather, 5 = cold weather)`}>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={tags.warmth}
          onChange={(e) => set("warmth", Number(e.target.value) as Tags["warmth"])}
          className="w-full"
        />
      </Field>

      <Field label="Seasons">
        <div className="flex flex-wrap gap-2">
          {SEASONS.map((s) => (
            <button
              key={s}
              onClick={() => toggleSeason(s)}
              className={`rounded-full border px-3 py-1 text-xs capitalize ${
                tags.seasons.includes(s) ? "border-ink bg-ink text-cream" : "border-ink/20"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </Field>

      <button
        onClick={onSave}
        className="w-full rounded-full bg-ink py-4 text-base font-medium text-cream shadow-lg"
      >
        Save to closet
      </button>

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
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-wide text-ink/60">{label}</span>
      {children}
    </label>
  );
}

function SegmentedSelect({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`rounded-full border px-3 py-1 text-xs capitalize ${
            value === opt ? "border-ink bg-ink text-cream" : "border-ink/20 text-ink/70"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function Spinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-ink/20 border-t-ink" />
  );
}
