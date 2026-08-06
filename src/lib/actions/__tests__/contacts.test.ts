import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockAuthSession } from "@/lib/__tests__/test-utils";

const { mockSelect, mockInsert, mockUpdate, mockDelete } = vi.hoisted(() => {
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();
  return { mockSelect, mockInsert, mockUpdate, mockDelete };
});

vi.mock("@/db", () => ({
  db: {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

import {
  getBusinessContacts,
  getPersonalPeople,
  addBusinessContact,
  addPersonalPerson,
  updateContact,
  deleteContact,
} from "../contacts";

describe("contacts server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthSession({ id: "user-1" });
  });

  describe("deleteContact", () => {
    it("throws Unauthorized if no user is authenticated", async () => {
      mockAuthSession(null);
      await expect(deleteContact("contact-1")).rejects.toThrow("Unauthorized");
    });

    it("throws explicit error when contact is not found or not owned by user", async () => {
      mockDelete.mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          returning: vi.fn().mockResolvedValueOnce([]),
        }),
      });

      await expect(deleteContact("contact-1")).rejects.toThrow(
        "Contact not found or unauthorized"
      );
    });

    it("returns contact id when deletion succeeds", async () => {
      mockDelete.mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          returning: vi.fn().mockResolvedValueOnce([{ id: "contact-1" }]),
        }),
      });

      const result = await deleteContact("contact-1");
      expect(result).toBe("contact-1");
    });
  });

  describe("updateContact", () => {
    it("throws Unauthorized if no user is authenticated", async () => {
      mockAuthSession(null);
      await expect(updateContact({ id: "contact-1", name: "New Name" })).rejects.toThrow(
        "Unauthorized"
      );
    });

    it("throws explicit error when contact is not found or not owned by user", async () => {
      mockUpdate.mockReturnValueOnce({
        set: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            returning: vi.fn().mockResolvedValueOnce([]),
          }),
        }),
      });

      await expect(updateContact({ id: "contact-1", name: "New Name" })).rejects.toThrow(
        "Contact not found or unauthorized"
      );
    });

    it("returns mapped contact when update succeeds", async () => {
      const mockUpdated = {
        id: "contact-1",
        name: "New Name",
        phone: null,
        type: "CUSTOMER",
        netBalance: "100.00",
        lastTransactionAt: new Date("2026-01-01T00:00:00Z"),
        businessId: null,
        imageUrl: null,
        transactionCount: 2,
      };

      mockUpdate.mockReturnValueOnce({
        set: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            returning: vi.fn().mockResolvedValueOnce([mockUpdated]),
          }),
        }),
      });

      const result = await updateContact({ id: "contact-1", name: "New Name" });
      expect(result.id).toBe("contact-1");
      expect(result.name).toBe("New Name");
    });
  });

  describe("getBusinessContacts", () => {
    it("throws Unauthorized if no user is authenticated", async () => {
      mockAuthSession(null);
      await expect(getBusinessContacts("biz-1")).rejects.toThrow("Unauthorized");
    });
  });

  describe("getPersonalPeople", () => {
    it("throws Unauthorized if no user is authenticated", async () => {
      mockAuthSession(null);
      await expect(getPersonalPeople()).rejects.toThrow("Unauthorized");
    });
  });

  describe("addBusinessContact", () => {
    it("throws Unauthorized if no user is authenticated", async () => {
      mockAuthSession(null);
      await expect(
        addBusinessContact({ name: "Biz Contact", type: "CUSTOMER", businessId: "biz-1" })
      ).rejects.toThrow("Unauthorized");
    });
  });

  describe("addPersonalPerson", () => {
    it("throws Unauthorized if no user is authenticated", async () => {
      mockAuthSession(null);
      await expect(addPersonalPerson({ name: "Person" })).rejects.toThrow("Unauthorized");
    });
  });
});
