import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockInsertValues,
  mockUpdateSet,
  mockDb,
} = vi.hoisted(() => {
  const mockInsertValues = vi.fn();
  const mockUpdateSet = vi.fn();

  const mockDb = {
    select: vi.fn(),
    insert: vi.fn(() => ({
      values: mockInsertValues,
    })),
    update: vi.fn(() => ({
      set: mockUpdateSet,
    })),
  };

  return {
    mockInsertValues,
    mockUpdateSet,
    mockDb,
  };
});

vi.mock("@/db", () => ({
  db: mockDb,
}));

import {
  scanGhostMatchesForUser,
  normalizePhone,
  normalizeEmail,
  isPhoneMatch,
} from "../ghost-auto-matcher";

describe("Ghost Auto-Matcher Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Helper Functions", () => {
    it("normalizes emails properly", () => {
      expect(normalizeEmail("  Alice@Example.COM  ")).toBe("alice@example.com");
      expect(normalizeEmail(null)).toBe("");
      expect(normalizeEmail(undefined)).toBe("");
    });

    it("normalizes phone numbers properly", () => {
      expect(normalizePhone("+1 (555) 019-2834")).toBe("+15550192834");
      expect(normalizePhone(" 555-019-2834 ")).toBe("5550192834");
      expect(normalizePhone(null)).toBe("");
      expect(normalizePhone(undefined)).toBe("");
    });

    it("evaluates phone matching with or without country code", () => {
      expect(isPhoneMatch("+15550192834", "5550192834")).toBe(true);
      expect(isPhoneMatch("+1 (555) 019-2834", "555-019-2834")).toBe(true);
      expect(isPhoneMatch("+15550192834", "+15550192834")).toBe(true);
      expect(isPhoneMatch("+15550192834", "+19876543210")).toBe(false);
      expect(isPhoneMatch(null, "+15550192834")).toBe(false);
    });
  });

  describe("scanGhostMatchesForUser", () => {
    it("returns error if target user is not found", async () => {
      // 1. userTable query empty
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            limit: vi.fn().mockResolvedValueOnce([]),
          }),
        }),
      });

      const res = await scanGhostMatchesForUser("non-existent-user");
      expect(res).toEqual({
        success: false,
        reason: "Target user profile not found",
        matchedCount: 0,
        requests: [],
      });
    });

    it("returns matchedCount 0 if target user has no phone or email", async () => {
      // 1. userTable query found with no email
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            limit: vi.fn().mockResolvedValueOnce([{ id: "u-1", name: "No Contact User", email: "", emailVerified: false }]),
          }),
        }),
      });
      // 2. profiles query empty
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            limit: vi.fn().mockResolvedValueOnce([]),
          }),
        }),
      });

      const res = await scanGhostMatchesForUser("u-1");
      expect(res).toEqual({
        success: true,
        matchedCount: 0,
        requests: [],
      });
    });

    it("scans unclaimed ghost slots and dispatches merge request when ghostName matches user email", async () => {
      const targetUser = {
        id: "u-target",
        email: "alice@example.com",
        name: "Alice Smith",
        emailVerified: true,
      };

      const targetProfile = {
        id: "u-target",
        phone: "+15550192834",
        fullName: "Alice Smith",
      };

      const unclaimedGhostMembers = [
        {
          ghostMemberId: "ghost-1",
          ghostName: "alice@example.com",
          groupId: "g-1",
          groupName: "Vacation Group",
          groupAdminId: "user-admin",
        },
      ];

      mockDb.select
        // 1. userTable
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              limit: vi.fn().mockResolvedValueOnce([targetUser]),
            }),
          }),
        })
        // 2. profiles
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              limit: vi.fn().mockResolvedValueOnce([targetProfile]),
            }),
          }),
        })
        // 3. unclaimed ghost members
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            innerJoin: vi.fn().mockReturnValueOnce({
              where: vi.fn().mockResolvedValueOnce(unclaimedGhostMembers),
            }),
          }),
        })
        // 4. existing member check for g-1
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              limit: vi.fn().mockResolvedValueOnce([]),
            }),
          }),
        })
        // 5. existing notification check for g-1/ghost-1
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              limit: vi.fn().mockResolvedValueOnce([]),
            }),
          }),
        });

      mockInsertValues.mockReturnValueOnce({
        returning: vi.fn().mockResolvedValueOnce([{ id: "notif-req-1" }]),
      });
      mockInsertValues.mockResolvedValueOnce(undefined);

      const res = await scanGhostMatchesForUser("u-target");

      expect(res.success).toBe(true);
      expect(res.matchedCount).toBe(1);
      expect(res.requests).toHaveLength(1);
      expect(res.requests[0]).toEqual({
        groupId: "g-1",
        ghostMemberId: "ghost-1",
        targetUserId: "u-target",
        requestId: "notif-req-1",
      });

      // 1. Pending merge request sent to admin
      expect(mockInsertValues).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-admin",
          type: "GROUP_GHOST_MERGE_REQUEST",
          data: expect.objectContaining({
            groupId: "g-1",
            ghostMemberId: "ghost-1",
            targetUserId: "u-target",
            requestingUserId: "u-target",
            status: "PENDING",
          }),
        })
      );

      // 2. Audit notification sent to target user
      expect(mockInsertValues).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "u-target",
          type: "GROUP_GHOST_MERGE_REQUEST_SENT",
          data: expect.objectContaining({
            groupId: "g-1",
            ghostMemberId: "ghost-1",
            targetUserId: "u-target",
            requestId: "notif-req-1",
          }),
        })
      );
    });

    it("scans unclaimed ghost slots and dispatches merge request when normalized phone matches", async () => {
      const targetUser = {
        id: "u-target",
        email: "bob@example.com",
        name: "Bob Builder",
        emailVerified: true,
      };

      const targetProfile = {
        id: "u-target",
        phone: "+1 (555) 019-2834",
        fullName: "Bob Builder",
      };

      const unclaimedGhostMembers = [
        {
          ghostMemberId: "ghost-2",
          ghostName: "555-019-2834",
          groupId: "g-2",
          groupName: "Work Lunch",
          groupAdminId: "admin-2",
        },
      ];

      mockDb.select
        // 1. userTable
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              limit: vi.fn().mockResolvedValueOnce([targetUser]),
            }),
          }),
        })
        // 2. profiles
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              limit: vi.fn().mockResolvedValueOnce([targetProfile]),
            }),
          }),
        })
        // 3. unclaimed ghost members
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            innerJoin: vi.fn().mockReturnValueOnce({
              where: vi.fn().mockResolvedValueOnce(unclaimedGhostMembers),
            }),
          }),
        })
        // 4. existing member check
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              limit: vi.fn().mockResolvedValueOnce([]),
            }),
          }),
        })
        // 5. existing notification check
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              limit: vi.fn().mockResolvedValueOnce([]),
            }),
          }),
        });

      mockInsertValues.mockReturnValueOnce({
        returning: vi.fn().mockResolvedValueOnce([{ id: "notif-req-2" }]),
      });
      mockInsertValues.mockResolvedValueOnce(undefined);

      const res = await scanGhostMatchesForUser("u-target");

      expect(res.success).toBe(true);
      expect(res.matchedCount).toBe(1);
      expect(mockInsertValues).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "admin-2",
          type: "GROUP_GHOST_MERGE_REQUEST",
        })
      );
    });

    it("scans contacts owned by group admin and matches contact phone to target user phone", async () => {
      const targetUser = {
        id: "u-target",
        email: "dave@example.com",
        name: "Dave",
        emailVerified: true,
      };

      const targetProfile = {
        id: "u-target",
        phone: "+15559998888",
        fullName: "Dave Smith",
      };

      const unclaimedGhostMembers = [
        {
          ghostMemberId: "ghost-5",
          ghostName: "Dave Ghost",
          groupId: "g-5",
          groupName: "Football Team",
          groupAdminId: "admin-5",
        },
      ];

      mockDb.select
        // 1. userTable
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              limit: vi.fn().mockResolvedValueOnce([targetUser]),
            }),
          }),
        })
        // 2. profiles
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              limit: vi.fn().mockResolvedValueOnce([targetProfile]),
            }),
          }),
        })
        // 3. unclaimed ghost members
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            innerJoin: vi.fn().mockReturnValueOnce({
              where: vi.fn().mockResolvedValueOnce(unclaimedGhostMembers),
            }),
          }),
        })
        // 4. existing member check
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              limit: vi.fn().mockResolvedValueOnce([]),
            }),
          }),
        })
        // 5. existing notification check
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              limit: vi.fn().mockResolvedValueOnce([]),
            }),
          }),
        })
        // 6. admin contacts check
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockResolvedValueOnce([
              { id: "c-10", userId: "admin-5", name: "Dave Ghost", phone: "+1 (555) 999-8888" },
            ]),
          }),
        });

      mockInsertValues.mockReturnValueOnce({
        returning: vi.fn().mockResolvedValueOnce([{ id: "notif-req-5" }]),
      });
      mockInsertValues.mockResolvedValueOnce(undefined);

      const res = await scanGhostMatchesForUser("u-target");

      expect(res.success).toBe(true);
      expect(res.matchedCount).toBe(1);
    });

    it("skips auto-matching if target user is already a member of the group", async () => {
      const targetUser = {
        id: "u-target",
        email: "carol@example.com",
        name: "Carol",
        emailVerified: true,
      };

      const unclaimedGhostMembers = [
        {
          ghostMemberId: "ghost-3",
          ghostName: "carol@example.com",
          groupId: "g-3",
          groupName: "Trip Group",
          groupAdminId: "admin-3",
        },
      ];

      mockDb.select
        // 1. userTable
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              limit: vi.fn().mockResolvedValueOnce([targetUser]),
            }),
          }),
        })
        // 2. profiles
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              limit: vi.fn().mockResolvedValueOnce([]),
            }),
          }),
        })
        // 3. unclaimed ghost members
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            innerJoin: vi.fn().mockReturnValueOnce({
              where: vi.fn().mockResolvedValueOnce(unclaimedGhostMembers),
            }),
          }),
        })
        // 4. existing member check (found! user already in group)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              limit: vi.fn().mockResolvedValueOnce([{ id: "gm-existing", userId: "u-target" }]),
            }),
          }),
        });

      const res = await scanGhostMatchesForUser("u-target");

      expect(res.success).toBe(true);
      expect(res.matchedCount).toBe(0);
      expect(mockInsertValues).not.toHaveBeenCalled();
    });

    it("skips duplicate merge request dispatch if a request already exists", async () => {
      const targetUser = {
        id: "u-target",
        email: "dave@example.com",
        name: "Dave",
        emailVerified: true,
      };

      const unclaimedGhostMembers = [
        {
          ghostMemberId: "ghost-4",
          ghostName: "dave@example.com",
          groupId: "g-4",
          groupName: "Party Group",
          groupAdminId: "admin-4",
        },
      ];

      mockDb.select
        // 1. userTable
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              limit: vi.fn().mockResolvedValueOnce([targetUser]),
            }),
          }),
        })
        // 2. profiles
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              limit: vi.fn().mockResolvedValueOnce([]),
            }),
          }),
        })
        // 3. unclaimed ghost members
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            innerJoin: vi.fn().mockReturnValueOnce({
              where: vi.fn().mockResolvedValueOnce(unclaimedGhostMembers),
            }),
          }),
        })
        // 4. existing member check (empty)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              limit: vi.fn().mockResolvedValueOnce([]),
            }),
          }),
        })
        // 5. existing notification check (found pending request with matching data!)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              limit: vi.fn().mockResolvedValueOnce([
                {
                  id: "existing-req-notif",
                  data: {
                    groupId: "g-4",
                    ghostMemberId: "ghost-4",
                    targetUserId: "u-target",
                  },
                },
              ]),
            }),
          }),
        });

      const res = await scanGhostMatchesForUser("u-target");

      expect(res.success).toBe(true);
      expect(res.matchedCount).toBe(0);
      expect(mockInsertValues).not.toHaveBeenCalled();
    });
  });
});
