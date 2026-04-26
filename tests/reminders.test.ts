import { describe, it, expect, vi } from "vitest";

const postGroupMeMessageMock = vi.fn();
vi.mock("@/lib/groupme", () => ({
  postGroupMeMessage: (...args: unknown[]) => postGroupMeMessageMock(...args),
}));

import { sendDueReminders } from "@/lib/reminders";

describe("sendDueReminders", () => {
  it("dedupes reminders when reminder log already exists", async () => {
    postGroupMeMessageMock.mockReset();
    const insertLog = vi.fn();
    const supabase = {
      from: vi.fn((name: string) => {
        if (name === "games") return { select: () => ({ eq: () => ({ in: async () => ({ data: [{ id: "g1", team_id: "t1", organization_id: "o1", opponent: "Rivals", game_date: "2026-04-27", game_time: "10:00", arrival_time: null, location_name: null, uniform: null, what_to_bring: null }] }) }) }) };
        if (name === "reminder_rules") return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { enabled: true, send_24h_before: true, send_2h_before: false } }) }) }) };
        if (name === "reminder_logs") return { select: () => ({ eq: () => ({ eq: async () => ({ data: { id: "existing-log" } }) }) }), insert: insertLog };
        if (name === "groupme_connections") return { select: () => ({ eq: () => ({ eq: async () => ({ data: [{ bot_id: "bot-1" }] }) }) }) };
        throw new Error(`unexpected table ${name}`);
      }),
    } as never;

    const now = new Date("2026-04-26T12:00:00.000Z");
    const results = await sendDueReminders(supabase, now);
    expect(results).toEqual([]);
    expect(postGroupMeMessageMock).not.toHaveBeenCalled();
    expect(insertLog).not.toHaveBeenCalled();
  });
});
