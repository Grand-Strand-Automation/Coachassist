import Link from "next/link";
import { signOut } from "@/lib/actions";
import { Button } from "@/components/ui";
import { requireUser } from "@/lib/auth";
export default async function AppLayout({ children }: { children: React.ReactNode }) { await requireUser(); return <div className="min-h-screen bg-slate-100"><header className="border-b bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4"><Link href="/app" className="text-lg font-black text-blue-900">Ask Coach</Link><nav className="flex items-center gap-4 text-sm"><Link href="/app/settings" className="font-medium text-slate-600">Settings</Link><Link href="/app/billing" className="font-medium text-slate-600">Billing</Link><form action={signOut}><Button className="bg-slate-900 hover:bg-slate-800">Sign out</Button></form></nav></div></header><main className="mx-auto max-w-7xl px-4 py-8">{children}</main></div>; }
