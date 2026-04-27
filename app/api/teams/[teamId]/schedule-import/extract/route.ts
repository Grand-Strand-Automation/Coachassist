import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { requireTeamAccess } from "@/lib/permissions";

const MAX_FILE_SIZE = 8 * 1024 * 1024;

const extractedSchema = z.object({
  games: z.array(
    z.object({
      opponent: z.string().default(""),
      game_date: z.string().default(""),
      game_time: z.string().default(""),
      location_name: z.string().default(""),
      home_or_away: z.string().default(""),
      uniform: z.string().default(""),
      additional_notes: z.string().default(""),
    }),
  ),
});

export async function POST(request: Request, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "Schedule photo reading is not configured yet." }, { status: 500 });
    const { teamId } = await params;
    const { supabase, user } = await requireUser();
    await requireTeamAccess(supabase, user.id, teamId);

    const form = await request.formData();
    const file = form.get("file");
    const sourceType = String(form.get("sourceType") || "");
    if (!(file instanceof File)) return NextResponse.json({ error: "Please upload a file." }, { status: 400 });
    if (!["photo", "screenshot"].includes(sourceType)) return NextResponse.json({ error: "Invalid import type." }, { status: 400 });
    if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Please upload a PNG, JPG, or WEBP image." }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "File is too large. Max size is 8MB." }, { status: 400 });

    const bytes = Buffer.from(await file.arrayBuffer());
    const dataUrl = `data:${file.type};base64,${bytes.toString("base64")}`;
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      input: [
        {
          role: "system",
          content:
            "Extract youth sports schedule rows from this image. Return only confident values. Do not invent unknown fields. Use empty strings for unreadable fields.",
        },
        {
          role: "user",
          content: [
            { type: "input_text", text: "Extract games into JSON array fields: opponent, game_date, game_time, location_name, home_or_away, uniform, additional_notes." },
            { type: "input_image", image_url: dataUrl, detail: "auto" },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "schedule_games",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["games"],
            properties: {
              games: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["opponent", "game_date", "game_time", "location_name", "home_or_away", "uniform", "additional_notes"],
                  properties: {
                    opponent: { type: "string" },
                    game_date: { type: "string" },
                    game_time: { type: "string" },
                    location_name: { type: "string" },
                    home_or_away: { type: "string" },
                    uniform: { type: "string" },
                    additional_notes: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    });
    const parsed = extractedSchema.safeParse(JSON.parse(response.output_text || "{}"));
    if (!parsed.success) return NextResponse.json({ games: [] });
    return NextResponse.json({ games: parsed.data.games.filter((g) => Object.values(g).some((v) => String(v).trim().length > 0)) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not read this image." }, { status: 500 });
  }
}
