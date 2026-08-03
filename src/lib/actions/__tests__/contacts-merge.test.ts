import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockInsertValues,
  mockUpdateSet,
  mockTx,
  mockDb,
} = vi.hoisted(() => {
  const mockInsertValues = vi.fn();
  const mockUpdateSet = vi.fn();

  const mockTx = {
    select: vi.fn(),
    insert: vi.fn(() => ({
      values: mockInsertValues,
    })),
    update: vi.fn(() => ({
      set: mockUpdateSet,
    })),
  };

  const mockDb = {
    transaction: vi.fn(async (cb: any) => cb(mockTx)),
    select: vi.fn(),
  };

  return {
    mockInsertValues,
    mockUpdateSet,
    mockTx,
    mockDb,
  };
});

vi.mock("@/db", () => ({
  db: mockDb,
}));

vi.mock("@/lib/auth-session", () => ({
  getSessionUser: vi.fn(),
}));

import { mergeContactToUserProfile } from "../contacts";
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

describe("mergeContactToUserProfile Server Action", () => {
  const mockGetSessionUser = vi.mocked(getSessionUser);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws error if contact is not found", async () => {
    mockGetSessionUser.mockResolvedValueOnce(makeSessionUser("user-owner"));
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          limit: vi.fn().mockResolvedValueOnce([]),
        }),
      }),
    });

    await expect(
      mergeContactToUserProfile("non-existent-contact", "user-target")
    ).rejects.toThrow("Contact not found");
  });

  it("throws error if target user profile is not found", async () => {
    mockGetSessionUser.mockResolvedValueOnce(makeSessionUser("user-owner"));

    // 1. contact query
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          limit: vi.fn().mockResolvedValueOnce([
            { id: "c-1", userId: "user-owner", name: "Alice", netBalance: "100.00" },
          ]),
        }),
      }),
    });

    // 2. target user query (not found)
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          limit: vi.fn().mockResolvedValueOnce([]),
        }),
      }),
    });

    await expect(
      mergeContactToUserProfile("c-1", "non-existent-target")
    ).rejects.toThrow("Target user profile not found");
  });

  it("fails 09a guards if caller is neither owner nor target user", async () => {
    mockGetSessionUser.mockResolvedValueOnce(makeSessionUser("user-unrelated"));

    // 1. contact query
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          limit: vi.fn().mockResolvedValueOnce([
            { id: "c-1", userId: "user-owner", name: "Alice" },
          ]),
        }),
      }),
    });

    // 2. target user query
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          limit: vi.fn().mockResolvedValueOnce([
            { id: "user-target", emailVerified: true },
          ]),
        }),
      }),
    });

    // 3. profile query
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          limit: vi.fn().mockResolvedValueOnce([{ phone: "+123456789" }]),
        }),
      }),
    });

    await expect(mergeContactToUserProfile("c-1", "user-target")).rejects.toThrow(
      "Unauthorized: Caller must be contact owner or target user"
    );
  });

  it("fails 09a guards on self-merge attempt", async () => {
    mockGetSessionUser.mockResolvedValueOnce(makeSessionUser("user-owner"));

    // 1. contact query
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          limit: vi.fn().mockResolvedValueOnce([
            { id: "c-1", userId: "user-owner", name: "Self Contact" },
          ]),
        }),
      }),
    });

    // 2. target user query
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          limit: vi.fn().mockResolvedValueOnce([
            { id: "user-owner", emailVerified: true },
          ]),
        }),
      }),
    });

    // 3. profile query
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          limit: vi.fn().mockResolvedValueOnce([{ phone: null }]),
        }),
      }),
    });

    await expect(mergeContactToUserProfile("c-1", "user-owner")).rejects.toThrow(
      "Invalid merge: Cannot merge contact into owner profile"
    );
  });

  it("fails 09a guards if target profile is unverified", async () => {
    mockGetSessionUser.mockResolvedValueOnce(makeSessionUser("user-owner"));

    // 1. contact query
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          limit: vi.fn().mockResolvedValueOnce([
            { id: "c-1", userId: "user-owner", name: "Alice" },
          ]),
        }),
      }),
    });

    // 2. target user query (email unverified)
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          limit: vi.fn().mockResolvedValueOnce([
            { id: "user-target", emailVerified: false },
          ]),
        }),
      }),
    });

    // 3. profile query (no phone)
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          limit: vi.fn().mockResolvedValueOnce([{ phone: null }]),
        }),
      }),
    });

    await expect(mergeContactToUserProfile("c-1", "user-target")).rejects.toThrow(
      "Invalid merge: Target profile must have verified phone or email"
    );
  });

  it("merges contact, creates ACCEPTED friendship, and emits audit notification atomically", async () => {
    mockGetSessionUser.mockResolvedValueOnce(makeSessionUser("user-owner"));

    const existingContact = {
      id: "c-1",
      userId: "user-owner",
      name: "Alice Custom Name",
      phone: "+1987654321",
      type: "CUSTOMER",
      netBalance: "250.50",
      lastTransactionAt: new Date("2026-01-01T00:00:00Z"),
      businessId: null,
      imageUrl: "https://example.com/avatar.jpg",
      transactionCount: 5,
      inviteToken: "token-123",
      linkedUserId: null,
    };

    // 1. contact query
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          limit: vi.fn().mockResolvedValueOnce([existingContact]),
        }),
      }),
    });

    // 2. target user query
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          limit: vi.fn().mockResolvedValueOnce([
            { id: "user-target", emailVerified: true },
          ]),
        }),
      }),
    });

    // 3. profile query
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          limit: vi.fn().mockResolvedValueOnce([{ phone: "+1234567890" }]),
        }),
      }),
    });

    // Inside transaction:
    // tx.update(contacts) returning updated contact
    const updatedContactRecord = {
      ...existingContact,
      linkedUserId: "user-target",
    };
    mockUpdateSet.mockReturnValueOnce({
      where: vi.fn().mockReturnValueOnce({
        returning: vi.fn().mockResolvedValueOnce([updatedContactRecord]),
      }),
    });

    // tx.select(friendships) -> no existing friendship
    mockTx.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          limit: vi.fn().mockResolvedValueOnce([]),
        }),
      }),
    });

    mockInsertValues.mockResolvedValue(undefined);

    const result = await mergeContactToUserProfile("c-1", "user-target");

    expect(mockDb.transaction).toHaveBeenCalled();

    // Verify metadata & net balance preserved
    expect(result).toEqual({
      id: "c-1",
      name: "Alice Custom Name",
      phone: "+1987654321",
      type: "CUSTOMER",
      net_balance: 250.5,
      last_transaction_at: "2026-01-01T00:00:00.000Z",
      business_id: null,
      image_url: "https://example.com/avatar.jpg",
      transaction_count: 5,
      invite_token: "token-123",
      linked_user_id: "user-target",
    });

    // Verify friendship insertion and notification insertion
    expect(mockTx.insert).toHaveBeenCalledTimes(2);
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "ACCEPTED",
      })
    );
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-owner",
        type: "CONTACT_MERGED",
        title: "Contact Merged",
      })
    );
  });

  it("updates existing PENDING friendship to ACCEPTED during merge", async () => {
    mockGetSessionUser.mockResolvedValueOnce(makeSessionUser("user-target"));

    const existingContact = {
      id: "c-1",
      userId: "user-owner",
      name: "Bob",
      netBalance: "0.00",
      linkedUserId: null,
    };

    // 1. contact query
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          limit: vi.fn().mockResolvedValueOnce([existingContact]),
        }),
      }),
    });

    // 2. target user query
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          limit: vi.fn().mockResolvedValueOnce([
            { id: "user-target", emailVerified: true },
          ]),
        }),
      }),
    });

    // 3. profile query
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          limit: vi.fn().mockResolvedValueOnce([]),
        }),
      }),
    });

    // tx.update(contacts) returning updated contact
    mockUpdateSet.mockReturnValueOnce({
      where: vi.fn().mockReturnValueOnce({
        returning: vi.fn().mockResolvedValueOnce([{ ...existingContact, linkedUserId: "user-target" }]),
      }),
    });

    // tx.select(friendships) -> existing pending friendship
    mockTx.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          limit: vi.fn().mockResolvedValueOnce([
            { id: "f-pending", status: "PENDING", userId1: "user-owner", userId2: "user-target" },
          ]),
        }),
      }),
    });

    // tx.update(friendships) setting status ACCEPTED
    mockUpdateSet.mockReturnValueOnce({
      where: vi.fn().mockResolvedValueOnce(undefined),
    });

    mockInsertValues.mockResolvedValueOnce(undefined);

    await mergeContactToUserProfile("c-1", "user-target");

    expect(mockUpdateSet).toHaveBeenCalledWith({ status: "ACCEPTED" });
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-owner",
        type: "CONTACT_MERGED",
      })
    );
  });
});
