import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockDb } = vi.hoisted(() => {
  const mockDb = {
    select: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
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

vi.mock("../friends", () => ({
  acceptInAppRequestAction: vi.fn(),
  rejectInAppRequestAction: vi.fn(),
}));

import {
  getNotificationsAction,
  getGroupGhostMergeNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  acceptFriendRequestNotificationAction,
  rejectFriendRequestNotificationAction,
  acceptGroupInviteNotificationAction,
  rejectGroupInviteNotificationAction,
} from "../notifications";
import { getSessionUser } from "@/lib/auth-session";
import { acceptInAppRequestAction, rejectInAppRequestAction } from "../friends";

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

describe("Aggregated Personal Notification Feed Actions", () => {
  const mockGetSessionUser = vi.mocked(getSessionUser);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws Unauthorized if no session user is present", async () => {
    mockGetSessionUser.mockResolvedValueOnce(null);

    await expect(getNotificationsAction()).rejects.toThrow("Unauthorized");
  });

  it("queries and aggregates FRIEND_REQ, GROUP_INVITE, EXPENSE_ADDED, and GROUP_GHOST_MERGE_REQUEST notifications", async () => {
    mockGetSessionUser.mockResolvedValueOnce(makeSessionUser("user-1"));

    const notifRecords = [
      {
        id: "notif-1",
        userId: "user-1",
        type: "FRIEND_REQ",
        title: "New Friend Request",
        message: "John wants to connect with you.",
        data: { initiator_id: "user-2" },
        isRead: false,
        createdAt: new Date("2026-08-05T10:00:00Z"),
      },
      {
        id: "notif-2",
        userId: "user-1",
        type: "GROUP_INVITE",
        title: "Group Invite",
        message: "You've been invited to Paris Trip",
        data: { groupId: "g-1", inviteToken: "tok-1", inviterId: "user-3" },
        isRead: false,
        createdAt: new Date("2026-08-05T09:00:00Z"),
      },
      {
        id: "notif-3",
        userId: "user-1",
        type: "EXPENSE_ADDED",
        title: "New Expense Added",
        message: "Dinner expense added in Paris Trip",
        data: { transactionId: "tx-1", amount: 15000, groupId: "g-1" },
        isRead: true,
        createdAt: new Date("2026-08-05T08:00:00Z"),
      },
      {
        id: "notif-4",
        userId: "user-1",
        type: "GROUP_GHOST_MERGE_REQUEST",
        title: "Merge Request",
        message: "Request to merge ghost member",
        data: { groupId: "g-1", ghostMemberId: "ghost-1", targetUserId: "user-4", status: "PENDING" },
        isRead: false,
        createdAt: new Date("2026-08-05T07:00:00Z"),
      },
    ];

    // mock main query select notifications
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          orderBy: vi.fn().mockResolvedValueOnce(notifRecords),
        }),
      }),
    });

    // 1. Batch query for groups (groupIds: ["g-1"])
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockResolvedValueOnce([{ id: "g-1", name: "Paris Trip 2026" }]),
      }),
    });

    // 2. Batch query for ghost members (ghostMemberIds: ["ghost-1"])
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockResolvedValueOnce([{ id: "ghost-1", ghostName: "Ghost Alex" }]),
      }),
    });

    // 3. Batch query for users (userIds: ["user-2", "user-3", "user-4"])
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockResolvedValueOnce([
          { id: "user-2", name: "John Doe", email: "john@example.com", image: null },
          { id: "user-3", name: "Sarah Connor", email: "sarah@example.com", image: null },
          { id: "user-4", name: "Alex R", email: "alex@example.com", image: null },
        ]),
      }),
    });

    // 4. Batch query for profiles (userIds: ["user-2", "user-3", "user-4"])
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockResolvedValueOnce([
          { id: "user-2", fullName: "John Doe", phone: "+12345", avatarUrl: null },
          { id: "user-3", fullName: "Sarah Connor", phone: null, avatarUrl: null },
          { id: "user-4", fullName: "Alex Rivera", phone: "+1555", avatarUrl: null },
        ]),
      }),
    });

    // 5. Batch query for friendships (friendInitiatorIds: ["user-2"])
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockResolvedValueOnce([
          { id: "f-123", userId1: "user-1", userId2: "user-2", status: "PENDING" },
        ]),
      }),
    });

    const notifications = await getNotificationsAction();

    expect(notifications).toHaveLength(4);

    // Assert FRIEND_REQ
    expect(notifications[0].type).toBe("FRIEND_REQ");
    expect(notifications[0].data.initiator.name).toBe("John Doe");
    expect(notifications[0].data.friendshipId).toBe("f-123");
    expect(notifications[0].data.status).toBe("PENDING");

    // Assert GROUP_INVITE
    expect(notifications[1].type).toBe("GROUP_INVITE");
    expect(notifications[1].data.groupName).toBe("Paris Trip 2026");
    expect(notifications[1].data.inviter.name).toBe("Sarah Connor");

    // Assert EXPENSE_ADDED
    expect(notifications[2].type).toBe("EXPENSE_ADDED");
    expect(notifications[2].data.amount).toBe(15000);
    expect(notifications[2].data.groupName).toBe("Paris Trip 2026");

    // Assert GROUP_GHOST_MERGE_REQUEST
    expect(notifications[3].type).toBe("GROUP_GHOST_MERGE_REQUEST");
    expect(notifications[3].data.groupName).toBe("Paris Trip 2026");
    expect(notifications[3].data.ghostName).toBe("Ghost Alex");
  });

  it("marks a single notification as read", async () => {
    mockGetSessionUser.mockResolvedValueOnce(makeSessionUser("user-1"));

    mockDb.update.mockReturnValueOnce({
      set: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockResolvedValueOnce([{ id: "notif-1" }]),
      }),
    });

    const res = await markNotificationAsReadAction("notif-1");
    expect(res.success).toBe(true);
    expect(mockDb.update).toHaveBeenCalled();
  });

  it("marks all unread notifications as read for the user", async () => {
    mockGetSessionUser.mockResolvedValueOnce(makeSessionUser("user-1"));

    mockDb.update.mockReturnValueOnce({
      set: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockResolvedValueOnce([]),
      }),
    });

    const res = await markAllNotificationsAsReadAction();
    expect(res.success).toBe(true);
    expect(mockDb.update).toHaveBeenCalled();
  });

  it("handles friend request acceptance from notification", async () => {
    mockGetSessionUser.mockResolvedValueOnce(makeSessionUser("user-1"));

    const notifRecord = {
      id: "notif-fr",
      userId: "user-1",
      type: "FRIEND_REQ",
      data: { initiator_id: "user-2" },
    };

    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          limit: vi.fn().mockResolvedValueOnce([notifRecord]),
        }),
      }),
    });

    // Mock search for friendship
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          limit: vi.fn().mockResolvedValueOnce([{ id: "f-100", status: "PENDING" }]),
        }),
      }),
    });

    // Mock update notification
    mockDb.update.mockReturnValueOnce({
      set: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockResolvedValueOnce([]),
      }),
    });

    vi.mocked(acceptInAppRequestAction).mockResolvedValueOnce({ success: true, sender_name: "John" });

    const res = await acceptFriendRequestNotificationAction("notif-fr");
    expect(res.success).toBe(true);
    expect(acceptInAppRequestAction).toHaveBeenCalledWith("f-100");
  });

  it("handles friend request rejection from notification", async () => {
    mockGetSessionUser.mockResolvedValueOnce(makeSessionUser("user-1"));

    const notifRecord = {
      id: "notif-fr",
      userId: "user-1",
      type: "FRIEND_REQ",
      data: { initiator_id: "user-2" },
    };

    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          limit: vi.fn().mockResolvedValueOnce([notifRecord]),
        }),
      }),
    });

    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          limit: vi.fn().mockResolvedValueOnce([{ id: "f-100", status: "PENDING" }]),
        }),
      }),
    });

    mockDb.update.mockReturnValueOnce({
      set: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockResolvedValueOnce([]),
      }),
    });

    vi.mocked(rejectInAppRequestAction).mockResolvedValueOnce({ success: true } as any);

    const res = await rejectFriendRequestNotificationAction("notif-fr");
    expect(res.success).toBe(true);
    expect(rejectInAppRequestAction).toHaveBeenCalledWith("f-100");
  });

  it("handles group invite acceptance from notification", async () => {
    mockGetSessionUser.mockResolvedValueOnce(makeSessionUser("user-1"));

    const notifRecord = {
      id: "notif-gi",
      userId: "user-1",
      type: "GROUP_INVITE",
      data: { groupId: "g-100", inviteToken: "tok-1" },
    };

    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          limit: vi.fn().mockResolvedValueOnce([notifRecord]),
        }),
      }),
    });

    // Mock check for existing member (none found)
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          limit: vi.fn().mockResolvedValueOnce([]),
        }),
      }),
    });

    // Mock insert into groupMembers
    mockDb.insert.mockReturnValueOnce({
      values: vi.fn().mockResolvedValueOnce([]),
    });

    // Mock update notification
    mockDb.update.mockReturnValueOnce({
      set: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockResolvedValueOnce([]),
      }),
    });

    const res = await acceptGroupInviteNotificationAction("notif-gi");
    expect(res.success).toBe(true);
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it("handles group invite rejection from notification", async () => {
    mockGetSessionUser.mockResolvedValueOnce(makeSessionUser("user-1"));

    const notifRecord = {
      id: "notif-gi",
      userId: "user-1",
      type: "GROUP_INVITE",
      data: { groupId: "g-100" },
    };

    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          limit: vi.fn().mockResolvedValueOnce([notifRecord]),
        }),
      }),
    });

    mockDb.update.mockReturnValueOnce({
      set: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockResolvedValueOnce([]),
      }),
    });

    const res = await rejectGroupInviteNotificationAction("notif-gi");
    expect(res.success).toBe(true);
    expect(mockDb.update).toHaveBeenCalled();
  });
});

