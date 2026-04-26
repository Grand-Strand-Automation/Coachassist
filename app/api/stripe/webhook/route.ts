import { NextResponse } from "next/server";
export async function POST(request: Request) { const payload = await request.text(); return NextResponse.json({ ok:true, received:Boolean(payload), note:"Stripe signature verification and subscription upsert should be enabled when checkout goes live." }); }
