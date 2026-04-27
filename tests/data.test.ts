import { describe, it, expect, vi } from "vitest";
import { bootstrapOrganization, getActiveGameForTeam } from "@/lib/data";

function chain(result: unknown) {
  return {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };
}

describe("data helpers", () => {
  it("creates org + owner member + team + reminder rule", async () => {
    const orgResult = { data: { id: "org-1" }, error: null };
    const teamResult = { data: { id: "team-1" }, error: null };
    const insertOk = { error: null };
    const orgTable = chain(orgResult);
    const memberTable = { insert: vi.fn().mockResolvedValue(insertOk) };
    const teamTable = chain(teamResult);
    const reminderTable = { insert: vi.fn().mockResolvedValue(insertOk) };
    const supabase = {
      from: vi.fn((name: string) => {
        if (name === "organizations") return orgTable;
        if (name === "organization_members") return memberTable;
        if (name === "teams") return teamTable;
        if (name === "reminder_rules") return reminderTable;
        throw new Error(`unexpected table ${name}`);
      }),
    } as never;

    const result = await bootstrapOrganization(supabase, {
      organizationName: "Org",
      slug: "org-1",
      ownerUserId: "user-1",
      teamName: "12U",
      ageGroup: "12U",
      season: "Spring",
    });
    expect(result.organization.id).toBe("org-1");
    expect(result.team.id).toBe("team-1");
  });

  it("returns active game for team", async () => {
    const game = { id: "game-1" };
    const gamesTable = chain({ data: game, error: null });
    const supabase = { from: vi.fn(() => gamesTable) } as never;
    const result = await getActiveGameForTeam(supabase, "team-1");
    expect(result).toEqual(game);
    expect(gamesTable.eq).toHaveBeenCalledWith("team_id", "team-1");
  });
});
