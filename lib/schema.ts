import { z } from "zod";

export const CATEGORIES = [
  "top",
  "bottom",
  "outerwear",
  "dress",
  "shoes",
  "bag",
  "accessory",
] as const;

export const PATTERNS = ["solid", "striped", "plaid", "graphic", "floral", "other"] as const;
export const FITS = ["fitted", "regular", "loose", "oversized"] as const;
export const SEASONS = ["spring", "summer", "fall", "winter"] as const;

export type Season = (typeof SEASONS)[number];
export type Category = (typeof CATEGORIES)[number];

export const TagsSchema = z.object({
  category: z.enum(CATEGORIES).describe("The primary category of the garment"),
  subcategory: z
    .string()
    .describe("Specific item type, e.g. 'hoodie', 'oxford shirt', 'mom jeans', 'chelsea boots'"),
  colors: z
    .array(z.string())
    .describe("1 to 4 dominant colors as plain names, e.g. 'navy', 'cream', 'rust'"),
  pattern: z.enum(PATTERNS),
  fit: z.enum(FITS).nullable().describe("Use null if not clearly visible"),
  material: z.string().nullable().describe("Likely material if obvious, otherwise null"),
  formality: z
    .number()
    .int()
    .min(1)
    .max(5)
    .describe("1 = athletic/loungewear, 3 = casual/everyday, 5 = formal/black-tie"),
  warmth: z
    .number()
    .int()
    .min(1)
    .max(5)
    .describe("1 = very hot weather (tank, shorts), 5 = very cold weather (heavy coat)"),
  seasons: z
    .array(z.enum(SEASONS))
    .describe("Seasons this item is appropriate for, can be multiple"),
});

export type Tags = z.infer<typeof TagsSchema>;

// API-facing JSON Schema for structured output on the tag-item route. Kept here
// beside TagsSchema (not inline in the route) so the two are visibly paired.
// Enum values reuse the shared const arrays, and the compile-time guard below
// fails `tsc` if this schema's field set ever drifts from TagsSchema — so the
// "update both or validation breaks" hazard can no longer ship silently.
export const TAGS_JSON_SCHEMA = {
  type: "object",
  properties: {
    category: { type: "string", enum: [...CATEGORIES] },
    subcategory: { type: "string", description: "Specific item type, e.g. 'hoodie', 'mom jeans'" },
    colors: { type: "array", items: { type: "string" }, description: "1-4 specific color names" },
    pattern: { type: "string", enum: [...PATTERNS] },
    fit: { anyOf: [{ type: "string", enum: [...FITS] }, { type: "null" }] },
    material: { anyOf: [{ type: "string" }, { type: "null" }] },
    formality: { type: "integer", description: "1=athletic, 3=casual, 5=formal" },
    warmth: { type: "integer", description: "1=tank-top weather, 5=heavy-coat weather" },
    seasons: { type: "array", items: { type: "string", enum: [...SEASONS] } },
  },
  required: [
    "category",
    "subcategory",
    "colors",
    "pattern",
    "fit",
    "material",
    "formality",
    "warmth",
    "seasons",
  ],
  additionalProperties: false,
} as const;

// `true` only when A and B are the same set of keys; otherwise resolves to
// `never`, turning the `= true` assignment into a compile error.
type ExactKeys<A extends PropertyKey, B extends PropertyKey> = [A] extends [B]
  ? [B] extends [A]
    ? true
    : never
  : never;

// Guard 1: JSON-schema properties must be exactly the Tags fields.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _tagsSchemaInSync: ExactKeys<
  keyof Tags,
  keyof (typeof TAGS_JSON_SCHEMA)["properties"]
> = true;
// Guard 2: every Tags field must be listed in `required`.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _tagsRequiredComplete: ExactKeys<
  keyof Tags,
  (typeof TAGS_JSON_SCHEMA)["required"][number]
> = true;

export const AVAILABILITY = ["clean", "laundry", "at-cleaner", "donated", "lost"] as const;
export type Availability = (typeof AVAILABILITY)[number];

export interface ClosetItem extends Tags {
  id: string;
  imageDataUrl: string;
  originalImageDataUrl: string;
  brand: string | null;
  size: string | null;
  notes: string | null;
  availability: Availability;
  createdAt: number;
}

export const OutfitSchema = z.object({
  outfits: z
    .array(
      z.object({
        item_ids: z.array(z.string()).describe("IDs of items from the closet that form this outfit"),
        rationale: z
          .string()
          .describe("One short sentence on why this combo works for the occasion"),
      }),
    )
    .min(1)
    .max(5),
});

export type OutfitResponse = z.infer<typeof OutfitSchema>;

// API-facing JSON Schema for structured output on the suggest-outfit route,
// paired with OutfitSchema. The compile-time guard below fails `tsc` if the
// per-outfit field set drifts from OutfitSchema's inner object.
export const OUTFIT_JSON_SCHEMA = {
  type: "object",
  properties: {
    outfits: {
      type: "array",
      items: {
        type: "object",
        properties: {
          item_ids: { type: "array", items: { type: "string" } },
          rationale: { type: "string" },
        },
        required: ["item_ids", "rationale"],
        additionalProperties: false,
      },
    },
  },
  required: ["outfits"],
  additionalProperties: false,
} as const;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _outfitSchemaInSync: ExactKeys<
  keyof OutfitResponse["outfits"][number],
  keyof (typeof OUTFIT_JSON_SCHEMA)["properties"]["outfits"]["items"]["properties"]
> = true;
