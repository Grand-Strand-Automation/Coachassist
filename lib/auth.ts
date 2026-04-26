import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export async function requireUser() { const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/login"); return { supabase, user }; }
export async function getPrimaryMembership() { const { supabase, user } = await requireUser(); const { data: member } = await supabase.from("organization_members").select("*").eq("user_id", user.id).limit(1).maybeSingle(); const { data: organization } = member ? await supabase.from("organizations").select("*").eq("id", member.organization_id).maybeSingle() : { data: null }; return { supabase, user, membership: member, organization }; }
