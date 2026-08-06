import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockAuthSession } from "@/lib/__tests__/test-utils";

const {
  mockSelectFrom,
  mockInsertValues,
  mockUpdateSet,
  mockUpdateWhere,
  mockDeleteWhere,
  mockTx,
  mockDb,
} = vi.hoisted(() => {
  const mockInsertValues = vi.fn();
  const mockUpdateWhere = vi.fn().mockResolvedValue([]);
  const mockUpdateSet = vi.fn(() => ({
    where: mockUpdateWhere,
  }));
  const mockDeleteWhere = vi.fn();
  const mockSelectFrom = vi.fn();

  const mockTx = {
    insert: vi.fn(() => ({
      values: mockInsertValues,
    })),
    update: vi.fn(() => ({
      set: mockUpdateSet,
    })),
  };

  const mockDb = {
    transaction: vi.fn(async (cb: any) => cb(mockTx)),
    select: vi.fn(() => ({
      from: mockSelectFrom,
    })),
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

  return {
    mockSelectFrom,
    mockInsertValues,
    mockUpdateSet,
    mockUpdateWhere,
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

import { calculateNextRunDate } from "@/lib/recurring-utils";
import {
  processDueRecurringTransactions,
  getRecurringTransactions,
  addRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
} from "../recurring";

describe("Recurring Transactions Actions & Generator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthSession({ id: "user-1" });
  });

  describe("calculateNextRunDate", () => {
    it("calculates next date for DAILY frequency", () => {
      const start = new Date("2026-01-01T10:00:00Z");
      const next = calculateNextRunDate(start, "DAILY", "CALENDAR", start);
      expect(next.toISOString()).toBe(new Date("2026-01-02T10:00:00Z").toISOString());
    });

    it("calculates next date for WEEKLY frequency", () => {
      const start = new Date("2026-01-01T10:00:00Z");
      const next = calculateNextRunDate(start, "WEEKLY", "CALENDAR", start);
      expect(next.toISOString()).toBe(new Date("2026-01-08T10:00:00Z").toISOString());
    });

    it("handles MONTHLY in CALENDAR mode (snapping back to original start day)", () => {
      const startDate = new Date("2026-01-31T10:00:00Z");
      
      // Jan 31 -> Feb 28
      const febRun = calculateNextRunDate(startDate, "MONTHLY", "CALENDAR", startDate);
      expect(febRun.getDate()).toBe(28);
      expect(febRun.getMonth()).toBe(1); // Feb

      // Feb 28 -> Mar 31 (snaps back to 31st target)
      const marRun = calculateNextRunDate(febRun, "MONTHLY", "CALENDAR", startDate);
      expect(marRun.getDate()).toBe(31);
      expect(marRun.getMonth()).toBe(2); // Mar
    });

    it("handles MONTHLY in FIXED_INTERVAL mode (stays on shifted day)", () => {
      const startDate = new Date("2026-01-31T10:00:00Z");
      
      // Jan 31 -> Feb 28
      const febRun = calculateNextRunDate(startDate, "MONTHLY", "FIXED_INTERVAL", startDate);
      expect(febRun.getDate()).toBe(28);

      // Feb 28 -> Mar 28 (stays on 28th)
      const marRun = calculateNextRunDate(febRun, "MONTHLY", "FIXED_INTERVAL", startDate);
      expect(marRun.getDate()).toBe(28);
    });

    it("handles YEARLY in CALENDAR mode (leap year snap-back)", () => {
      const startDate = new Date("2024-02-29T10:00:00Z"); // Leap year
      
      // 2024 Feb 29 -> 2025 Feb 28
      const y1 = calculateNextRunDate(startDate, "YEARLY", "CALENDAR", startDate);
      expect(y1.getFullYear()).toBe(2025);
      expect(y1.getMonth()).toBe(1);
      expect(y1.getDate()).toBe(28);

      // 2027 Feb 28 -> 2028 Feb 29 (leap year target restored)
      const y3Input = new Date("2027-02-28T10:00:00Z");
      const y4 = calculateNextRunDate(y3Input, "YEARLY", "CALENDAR", startDate);
      expect(y4.getFullYear()).toBe(2028);
      expect(y4.getMonth()).toBe(1);
      expect(y4.getDate()).toBe(29);
    });
  });

  describe("processDueRecurringTransactions", () => {
    it("creates ledger transactions and updates rule dates atomically", async () => {
      const dueRule = {
        id: "rec-1",
        userId: "user-1",
        name: "Netflix",
        amount: "19900", // ₹199
        flow: "OUT",
        frequency: "MONTHLY",
        scheduleMode: "CALENDAR",
        startDate: new Date("2026-01-01T00:00:00Z"),
        nextRunDate: new Date("2026-01-01T00:00:00Z"),
        active: true,
        failureCount: 0,
        lastFailureReason: null,
      };

      mockSelectFrom.mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          orderBy: vi.fn().mockResolvedValueOnce([dueRule]),
        }),
      });

      mockInsertValues.mockResolvedValueOnce([]);
      mockUpdateSet.mockReturnValueOnce({
        where: vi.fn().mockResolvedValueOnce([]),
      });

      const res = await processDueRecurringTransactions("user-1");

      expect(mockDb.transaction).toHaveBeenCalled();
      expect(mockTx.insert).toHaveBeenCalled();
      expect(mockTx.update).toHaveBeenCalled();
      expect(res.processedCount).toBeGreaterThanOrEqual(1);
      expect(res.errorCount).toBe(0);
    });

    it("caps catch-up loop at 50 iterations per rule", async () => {
      const ancientRule = {
        id: "rec-ancient",
        userId: "user-1",
        name: "Daily Coffee",
        amount: "5000",
        flow: "OUT",
        frequency: "DAILY",
        scheduleMode: "CALENDAR",
        startDate: new Date("2020-01-01T00:00:00Z"),
        nextRunDate: new Date("2020-01-01T00:00:00Z"),
        active: true,
        failureCount: 0,
        lastFailureReason: null,
      };

      mockSelectFrom.mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          orderBy: vi.fn().mockResolvedValueOnce([ancientRule]),
        }),
      });

      mockInsertValues.mockResolvedValue([]);
      mockUpdateSet.mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      });

      const res = await processDueRecurringTransactions("user-1");

      expect(res.processedCount).toBe(50);
    });

    it("implements Circuit Breaker: pauses rule after 3 consecutive failures", async () => {
      const failingRule = {
        id: "rec-failing",
        userId: "user-1",
        name: "Failing Rule",
        amount: "1000",
        flow: "OUT",
        frequency: "DAILY",
        scheduleMode: "CALENDAR",
        startDate: new Date("2026-01-01T00:00:00Z"),
        nextRunDate: new Date("2026-01-01T00:00:00Z"),
        active: true,
        failureCount: 2, // 2 failures already
        lastFailureReason: "Prev error",
      };

      mockSelectFrom.mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          orderBy: vi.fn().mockResolvedValueOnce([failingRule]),
        }),
      });

      // Transaction throws error
      mockDb.transaction.mockRejectedValueOnce(new Error("Database write error"));

      const updateSetSpy = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      });
      mockUpdateSet.mockImplementation(updateSetSpy);

      const res = await processDueRecurringTransactions("user-1");

      expect(res.errorCount).toBe(1);
      expect(updateSetSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          failureCount: 3,
          lastFailureReason: "Database write error",
          active: false,
        })
      );
    });
  });

  describe("CRUD Server Actions", () => {
    it("addRecurringTransaction sets default scheduleMode CALENDAR", async () => {
      const insertedRow = {
        id: "rec-new",
        name: "Gym",
        scheduleMode: "CALENDAR",
      };
      mockInsertValues.mockReturnValueOnce({
        returning: vi.fn().mockResolvedValueOnce([insertedRow]),
      });

      const res = await addRecurringTransaction({
        name: "Gym",
        amount: 1500,
        flow: "OUT",
        frequency: "MONTHLY",
        start_date: "2026-08-01T00:00:00Z",
        next_run_date: "2026-08-01T00:00:00Z",
      });

      expect(res).toEqual(insertedRow);
      expect(mockInsertValues).toHaveBeenCalledWith(
        expect.objectContaining({
          scheduleMode: "CALENDAR",
        })
      );
    });

    it("updateRecurringTransaction resets circuit breaker state when active: true is explicitly passed", async () => {
      const updatedRow = { id: "rec-1", name: "Gym", active: true, failureCount: 0, lastFailureReason: null };
      mockUpdateSet.mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          returning: vi.fn().mockResolvedValueOnce([updatedRow]),
        }),
      });

      const res = await updateRecurringTransaction("rec-1", {
        name: "Gym Updated",
        amount: 2000,
        flow: "OUT",
        frequency: "MONTHLY",
        schedule_mode: "FIXED_INTERVAL",
        active: true,
      });

      expect(res).toEqual(updatedRow);
      expect(mockUpdateSet).toHaveBeenCalledWith({
        name: "Gym Updated",
        amount: "200000",
        flow: "OUT",
        frequency: "MONTHLY",
        scheduleMode: "FIXED_INTERVAL",
        active: true,
        failureCount: 0,
        lastFailureReason: null,
      });
    });

    it("updateRecurringTransaction retains circuit breaker state when active is omitted", async () => {
      const updatedRow = { id: "rec-1", name: "Gym Updated", failureCount: 3, lastFailureReason: "Account missing" };
      mockUpdateSet.mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          returning: vi.fn().mockResolvedValueOnce([updatedRow]),
        }),
      });

      const res = await updateRecurringTransaction("rec-1", {
        name: "Gym Updated",
        amount: 2000,
      });

      expect(res).toEqual(updatedRow);
      expect(mockUpdateSet).toHaveBeenCalledWith({
        name: "Gym Updated",
        amount: "200000",
      });
      expect(mockUpdateSet).not.toHaveBeenCalledWith(
        expect.objectContaining({
          failureCount: expect.anything(),
        })
      );
    });

    it("deleteRecurringTransaction deletes rule for user", async () => {
      const deletedRow = { id: "rec-1" };
      mockDeleteWhere.mockReturnValueOnce({
        returning: vi.fn().mockResolvedValueOnce([deletedRow]),
      });

      const res = await deleteRecurringTransaction("rec-1");
      expect(res).toEqual(deletedRow);
    });
  });
});
