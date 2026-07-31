import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockInsertValues,
  mockUpdateSet,
  mockDeleteWhere,
  mockTx,
  mockDb,
} = vi.hoisted(() => {
  const mockInsertValues = vi.fn();
  const mockUpdateSet = vi.fn();
  const mockDeleteWhere = vi.fn();

  const mockTx = {
    select: vi.fn(),
    insert: vi.fn(() => ({
      values: mockInsertValues,
    })),
    update: vi.fn(() => ({
      set: mockUpdateSet,
    })),
    delete: vi.fn(() => ({
      where: mockDeleteWhere,
    })),
  };

  const mockDb = {
    transaction: vi.fn(async (cb: any) => cb(mockTx)),
    select: vi.fn(),
    insert: vi.fn(() => ({
      values: mockInsertValues,
    })),
    update: vi.fn(() => ({
      set: mockUpdateSet,
    })),
    delete: vi.fn(() => ({
      where: mockDeleteWhere,
    })),
    query: {
      friendships: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      contacts: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      profiles: {
        findFirst: vi.fn(),
      },
    },
  };

  return {
    mockInsertValues,
    mockUpdateSet,
    mockDeleteWhere,
    mockTx,
    mockDb,
  };
});

vi.mock("@/db", () => ({
  db: mockDb,
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

import {
  detectUserByPhoneAction,
  sendFriendRequestAction,
  acceptInAppRequestAction,
  rejectInAppRequestAction,
  removeFriendAction,
  acceptContactInviteAction,
  acceptFriendInviteAction,
  getFriendshipsAction,
  getFriendRequestsAction,
} from "../friends";
import { auth } from "@/lib/auth";

describe("Friends Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("detectUserByPhoneAction", () => {
    it("returns null if no discoverable user found by phone", async () => {
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            limit: vi.fn().mockResolvedValueOnce([]),
          }),
        }),
      });

      const user = await detectUserByPhoneAction("+1234567890", "user-1");
      expect(user).toBeNull();
    });

    it("returns user details if discoverable profile exists", async () => {
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            limit: vi.fn().mockResolvedValueOnce([
              { id: "u2", fullName: "Jane Doe", avatarUrl: "https://example.com/avatar.png" },
            ]),
          }),
        }),
      });

      const user = await detectUserByPhoneAction("+1234567890", "user-1");
      expect(user).toEqual({
        id: "u2",
        full_name: "Jane Doe",
        avatar_url: "https://example.com/avatar.png",
      });
    });
  });

  describe("sendFriendRequestAction", () => {
    it("throws error on self request", async () => {
      (auth.api.getSession as any).mockResolvedValueOnce({
        user: { id: "user-1" },
      });

      await expect(
        sendFriendRequestAction({ targetUserId: "user-1" })
      ).rejects.toThrow("Cannot send a friend request to yourself");
    });

    it("throws error if already friends", async () => {
      (auth.api.getSession as any).mockResolvedValueOnce({ user: { id: "user-1" } });
      mockTx.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            limit: vi.fn().mockResolvedValueOnce([{ status: "ACCEPTED" }]),
          }),
        }),
      });

      await expect(
        sendFriendRequestAction({ targetUserId: "user-2" })
      ).rejects.toThrow("You are already friends with this user");
    });

    it("creates friendship and notification when sending valid request", async () => {
      (auth.api.getSession as any).mockResolvedValueOnce({ user: { id: "user-1" } });
      // existing check (empty)
      mockTx.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            limit: vi.fn().mockResolvedValueOnce([]),
          }),
        }),
      });

      mockInsertValues.mockResolvedValue(undefined);

      const res = await sendFriendRequestAction({ targetUserId: "user-2" });
      expect(res).toEqual({ success: true });
      expect(mockTx.insert).toHaveBeenCalled();
    });
  });

  describe("acceptInAppRequestAction", () => {
    it("throws error if request not found", async () => {
      (auth.api.getSession as any).mockResolvedValueOnce({ user: { id: "user-1" } });
      mockTx.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            limit: vi.fn().mockResolvedValueOnce([]),
          }),
        }),
      });

      await expect(acceptInAppRequestAction("f-id")).rejects.toThrow("Friend request not found");
    });

    it("throws error if trying to accept own request", async () => {
      (auth.api.getSession as any).mockResolvedValueOnce({ user: { id: "user-1" } });
      mockTx.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            limit: vi.fn().mockResolvedValueOnce([
              { id: "f1", status: "PENDING", initiatorId: "user-1", userId1: "user-1", userId2: "user-2" },
            ]),
          }),
        }),
      });

      await expect(acceptInAppRequestAction("f1")).rejects.toThrow("You cannot accept your own request");
    });

    it("accepts in-app request successfully", async () => {
      (auth.api.getSession as any).mockResolvedValueOnce({ user: { id: "user-2" } });
      // 1. friendship lookup
      mockTx.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            limit: vi.fn().mockResolvedValueOnce([
              { id: "f1", status: "PENDING", initiatorId: "user-1", userId1: "user-1", userId2: "user-2" },
            ]),
          }),
        }),
      });
      // 2. update status
      mockUpdateSet.mockReturnValueOnce({
        where: vi.fn().mockResolvedValueOnce(undefined),
      });
      // 3. sender profile
      mockTx.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            limit: vi.fn().mockResolvedValueOnce([{ id: "user-1", fullName: "User One" }]),
          }),
        }),
      });
      // 4. receiver profile
      mockTx.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            limit: vi.fn().mockResolvedValueOnce([{ id: "user-2", fullName: "User Two" }]),
          }),
        }),
      });
      // 5. receiver contacts check
      mockTx.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            limit: vi.fn().mockResolvedValueOnce([{ id: "c1" }]),
          }),
        }),
      });
      // 6. sender contacts check
      mockTx.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            limit: vi.fn().mockResolvedValueOnce([{ id: "c2" }]),
          }),
        }),
      });

      const res = await acceptInAppRequestAction("f1");
      expect(res).toEqual({ success: true, sender_name: "User One" });
    });
  });

  describe("rejectInAppRequestAction", () => {
    it("rejects and deletes in-app request", async () => {
      (auth.api.getSession as any).mockResolvedValueOnce({ user: { id: "user-2" } });
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            limit: vi.fn().mockResolvedValueOnce([
              { id: "f1", userId1: "user-1", userId2: "user-2" },
            ]),
          }),
        }),
      });

      mockDeleteWhere.mockResolvedValueOnce(undefined);
      mockUpdateSet.mockReturnValueOnce({
        where: vi.fn().mockResolvedValueOnce(undefined),
      });

      const res = await rejectInAppRequestAction("f1");
      expect(res).toEqual({ success: true });
    });
  });

  describe("removeFriendAction", () => {
    it("deletes friendship and unlinks contacts in transaction", async () => {
      (auth.api.getSession as any).mockResolvedValueOnce({
        user: { id: "user-1" },
      });

      mockUpdateSet.mockReturnValueOnce({
        where: vi.fn().mockResolvedValueOnce(undefined),
      });

      mockDeleteWhere.mockResolvedValueOnce(undefined);

      const res = await removeFriendAction("friend-2", "user-1");
      expect(mockDb.transaction).toHaveBeenCalled();
      expect(res).toEqual({ success: true });
    });
  });

  describe("acceptContactInviteAction and acceptFriendInviteAction", () => {
    it("accepts contact invite token successfully", async () => {
      // contact match
      mockTx.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            limit: vi.fn().mockResolvedValueOnce([{ id: "c1", userId: "user-1" }]),
          }),
        }),
      });
      // owner profile
      mockTx.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            limit: vi.fn().mockResolvedValueOnce([{ fullName: "Owner Name" }]),
          }),
        }),
      });
      // existing friendship check
      mockTx.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            limit: vi.fn().mockResolvedValueOnce([]),
          }),
        }),
      });

      mockInsertValues.mockResolvedValueOnce(undefined);
      mockUpdateSet.mockReturnValueOnce({
        where: vi.fn().mockResolvedValueOnce(undefined),
      });

      const res = await acceptContactInviteAction("valid-token", "user-2");
      expect(res).toEqual({ success: true, owner_name: "Owner Name" });
    });

    it("accepts friend invite token successfully", async () => {
      // target profile match
      mockTx.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            limit: vi.fn().mockResolvedValueOnce([{ id: "user-1", fullName: "Target User" }]),
          }),
        }),
      });
      // current user profile
      mockTx.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            limit: vi.fn().mockResolvedValueOnce([{ id: "user-2", fullName: "Current User" }]),
          }),
        }),
      });
      // existing friendship check
      mockTx.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            limit: vi.fn().mockResolvedValueOnce([]),
          }),
        }),
      });
      // current contact match
      mockTx.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            limit: vi.fn().mockResolvedValueOnce([{ id: "c1" }]),
          }),
        }),
      });
      // target contact match
      mockTx.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            limit: vi.fn().mockResolvedValueOnce([{ id: "c2" }]),
          }),
        }),
      });

      const res = await acceptFriendInviteAction("friend-token", "user-2");
      expect(res).toEqual({ success: true, target_name: "Target User" });
    });
  });

  describe("getFriendshipsAction and getFriendRequestsAction", () => {
    it("returns list of accepted friendships", async () => {
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockResolvedValueOnce([
            { id: "f1", userId1: "user-1", userId2: "user-2", status: "ACCEPTED" },
          ]),
        }),
      });
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockResolvedValueOnce([
            { id: "user-2", fullName: "Friend Two", avatarUrl: null, email: "friend@example.com" },
          ]),
        }),
      });

      const list = await getFriendshipsAction("user-1");
      expect(list).toHaveLength(1);
      expect(list[0].profile.full_name).toBe("Friend Two");
    });

    it("returns list of pending friend requests", async () => {
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockResolvedValueOnce([
            { id: "f1", userId1: "user-2", userId2: "user-1", status: "PENDING", initiatorId: "user-2" },
          ]),
        }),
      });
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockResolvedValueOnce([
            { id: "user-2", fullName: "Friend Two", avatarUrl: null },
          ]),
        }),
      });

      const requests = await getFriendRequestsAction("user-1");
      expect(requests).toHaveLength(1);
      expect(requests[0].type).toBe("INCOMING");
      expect(requests[0].profile.full_name).toBe("Friend Two");
    });
  });
});

