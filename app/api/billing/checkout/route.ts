import { NextResponse } from "next/server";
import { z } from "zod";
import { createCheckoutSessionStub } from "@/lib/billing";
import { requireUser } from "@/lib/auth";
const schema = z.object({ organizationId:z.string().uuid(), plan:z.enum(["free","coach_pro","club_pro"]) });
export async function POST(request: Request) { await requireUser(); const body = schema.parse(await request.json()); return NextResponse.json(await createCheckoutSessionStub(body.organizationId, body.plan)); }
