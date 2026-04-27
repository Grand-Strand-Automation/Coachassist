import { Button, Card, Field, Badge } from "@/components/ui";
import { connectGroupMe } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { requireTeamAccess } from "@/lib/permissions";
import { StatusToast } from "@/components/status-toast";
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
      <h1 className="text-3xl font-black">Connect GroupMe</h1>
      <p className="mt-1 text-base text-slate-600">Follow these steps once and your team chat can answer common parent questions automatically.</p>
      {query.status === "error" ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{decodeURIComponent(query.message || "Unable to connect GroupMe. Please check the token and group ID.")}</p> : null}
      <Card className="mt-6">
        <form action={connectGroupMe.bind(null, teamId)} className="grid gap-4">
          <p className="text-sm font-semibold text-slate-600">Step 1: Add your GroupMe access token</p>
          <Field label="GroupMe access token" name="accessToken" type="password" required helpText="You can create this in GroupMe's developer tools." />
          <p className="text-sm font-semibold text-slate-600">Step 2: Add the Group ID for your team chat</p>
          <Field label="Group ID" name="groupId" required />
          <p className="text-sm font-semibold text-slate-600">Step 3: Pick a bot name parents will recognize</p>
          <Field label="Bot name" name="botName" placeholder="CoachAssist Bot" />
          <Button>Connect GroupMe</Button>
        </form>
        <p className="mt-4 text-xs text-slate-500">
          Your token is encrypted before storage. If setup fails, double-check token permissions and your Group ID.
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
      <StatusToast message={query.status === "connected" ? "Bot connected." : undefined} />
    </div>
  );
}
