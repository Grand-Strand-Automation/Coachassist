import { Button, Card, Field } from "@/components/ui";
import { saveGame } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { requireTeamAccess } from "@/lib/permissions";
import { getActiveGameForTeam } from "@/lib/data";
import { PageHeader } from "@/components/page-header";
import { ScheduleImport } from "@/components/schedule-import";
import { StatusToast } from "@/components/status-toast";

export default async function GamePage({
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
  const game = await getActiveGameForTeam(supabase, teamId);
  return (
    <div>
      <PageHeader title="This Week's Game" subtitle="Post one clear game update so families know exactly when, where, and what to bring." />
      {query.status === "error" ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{decodeURIComponent(query.message || "We couldn't save this game. Please check the required fields and try again.")}</p> : null}
      <Card className="mt-6">
        <form action={saveGame.bind(null, teamId)} className="grid gap-4 md:grid-cols-2">
          <Field label="Opponent" name="opponent" defaultValue={game?.opponent} required />
          <Field label="Game date" name="game_date" type="date" defaultValue={game?.game_date} required />
          <Field label="Game time" name="game_time" defaultValue={game?.game_time} />
          <Field label="Arrival time" name="arrival_time" defaultValue={game?.arrival_time} helpText="Optional, but helpful for parents." />
          <Field label="Field or location name" name="location_name" defaultValue={game?.location_name} />
          <Field label="Address" name="location_address" defaultValue={game?.location_address} />
          <Field label="Google Maps URL" name="google_maps_url" defaultValue={game?.google_maps_url} />
          <Field label="Home, Away, or Neutral" name="home_or_away" defaultValue={game?.home_or_away} />
          <Field label="Uniform" name="uniform" defaultValue={game?.uniform} />
          <Field label="Game status" name="status" defaultValue={game?.status || "scheduled"} />
          <Field label="What to bring" name="what_to_bring" defaultValue={game?.what_to_bring} multiline />
          <Field label="Parking notes" name="parking_notes" defaultValue={game?.parking_notes} multiline />
          <div className="md:col-span-2">
            <Field label="Additional notes" name="additional_notes" defaultValue={game?.additional_notes} multiline />
          </div>
          <div className="sticky bottom-3 z-10 md:col-span-2">
            <Button className="w-full">Save Game</Button>
          </div>
        </form>
      </Card>
      <ScheduleImport teamId={teamId} />
      <StatusToast message={query.status === "saved" ? decodeURIComponent(query.message || "Game saved.") : undefined} />
    </div>
  );
}
