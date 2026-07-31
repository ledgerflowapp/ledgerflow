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
});
