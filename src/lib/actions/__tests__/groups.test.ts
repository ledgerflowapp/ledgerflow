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
      groups: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      groupMembers: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      transactions: {
        findMany: vi.fn(),
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
  getGroupByInviteAction,
  joinGroupAction,
  linkGhostToFriendAction,
  createGroupAction,
  updateGroupAction,
  deleteGroupAction,
  removeGroupMemberAction,
  getGroupsAction,
  getGroupDetailsAction,
  getGroupBalancesAction,
  getGroupTransactionCountAction,
} from "../groups";
import { auth } from "@/lib/auth";

describe("Groups Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getGroupByInviteAction", () => {
    it("returns empty array if no group matches invite code", async () => {
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            limit: vi.fn().mockResolvedValueOnce([]),
          }),
        }),
      });

      const res = await getGroupByInviteAction("invalid-code");
      expect(res).toEqual([]);
    });

    it("returns group and ghost members for valid invite code", async () => {
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            limit: vi.fn().mockResolvedValueOnce([
              { id: "g1", name: "Trip Group", avatarUrl: null },
            ]),
          }),
        }),
      });

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockResolvedValueOnce([
            { id: "gm1", ghostName: "Ghost User", avatarUrl: null },
          ]),
        }),
      });

      const res = await getGroupByInviteAction("valid-code");
      expect(res).toHaveLength(1);
      expect(res[0]).toEqual({
        group_id: "g1",
        group_name: "Trip Group",
        group_avatar_url: null,
        ghost_members: [{ id: "gm1", name: "Ghost User", avatar_url: null }],
      });
    });
  });

  describe("joinGroupAction", () => {
    it("throws Unauthorized if not logged in", async () => {
      (auth.api.getSession as any).mockResolvedValueOnce(null);
      await expect(joinGroupAction("code123")).rejects.toThrow("Unauthorized");
    });

    it("joins group as new member if not already member", async () => {
      (auth.api.getSession as any).mockResolvedValueOnce({
        user: { id: "user-1" },
      });

      // 1. target group lookup
      mockTx.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            limit: vi.fn().mockResolvedValueOnce([{ id: "g1" }]),
          }),
        }),
      });

      // 2. existing member check
      mockTx.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            limit: vi.fn().mockResolvedValueOnce([]),
          }),
        }),
      });

      // 3. insert new member
      mockInsertValues.mockResolvedValueOnce(undefined);

      const res = await joinGroupAction("code123", null);
      expect(res).toEqual({ success: true, group_id: "g1" });
    });
  });

  describe("createGroupAction", () => {
    it("creates a group and inserts member records in a transaction", async () => {
      (auth.api.getSession as any).mockResolvedValueOnce({
        user: { id: "user-1" },
      });

      const newGroup = {
        id: "g-new",
        name: "Goa Vacation",
        type: "TRIP",
        createdBy: "user-1",
        avatarUrl: null,
        inviteCode: "inv-1",
        createdAt: new Date("2026-01-01"),
      };

      mockTx.insert.mockReturnValueOnce({
        values: vi.fn().mockReturnValueOnce({
          returning: vi.fn().mockResolvedValueOnce([newGroup]),
        }),
      });

      mockTx.insert.mockReturnValueOnce({
        values: mockInsertValues.mockResolvedValueOnce(undefined),
      });

      const res = await createGroupAction(
        {
          name: "Goa Vacation",
          type: "TRIP",
          members: [{ name: "Alice", type: "GHOST" }],
        },
        "user-1"
      );

      expect(mockDb.transaction).toHaveBeenCalled();
      expect(res.id).toBe("g-new");
      expect(res.name).toBe("Goa Vacation");
    });
  });

  describe("getGroupsAction", () => {
    it("returns user groups list", async () => {
      (auth.api.getSession as any).mockResolvedValueOnce({
        user: { id: "user-1" },
      });

      const mockGroupRows = [
        {
          groups: {
            id: "g1",
            name: "Flatmates",
            type: "HOME",
            avatarUrl: null,
            inviteCode: "inv-flat",
            createdAt: new Date("2026-01-01"),
          },
        },
      ];

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          innerJoin: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockResolvedValueOnce(mockGroupRows),
          }),
        }),
      });

      const groups = await getGroupsAction("user-1");
      expect(groups).toHaveLength(1);
      expect(groups[0].name).toBe("Flatmates");
    });
  });
});
