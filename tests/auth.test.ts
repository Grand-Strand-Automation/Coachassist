import { describe, it, expect, vi, beforeEach } from "vitest";

const redirectMock = vi.fn();
const getUserMock = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: getUserMock },
  }),
}));

describe("requireUser", () => {
  beforeEach(() => {
    redirectMock.mockReset();
    getUserMock.mockReset();
  });

  it("redirects to login when user is missing", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const { requireUser } = await import("@/lib/auth");
    await requireUser();
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("returns supabase and user when authenticated", async () => {
    const user = { id: "user-1" };
    getUserMock.mockResolvedValue({ data: { user } });
    const { requireUser } = await import("@/lib/auth");
    const result = await requireUser();
    expect(result.user).toEqual(user);
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
