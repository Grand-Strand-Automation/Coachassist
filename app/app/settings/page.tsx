import { Card } from "@/components/ui";
import { getPrimaryMembership } from "@/lib/auth";
import { canManageSettings } from "@/lib/permissions";
export default async function SettingsPage() { const { membership, organization } = await getPrimaryMembership(); return <div><h1 className="text-3xl font-black">Settings</h1><Card className="mt-6"><h2 className="font-bold">Organization</h2><p className="mt-2 text-slate-600">{organization?.name || "No organization"}</p><p className="mt-2 text-sm text-slate-500">Role: {membership?.role}. {canManageSettings(membership?.role) ? "You can manage settings and billing." : "Ask an owner/admin for billing changes."}</p></Card></div>; }
