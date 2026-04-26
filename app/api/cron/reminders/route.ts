import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendDueReminders } from "@/lib/reminders";
export async function GET(request: Request) { const secret = process.env.CRON_SECRET; if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error:"unauthorized" }, { status:401 }); const results = await sendDueReminders(createAdminClient()); return NextResponse.json({ ok:true, results }); }
