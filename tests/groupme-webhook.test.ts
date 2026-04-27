import { describe, it, expect, vi, beforeEach } from "vitest";

const postGroupMeMessageMock = vi.fn();
const answerParentQuestionMock = vi.fn();
const incrementUsageMock = vi.fn();

const connection = {
  id: "conn-1",
  group_id: "group-123",
  organization_id: "org-1",
  team_id: "team-1",
  bot_id: "bot-1",
  is_active: true,
};

const supabaseMock = {
  from: vi.fn((table: string) => {
    if (table === "groupme_connections") return { select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: connection }) }) }) }) };
    if (table === "teams") return { select: () => ({ eq: () => ({ single: async () => ({ data: { id: "team-1", name: "12U Blue" } }) }) }) };
    if (table === "organizations") return { select: () => ({ eq: () => ({ single: async () => ({ data: { id: "org-1", name: "Org" } }) }) }) };
    if (table === "games") return { select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) }) };
    if (table === "faqs") return { select: () => ({ eq: async () => ({ data: [] }) }) };
    if (table === "message_logs") return { insert: async () => ({ error: null }) };
    throw new Error(`unexpected table ${table}`);
  }),
};

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => supabaseMock,
}));

vi.mock("@/lib/groupme", () => ({
  validateIncomingGroupMePayload: () => ({ success: true, data: { group_id: "group-123", text: "what time is game?", name: "Parent", user_id: "u1" } }),
  shouldIgnoreGroupMeMessage: () => false,
  postGroupMeMessage: (...args: unknown[]) => postGroupMeMessageMock(...args),
}));

vi.mock("@/lib/ai", () => ({
  answerParentQuestion: (...args: unknown[]) => answerParentQuestionMock(...args),
  formatGroupMeAnswer: () => "Answer text",
}));

vi.mock("@/lib/usage", () => ({
  incrementUsage: (...args: unknown[]) => incrementUsageMock(...args),
}));

describe("groupme webhook", () => {
  beforeEach(() => {
    postGroupMeMessageMock.mockReset();
    answerParentQuestionMock.mockReset();
    incrementUsageMock.mockReset();
    answerParentQuestionMock.mockResolvedValue({ intents: ["unknown"], answer: "Answer text", followups: [], needsFollowup: false });
  });

  it("routes by group_id and posts response", async () => {
    const { POST } = await import("@/app/api/groupme/webhook/route");
    const req = new Request("http://localhost/api/groupme/webhook", {
      method: "POST",
      body: JSON.stringify({ group_id: "group-123", text: "what time is game?" }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(postGroupMeMessageMock).toHaveBeenCalledWith("bot-1", "Answer text");
    expect(incrementUsageMock).toHaveBeenCalled();
  });
});
