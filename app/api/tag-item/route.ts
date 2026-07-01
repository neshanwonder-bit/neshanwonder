import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { TAGS_JSON_SCHEMA, TagsSchema } from "@/lib/schema";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const client = new Anthropic();

const BodySchema = z.object({
  imageBase64: z.string(),
  mediaType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
});

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const response = await client.messages.create({
    model: "claude-opus-4-8",
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
