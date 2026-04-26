import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { requireTeamAccess } from "@/lib/permissions";
import { postGroupMeMessage } from "@/lib/groupme";
import { formatReminder } from "@/lib/reminders";
export async function POST(_: Request, { params }: { params: Promise<{ teamId: string }> }) { const { teamId } = await params; const { supabase, user } = await requireUser(); const { team } = await requireTeamAccess(supabase, user.id, teamId); const { data: game } = await supabase.from("games").select("*").eq("team_id", teamId).eq("is_active", true).maybeSingle(); if (game) { const { data: connections } = await supabase.from("groupme_connections").select("*").eq("team_id", teamId).eq("is_active", true); for (const c of connections || []) if (c.bot_id) await postGroupMeMessage(c.bot_id, formatReminder(game, "manual")); await supabase.from("reminder_logs").insert({ organization_id:team.organization_id, team_id:teamId, game_id:game.id, reminder_type:"manual", status:"sent", payload:{} }); } redirect(`/app/team/${teamId}/reminders`); }
