import Link from "next/link";
import { CalendarDays, HelpCircle, MessageSquare, Bell, Plug } from "lucide-react";
import { Card } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { requireTeamAccess } from "@/lib/permissions";
import { getActiveGameForTeam } from "@/lib/data";
const links = [["Game details","game",CalendarDays],["FAQs","faqs",HelpCircle],["Messages","messages",MessageSquare],["Reminders","reminders",Bell],["GroupMe","integrations/groupme",Plug]] as const;
export default async function TeamHome({ params }: { params: Promise<{ teamId: string }> }) { const { teamId } = await params; const { supabase, user } = await requireUser(); const { team } = await requireTeamAccess(supabase, user.id, teamId); const game = await getActiveGameForTeam(supabase, teamId); return <div><h1 className="text-3xl font-black">{team.name}</h1><p className="mt-1 text-slate-600">{game ? `Active game vs ${game.opponent} on ${game.game_date}` : "No active game posted yet."}</p><div className="mt-8 grid gap-5 md:grid-cols-3">{links.map(([title, href, Icon]) => <Link key={href} href={`/app/team/${teamId}/${href}`}><Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md"><Icon className="h-8 w-8 text-blue-700" /><h2 className="mt-4 font-bold">{title}</h2><p className="mt-2 text-sm text-slate-600">Open {title.toLowerCase()}.</p></Card></Link>)}</div></div>; }
