import Link from "next/link";
import { signOut } from "@/lib/actions";
import { Button } from "@/components/ui";
import { requireUser } from "@/lib/auth";
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <div className="min-h-screen bg-[#F7F8FA]"><header className="sticky top-0 z-20 border-b border-[#E5E7EB] bg-white/95 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4"><Link href="/app" className="text-lg font-black text-[#0C2D5A]">CoachAssist</Link><nav className="flex items-center gap-2 text-sm sm:gap-4"><Link href="/app/settings" className="font-semibold text-slate-600">Settings</Link><Link href="/app/billing" className="font-semibold text-slate-600">Billing</Link><form action={signOut}><Button className="bg-[#0C2D5A] px-3 text-white hover:bg-[#103A75]">Sign out</Button></form></nav></div></header><main className="mx-auto max-w-7xl px-4 py-6 md:py-8">{children}</main></div>;
}
