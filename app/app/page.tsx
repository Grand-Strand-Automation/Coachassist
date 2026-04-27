import Link from "next/link";
import { Card, EmptyState, Field, Button, Badge } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { createOrganization } from "@/lib/actions";
import { PageHeader } from "@/components/page-header";
export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ onboarding?: string; message?: string }>;
}) {
  const params = (await searchParams) || {};
  const { supabase, user } = await requireUser();
  const { data: memberships } = await supabase.from("organization_members").select("*").eq("user_id", user.id);
  if (!memberships?.length) return <Onboarding status={params.onboarding} message={params.message} />;

  const { data: org } = await supabase.from("organizations").select("*").eq("id", memberships[0].organization_id).single();
  if (!org) return <Onboarding status={params.onboarding} message={params.message} />;

  const [{ data: teams }, { data: connections }, { data: activeGames }, { data: reminderRules }, { data: recentLogs }] = await Promise.all([
    supabase.from("teams").select("*").eq("organization_id", org.id).eq("is_active", true).order("created_at"),
    supabase.from("groupme_connections").select("team_id").eq("organization_id", org.id).eq("is_active", true),
    supabase.from("games").select("team_id").eq("organization_id", org.id).eq("is_active", true),
    supabase.from("reminder_rules").select("team_id,enabled").eq("organization_id", org.id),
    supabase
      .from("message_logs")
      .select("team_id,created_at")
      .eq("organization_id", org.id)
      .order("created_at", { ascending: false })
      .limit(25),
  ]);

  const connected = new Set((connections || []).map((c) => c.team_id));
  const teamsWithGame = new Set((activeGames || []).map((g) => g.team_id));
  const reminderMap = new Map((reminderRules || []).map((r) => [r.team_id, r.enabled]));
  const recentLogMap = new Map<string, string>();
  for (const log of recentLogs || []) {
    if (!recentLogMap.has(log.team_id)) recentLogMap.set(log.team_id, new Date(log.created_at).toLocaleString());
  }

  return (
    <div>
      <PageHeader title={org.name} subtitle="Choose a team to update this week's game, reminders, FAQs, and parent messages." action={<Badge>{org.plan} plan</Badge>} />
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {teams?.map((team) => (
          <Card key={team.id}>
            <h2 className="text-xl font-bold">{team.name}</h2>
            <p className="mt-1 text-sm text-slate-500">{[team.age_group, team.season].filter(Boolean).join(" • ") || "Team"}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone={connected.has(team.id) ? "green" : "amber"}>{connected.has(team.id) ? "Bot connected" : "Bot not connected"}</Badge>
              <Badge tone={teamsWithGame.has(team.id) ? "green" : "amber"}>{teamsWithGame.has(team.id) ? "Active game set" : "No active game"}</Badge>
              <Badge tone={reminderMap.get(team.id) ? "green" : "slate"}>
                {reminderMap.get(team.id) ? "Reminders enabled" : "Reminders disabled"}
              </Badge>
            </div>
            <p className="mt-4 text-sm text-slate-500">Recent parent message: {recentLogMap.get(team.id) || "No messages yet"}</p>
            <Link href={`/app/team/${team.id}`} className="mt-5 inline-block text-base font-semibold text-[#0C2D5A]">
              Open team
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Onboarding({ status, message }: { status?: string; message?: string }) {
  return (
    <div className="mx-auto max-w-2xl">
      {status === "error" ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{decodeURIComponent(message || "Unable to create organization")}</p> : null}
      {status === "success" ? <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Organization created. You can now finish setup.</p> : null}
      <EmptyState title="Create your first team space" body="Set up your team before connecting GroupMe or posting this week's game." />
      <Card className="mt-6">
        <form action={createOrganization} className="grid gap-4">
          <Field label="Organization name" name="organizationName" placeholder="Northside Baseball" required />
          <Field label="Team name" name="teamName" placeholder="12U Blue" required />
          <Field label="Age group" name="ageGroup" placeholder="12U" />
          <Field label="Season" name="season" placeholder="Spring 2026" />
          <Button>Create organization</Button>
        </form>
      </Card>
    </div>
  );
}
