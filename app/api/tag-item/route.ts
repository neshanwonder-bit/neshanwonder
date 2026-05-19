import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { CATEGORIES, FITS, PATTERNS, SEASONS, TagsSchema } from "@/lib/schema";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const client = new Anthropic();

const BodySchema = z.object({
  imageBase64: z.string(),
  mediaType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
});

const TAGS_JSON_SCHEMA = {
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

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const response = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 1024,
    output_config: {
      format: { type: "json_schema", schema: TAGS_JSON_SCHEMA as Record<string, unknown> },
    },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: parsed.mediaType,
              data: parsed.imageBase64,
            },
          },
          {
            type: "text",
            text: "Tag this single garment for a personal wardrobe app. Be honest about uncertainty (null for fit/material when unclear). Color names should be specific and intuitive (e.g. 'rust', 'forest', 'cream' over 'red', 'green', 'white').",
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return NextResponse.json({ error: "no text in response" }, { status: 502 });
  }
  try {
    const raw = JSON.parse(textBlock.text);
    const tags = TagsSchema.parse(raw);
    return NextResponse.json({ tags });
  } catch (err) {
    return NextResponse.json(
      { error: "invalid tags from model", raw: textBlock.text },
      { status: 502 },
    );
  }
}
