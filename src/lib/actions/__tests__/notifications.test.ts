import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockDb } = vi.hoisted(() => {
  const mockDb = {
    select: vi.fn(),
  };

  return {
    mockDb,
  };
});

vi.mock("@/db", () => ({
  db: mockDb,
}));

vi.mock("@/lib/auth-session", () => ({
  getSessionUser: vi.fn(),
}));

import { getGroupGhostMergeNotificationsAction } from "../notifications";
import { getSessionUser } from "@/lib/auth-session";

function makeSessionUser(id: string) {
  return {
    id,
    email: `${id}@example.com`,
    name: `User ${id}`,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("Group Ghost Merge Notifications Action", () => {
  const mockGetSessionUser = vi.mocked(getSessionUser);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws Unauthorized if no session user is present", async () => {
    mockGetSessionUser.mockResolvedValueOnce(null);

    await expect(getGroupGhostMergeNotificationsAction()).rejects.toThrow("Unauthorized");
  });

  it("fetches and enriches pending merge request notifications for group admin", async () => {
    mockGetSessionUser.mockResolvedValueOnce(makeSessionUser("admin-1"));

    const notifRecord = {
      id: "req-1",
      userId: "admin-1",
      type: "GROUP_GHOST_MERGE_REQUEST",
      title: "Group Ghost Member Merge Request",
      message: "Request to merge ghost member 'Ghost Alex' with user profile in 'Ski Trip 2026'.",
      data: {
        groupId: "g-100",
        ghostMemberId: "ghost-55",
        targetUserId: "user-target-1",
        status: "PENDING",
      },
      isRead: false,
      createdAt: new Date("2026-08-04T10:00:00Z"),
    };

    const groupRecord = { id: "g-100", name: "Ski Trip 2026" };
    const ghostMemberRecord = { id: "ghost-55", ghostName: "Ghost Alex" };
    const targetUserRecord = { id: "user-target-1", name: "Alex Rivera", email: "alex@example.com", image: null };
    const targetProfileRecord = { id: "user-target-1", fullName: "Alex Rivera", phone: "+15550199", avatarUrl: "https://example.com/avatar.jpg" };

    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          orderBy: vi.fn().mockResolvedValueOnce([notifRecord]),
        }),
      }),
    });

    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          limit: vi.fn().mockResolvedValueOnce([groupRecord]),
        }),
      }),
    });

    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          limit: vi.fn().mockResolvedValueOnce([ghostMemberRecord]),
        }),
      }),
    });

    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          limit: vi.fn().mockResolvedValueOnce([targetUserRecord]),
        }),
      }),
    });

    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          limit: vi.fn().mockResolvedValueOnce([targetProfileRecord]),
        }),
      }),
    });

    const results = await getGroupGhostMergeNotificationsAction();

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      id: "req-1",
      userId: "admin-1",
      type: "GROUP_GHOST_MERGE_REQUEST",
      title: "Group Ghost Member Merge Request",
      message: "Request to merge ghost member 'Ghost Alex' with user profile in 'Ski Trip 2026'.",
      isRead: false,
      createdAt: "2026-08-04T10:00:00.000Z",
      data: {
        groupId: "g-100",
        groupName: "Ski Trip 2026",
        ghostMemberId: "ghost-55",
        ghostName: "Ghost Alex",
        targetUserId: "user-target-1",
        targetUser: {
          id: "user-target-1",
          name: "Alex Rivera",
          email: "alex@example.com",
          phone: "+15550199",
          avatarUrl: "https://example.com/avatar.jpg",
        },
        status: "PENDING",
      },
    });
  });
});
