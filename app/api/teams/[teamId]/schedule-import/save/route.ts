import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { requireTeamAccess } from "@/lib/permissions";

const gameInput = z.object({
  opponent: z.string().optional().default(""),
  game_date: z.string().optional().default(""),
  game_time: z.string().optional().default(""),
  location_name: z.string().optional().default(""),
  home_or_away: z.string().optional().default(""),
  uniform: z.string().optional().default(""),
  additional_notes: z.string().optional().default(""),
});

const schema = z.object({
  sourceType: z.enum(["photo", "screenshot", "spreadsheet"]),
  games: z.array(gameInput).max(200),
});

function safeDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().slice(0, 10);
  return parsed.toISOString().slice(0, 10);
}

export async function POST(request: Request, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await params;
    const { supabase, user } = await requireUser();
    const { team } = await requireTeamAccess(supabase, user.id, teamId);
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid schedule data." }, { status: 400 });

    const games = parsed.data.games.filter((row) => Object.values(row).some((value) => String(value || "").trim().length > 0));
    if (!games.length) return NextResponse.json({ error: "No games to save." }, { status: 400 });

    const { data: activeGame } = await supabase.from("games").select("id").eq("team_id", teamId).eq("is_active", true).maybeSingle();
    const importBatchId = randomUUID();
    const rows = games.map((row, idx) => ({
      organization_id: team.organization_id,
      team_id: teamId,
      created_by: user.id,
      status: "scheduled",
      is_active: !activeGame && idx === 0,
      source_type: parsed.data.sourceType,
      imported_at: new Date().toISOString(),
      import_batch_id: importBatchId,
      opponent: row.opponent || "TBD",
      game_date: safeDate(row.game_date || ""),
      game_time: row.game_time || null,
      location_name: row.location_name || null,
      home_or_away: row.home_or_away || null,
      uniform: row.uniform || null,
      additional_notes: row.additional_notes || null,
    }));
    const { error } = await supabase.from("games").insert(rows);
    if (error) throw error;
    return NextResponse.json({ ok: true, count: rows.length });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save schedule." }, { status: 500 });
  }
}
