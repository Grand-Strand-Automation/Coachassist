"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { requireTeamAccess } from "@/lib/permissions";
import { createGroupMeBot } from "@/lib/groupme";
import { createAdminClient } from "@/lib/supabase/admin";
import { appUrl } from "@/lib/utils";
import { isWithinLimit } from "@/lib/billing";
import { bootstrapOrganization } from "@/lib/data";
import { encryptSecret } from "@/lib/crypto";

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
}

function messageParam(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  return encodeURIComponent(message.slice(0, 180));
}

export async function signOut() {
  const { supabase } = await requireUser();
  await supabase.auth.signOut();
  redirect("/");
}

const onboardingSchema = z.object({
  organizationName: z.string().min(2),
  teamName: z.string().min(2),
  ageGroup: z.string().optional(),
  season: z.string().optional(),
});

export async function createOrganization(formData: FormData) {
  try {
    const { user } = await requireUser();
    const input = onboardingSchema.parse(Object.fromEntries(formData));
    const slug = `${slugify(input.organizationName)}-${crypto.randomUUID().slice(0, 6)}`;
    const admin = createAdminClient();
    await bootstrapOrganization(admin, {
      organizationName: input.organizationName,
      slug,
      ownerUserId: user.id,
      teamName: input.teamName,
      ageGroup: input.ageGroup || null,
      season: input.season || null,
    });
    redirect("/app?onboarding=success");
  } catch (error) {
    redirect(`/app?onboarding=error&message=${messageParam(error)}`);
  }
}

const gameSchema = z.object({
  opponent: z.string().min(1),
  game_date: z.string().min(1),
  game_time: z.string().optional(),
  arrival_time: z.string().optional(),
  location_name: z.string().optional(),
  location_address: z.string().optional(),
  google_maps_url: z.string().optional(),
  home_or_away: z.string().optional(),
  uniform: z.string().optional(),
  what_to_bring: z.string().optional(),
  parking_notes: z.string().optional(),
  additional_notes: z.string().optional(),
  status: z.string().optional(),
});

export async function saveGame(teamId: string, formData: FormData) {
  const redirectBase = `/app/team/${teamId}/game`;
  try {
    const { supabase, user } = await requireUser();
    const { team } = await requireTeamAccess(supabase, user.id, teamId);
    const input = gameSchema.parse(Object.fromEntries(formData));
    // Enforce a single active game per team by deactivating existing rows first.
    await supabase.from("games").update({ is_active: false }).eq("team_id", teamId).eq("is_active", true);
    const { error } = await supabase.from("games").insert({
      organization_id: team.organization_id,
      team_id: teamId,
      created_by: user.id,
      source_type: "manual",
      status: input.status || "scheduled",
      is_active: true,
      ...input,
    });
    if (error) throw error;
    revalidatePath(redirectBase);
    revalidatePath("/app");
    redirect(`${redirectBase}?status=saved` as never);
  } catch (error) {
    redirect(`${redirectBase}?status=error&message=${messageParam(error)}` as never);
  }
}

const faqSchema = z.object({ keyword: z.string().optional(), question: z.string().min(2), answer: z.string().min(2) });

export async function addFaq(teamId: string, formData: FormData) {
  const { supabase, user } = await requireUser();
  const { team } = await requireTeamAccess(supabase, user.id, teamId);
  const input = faqSchema.parse(Object.fromEntries(formData));
  const { data: org } = await supabase.from("organizations").select("plan").eq("id", team.organization_id).single();
  const { count } = await supabase.from("faqs").select("id", { count: "exact", head: true }).eq("organization_id", team.organization_id);
  if (!isWithinLimit(org?.plan, "faqs", count || 0)) throw new Error("FAQ plan limit reached");
  await supabase.from("faqs").insert({ organization_id: team.organization_id, team_id: teamId, created_by: user.id, ...input });
  revalidatePath(`/app/team/${teamId}/faqs`);
}

export async function updateReminderRules(teamId: string, formData: FormData) {
  const { supabase, user } = await requireUser();
  const { team } = await requireTeamAccess(supabase, user.id, teamId);
  const payload = {
    enabled: formData.get("enabled") === "on",
    send_24h_before: formData.get("send_24h_before") === "on",
    send_2h_before: formData.get("send_2h_before") === "on",
  };
  await supabase.from("reminder_rules").upsert({ organization_id: team.organization_id, team_id: teamId, ...payload }, { onConflict: "team_id" });
  revalidatePath(`/app/team/${teamId}/reminders`);
  revalidatePath("/app");
}

const groupmeSchema = z.object({ accessToken: z.string().min(1), groupId: z.string().min(1), botName: z.string().optional() });

export async function connectGroupMe(teamId: string, formData: FormData) {
  const redirectBase = `/app/team/${teamId}/integrations/groupme`;
  try {
    const { supabase, user } = await requireUser();
    const { team } = await requireTeamAccess(supabase, user.id, teamId);
    const input = groupmeSchema.parse(Object.fromEntries(formData));
    const { data: org } = await supabase.from("organizations").select("plan").eq("id", team.organization_id).single();
    const { count } = await supabase.from("groupme_connections").select("id", { count: "exact", head: true }).eq("organization_id", team.organization_id).eq("is_active", true);
    if (!isWithinLimit(org?.plan, "groupmeGroups", count || 0)) throw new Error("GroupMe group plan limit reached");
    const callbackUrl = appUrl("/api/groupme/webhook");
    const botName = input.botName || process.env.GROUPME_BOT_NAME_DEFAULT || "CoachAssist Bot";
    const bot = await createGroupMeBot(input.accessToken, input.groupId, botName, callbackUrl);
    await supabase.from("groupme_connections").upsert(
      {
        organization_id: team.organization_id,
        team_id: teamId,
        group_id: input.groupId,
        bot_id: bot.bot_id,
        bot_name: botName,
        callback_url: callbackUrl,
        access_token_encrypted: encryptSecret(input.accessToken),
        is_active: true,
      },
      { onConflict: "group_id" },
    );
    revalidatePath(redirectBase);
    revalidatePath("/app");
    redirect(`${redirectBase}?status=connected` as never);
  } catch (error) {
    redirect(`${redirectBase}?status=error&message=${messageParam(error)}` as never);
  }
}
