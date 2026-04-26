import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
export type OrgRole = "owner" | "admin" | "coach";
export function canManageSettings(role?: OrgRole | null) { return role === "owner" || role === "admin"; }
export async function requireTeamAccess(supabase: SupabaseClient<Database>, userId: string, teamId: string) { const { data: team, error } = await supabase.from("teams").select("*").eq("id", teamId).single(); if (error || !team) throw new Error("Team not found or access denied"); const { data: member } = await supabase.from("organization_members").select("role").eq("organization_id", team.organization_id).eq("user_id", userId).maybeSingle(); if (!member) throw new Error("Access denied"); return { team, role: member.role }; }
