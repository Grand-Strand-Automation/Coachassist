import { Button, Card, Field, Badge } from "@/components/ui";
import { connectGroupMe } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { requireTeamAccess } from "@/lib/permissions";
export default async function GroupMePage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  searchParams?: Promise<{ status?: string; message?: string }>;
}) {
  const { teamId } = await params;
  const query = (await searchParams) || {};
  const { supabase, user } = await requireUser();
  await requireTeamAccess(supabase, user.id, teamId);
  const { data: connections } = await supabase.from("groupme_connections").select("*").eq("team_id", teamId).order("created_at", { ascending: false });
  return (
    <div>
      <h1 className="text-3xl font-black">GroupMe integration</h1>
      <p className="mt-1 text-slate-600">Create/register a GroupMe bot and route this group&apos;s messages to the right tenant.</p>
      {query.status === "connected" ? <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">GroupMe bot connected successfully.</p> : null}
      {query.status === "error" ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{decodeURIComponent(query.message || "Unable to connect GroupMe")}</p> : null}
      <Card className="mt-6">
        <form action={connectGroupMe.bind(null, teamId)} className="grid gap-4">
          <Field label="GroupMe access token" name="accessToken" type="password" required />
          <Field label="Group ID" name="groupId" required />
          <Field label="Bot name" name="botName" placeholder="Ask Coach" />
          <Button>Connect GroupMe bot</Button>
        </form>
        <p className="mt-4 text-xs text-slate-500">
          Access tokens are encrypted before storage in this MVP. For production hardening, rotate keys and move secret material to managed KMS.
        </p>
      </Card>
      <div className="mt-6 grid gap-4">
        {connections?.map((c) => (
          <Card key={c.id}>
            <div className="flex justify-between">
              <div>
                <h2 className="font-bold">{c.bot_name || "GroupMe bot"}</h2>
                <p className="text-sm text-slate-600">Group {c.group_id} - Bot {c.bot_id}</p>
                <p className="mt-2 text-xs text-slate-500">Callback: {c.callback_url}</p>
              </div>
              <Badge tone={c.is_active ? "green" : "slate"}>{c.is_active ? "Active" : "Inactive"}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
