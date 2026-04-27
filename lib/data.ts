import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type OnboardingInput = {
  organizationName: string;
  slug: string;
  ownerUserId: string;
  teamName: string;
  ageGroup?: string | null;
  season?: string | null;
};

export async function bootstrapOrganization(
  supabase: SupabaseClient<Database>,
  input: OnboardingInput,
) {
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: input.organizationName,
      slug: input.slug,
      owner_user_id: input.ownerUserId,
    })
    .select()
    .single();
  if (orgError) throw orgError;

  try {
    const { error: memberError } = await supabase.from("organization_members").insert({
      organization_id: org.id,
      user_id: input.ownerUserId,
      role: "owner",
    });
    if (memberError) throw memberError;

    const { data: team, error: teamError } = await supabase
      .from("teams")
      .insert({
        organization_id: org.id,
        name: input.teamName,
        age_group: input.ageGroup || null,
        season: input.season || null,
      })
      .select()
      .single();
    if (teamError) throw teamError;

    const { error: ruleError } = await supabase.from("reminder_rules").insert({
      organization_id: org.id,
      team_id: team.id,
    });
    if (ruleError) throw ruleError;

    return { organization: org, team };
  } catch (error) {
    await supabase.from("organizations").delete().eq("id", org.id);
    throw error;
  }
}

export async function getActiveGameForTeam(
  supabase: SupabaseClient<Database>,
  teamId: string,
) {
  const { data } = await supabase
    .from("games")
    .select("*")
    .eq("team_id", teamId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}
