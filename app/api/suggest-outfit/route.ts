import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { OutfitSchema, SEASONS } from "@/lib/schema";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const client = new Anthropic();

const ItemSummarySchema = z.object({
  id: z.string(),
  category: z.string(),
  subcategory: z.string(),
  colors: z.array(z.string()),
  pattern: z.string(),
  fit: z.string().nullable(),
  formality: z.number(),
  warmth: z.number(),
  seasons: z.array(z.enum(SEASONS)),
});

const BodySchema = z.object({
  occasion: z.string().min(1).max(280),
  season: z.enum(SEASONS),
  items: z.array(ItemSummarySchema).min(2),
});

const OUTFIT_JSON_SCHEMA = {
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

export async function POST(req: Request) {
  let body;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const { occasion, season, items } = body;

  const prompt = `You are a personal stylist. The user has the wardrobe below and needs outfit ideas.

Occasion: ${occasion}
Current season: ${season}

Wardrobe (JSON array of items, each with an id):
${JSON.stringify(items, null, 2)}

Pick 3 distinct outfits from THIS wardrobe only. Each outfit must:
- Use only item ids that appear in the wardrobe above.
- Include either (a) one top + one bottom or (b) a dress; plus shoes if any are available.
- Optionally add outerwear, bag, or one accessory.
- Be appropriate for the occasion and weather of ${season}.
- Coordinate on color palette and formality.
- Be visibly different from one another.

Return JSON only.`;

  const response = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 2048,
    output_config: {
      format: { type: "json_schema", schema: OUTFIT_JSON_SCHEMA as Record<string, unknown> },
    },
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return NextResponse.json({ error: "no text in response" }, { status: 502 });
  }

  let parsed;
  try {
    const raw = JSON.parse(textBlock.text);
    parsed = OutfitSchema.parse(raw);
  } catch (err) {
    return NextResponse.json({ error: "invalid outfits", raw: textBlock.text }, { status: 502 });
  }

  const validIds = new Set(items.map((i) => i.id));
  const filtered = {
    outfits: parsed.outfits
      .map((o) => ({ ...o, item_ids: o.item_ids.filter((id) => validIds.has(id)) }))
      .filter((o) => o.item_ids.length >= 2),
  };

  return NextResponse.json(filtered);
}
