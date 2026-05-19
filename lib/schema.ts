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
