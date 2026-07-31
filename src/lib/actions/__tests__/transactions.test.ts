import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockAuthSession } from "@/lib/__tests__/test-utils";

const { mockInsertValues, mockReturning, mockUpdateSet, mockDeleteWhere, mockTx, mockDb } =
  vi.hoisted(() => {
    const mockInsertValues = vi.fn();
    const mockReturning = vi.fn();
    const mockUpdateSet = vi.fn();
    const mockDeleteWhere = vi.fn();

    const mockTx = {
      insert: vi.fn(() => ({
        values: mockInsertValues,
      })),
    };

    const mockDb = {
      transaction: vi.fn(async (cb: any) => cb(mockTx)),
      query: {
        transactions: {
          findMany: vi.fn(),
          findFirst: vi.fn(),
        },
      },
      update: vi.fn(() => ({
        set: mockUpdateSet,
      })),
      delete: vi.fn(() => ({
        where: mockDeleteWhere,
      })),
    };

    return {
      mockInsertValues,
      mockReturning,
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
  createTransactionAction,
  getTransactionsAction,
  getPersonalTransactionsAction,
  getUnifiedTransactionsAction,
  updateTransactionAction,
  deleteTransactionAction,
} from "../transactions";

describe("Transactions Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthSession({ id: "user-1" });
  });

  describe("createTransactionAction", () => {
    it("throws Unauthorized if no session user is found", async () => {
      mockAuthSession(null);
      await expect(
        createTransactionAction({
          amount: 5000,
          flow: "OUT",
          mode: "PERSONAL",
          name: "Lunch",
          date: new Date(),
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("creates transaction and splits atomically using Drizzle transaction", async () => {
      const mockCreatedTx = { id: "tx-123", name: "Lunch", amount: "5000" };
      mockInsertValues
        .mockReturnValueOnce({
          returning: vi.fn().mockResolvedValue([mockCreatedTx]),
        })
        .mockReturnValueOnce(Promise.resolve());

      const result = await createTransactionAction({
        amount: 5000,
        flow: "OUT",
        mode: "PERSONAL",
        name: "Lunch",
        date: new Date("2026-07-31"),
        splits: [
          {
            userId: "user-2",
            amount: 2500,
            memberNameSnapshot: "Bob",
          },
        ],
      });

      expect(mockDb.transaction).toHaveBeenCalled();
      expect(result).toEqual({
        id: "tx-123",
        success: true,
        transaction: mockCreatedTx,
      });
      expect(mockTx.insert).toHaveBeenCalledTimes(2);
    });
  });

  describe("getTransactionsAction", () => {
    it("throws Unauthorized if no user provided", async () => {
      mockAuthSession(null);
      await expect(getTransactionsAction()).rejects.toThrow("Unauthorized");
    });

    it("returns formatted transactions with joined relations", async () => {
      const mockTxData = [
        {
          id: "tx-1",
          userId: "user-1",
          amount: "15000",
          flow: "OUT",
          mode: "PERSONAL",
          name: "Groceries",
          date: new Date("2026-07-31"),
          category: { name: "Food", icon: "🛒" },
          account: { name: "Cash", type: "CASH" },
          contact: null,
          group: null,
          payer: null,
          splits: [],
        },
      ];

      mockDb.query.transactions.findMany.mockResolvedValueOnce(mockTxData);

      const result = await getTransactionsAction({ mode: "PERSONAL" });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("tx-1");
      expect(result[0].amount).toBe(15000);
      expect(result[0].category?.name).toBe("Food");
    });
  });

  describe("getPersonalTransactionsAction", () => {
    it("queries personal transactions for the logged-in user", async () => {
      mockDb.query.transactions.findMany.mockResolvedValueOnce([
        {
          id: "tx-p1",
          userId: "user-1",
          amount: "2000",
          flow: "OUT",
          mode: "PERSONAL",
          name: "Coffee",
          date: new Date("2026-07-31"),
          category: { name: "Food", icon: "☕" },
          account: { name: "Wallet", type: "CASH" },
          contact: null,
          group: null,
        },
      ]);

      const result = await getPersonalTransactionsAction({});
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Coffee");
      expect(result[0].amount).toBe(2000);
    });
  });

  describe("getUnifiedTransactionsAction", () => {
    it("fetches unified feed for user", async () => {
      mockDb.query.transactions.findMany.mockResolvedValueOnce([
        {
          id: "tx-u1",
          userId: "user-1",
          amount: "50000",
          flow: "IN",
          mode: "PERSONAL",
          name: "Salary",
          date: new Date("2026-07-31"),
          category: null,
          account: null,
          contact: null,
          group: null,
          payer: null,
          splits: [],
        },
      ]);

      const result = await getUnifiedTransactionsAction({});
      expect(result).toHaveLength(1);
      expect(result[0].amount).toBe(50000);
    });
  });

  describe("updateTransactionAction", () => {
    it("throws error if transaction does not exist or user is unauthorized", async () => {
      mockDb.query.transactions.findFirst.mockResolvedValueOnce(null);

      await expect(
        updateTransactionAction({
          id: "tx-missing",
          amount: 1000,
          flow: "OUT",
          mode: "PERSONAL",
          name: "Updated",
          date: new Date(),
        })
      ).rejects.toThrow("Unauthorized or transaction not found");
    });

    it("updates transaction if owned by user", async () => {
      mockDb.query.transactions.findFirst.mockResolvedValueOnce({
        id: "tx-1",
        userId: "user-1",
      });

      const updatedRow = { id: "tx-1", name: "Updated Name" };
      mockUpdateSet.mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          returning: vi.fn().mockResolvedValueOnce([updatedRow]),
        }),
      });

      const result = await updateTransactionAction({
        id: "tx-1",
        amount: 2000,
        flow: "OUT",
        mode: "PERSONAL",
        name: "Updated Name",
        date: new Date(),
      });

      expect(result).toEqual(updatedRow);
    });
  });

  describe("deleteTransactionAction", () => {
    it("throws error if transaction does not exist or owned by another user", async () => {
      mockDb.query.transactions.findFirst.mockResolvedValueOnce(null);

      await expect(deleteTransactionAction("tx-other")).rejects.toThrow(
        "Unauthorized or transaction not found"
      );
    });

    it("deletes transaction if owned by user", async () => {
      mockDb.query.transactions.findFirst.mockResolvedValueOnce({
        id: "tx-1",
        userId: "user-1",
      });

      mockDeleteWhere.mockResolvedValueOnce(undefined);

      const result = await deleteTransactionAction("tx-1");
      expect(result).toEqual({ success: true });
    });
  });
});
