import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockInsertValues,
  mockReturning,
  mockUpdateSet,
  mockDeleteWhere,
  mockTx,
  mockDb,
} = vi.hoisted(() => {
  const mockInsertValues = vi.fn();
  const mockReturning = vi.fn();
  const mockUpdateSet = vi.fn();
  const mockDeleteWhere = vi.fn();

  const mockTx = {
    insert: vi.fn(() => ({
      values: mockInsertValues,
    })),
    update: vi.fn(() => ({
      set: mockUpdateSet,
    })),
    query: {
      goals: {
        findFirst: vi.fn(),
      },
    },
  };

  const mockDb = {
    transaction: vi.fn(async (cb: any) => cb(mockTx)),
    query: {
      goals: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: mockInsertValues,
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
  createGoalAction,
  getGoalsAction,
  contributeGoalAction,
  deleteGoalAction,
} from "../goals";

describe("Goals Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createGoalAction", () => {
    it("throws Unauthorized if no session user is found", async () => {
      await expect(
        createGoalAction({
          name: "New Laptop",
          targetAmount: 5000000,
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("creates a new goal and returns formatted goal object", async () => {
      const mockGoal = {
        id: "goal-1",
        userId: "user-1",
        name: "New Laptop",
        targetAmount: "5000000",
        currentAmount: "0",
        deadline: new Date("2026-12-31"),
      };

      mockInsertValues.mockReturnValueOnce({
        returning: vi.fn().mockResolvedValue([mockGoal]),
      });

      const result = await createGoalAction(
        {
          name: "New Laptop",
          targetAmount: 5000000,
          deadline: "2026-12-31",
        },
        "user-1"
      );

      expect(result).toEqual({
        id: "goal-1",
        name: "New Laptop",
        target_amount: 5000000,
        current_amount: 0,
        deadline: mockGoal.deadline.toISOString(),
      });
    });
  });

  describe("getGoalsAction", () => {
    it("throws Unauthorized if no session user is found", async () => {
      await expect(getGoalsAction()).rejects.toThrow("Unauthorized");
    });

    it("returns goals for the user", async () => {
      const mockGoals = [
        {
          id: "goal-1",
          userId: "user-1",
          name: "Emergency Fund",
          targetAmount: "10000000",
          currentAmount: "2500000",
          deadline: new Date("2026-08-31"),
        },
      ];

      mockDb.query.goals.findMany.mockResolvedValueOnce(mockGoals);

      const result = await getGoalsAction("user-1");
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "goal-1",
        name: "Emergency Fund",
        target_amount: 10000000,
        current_amount: 2500000,
        deadline: mockGoals[0].deadline.toISOString(),
      });
    });
  });

  describe("contributeGoalAction", () => {
    it("throws Unauthorized if no session user is found", async () => {
      await expect(
        contributeGoalAction({ id: "goal-1", amount: 10000 })
      ).rejects.toThrow("Unauthorized");
    });

    it("throws error if goal is not found or user unauthorized", async () => {
      mockTx.query.goals.findFirst.mockResolvedValueOnce(null);

      await expect(
        contributeGoalAction({ id: "goal-missing", amount: 10000 }, "user-1")
      ).rejects.toThrow("Goal not found or unauthorized");
    });

    it("throws overcontribution error if contribution exceeds target amount", async () => {
      mockTx.query.goals.findFirst.mockResolvedValueOnce({
        id: "goal-1",
        userId: "user-1",
        targetAmount: "50000",
        currentAmount: "45000",
      });

      await expect(
        contributeGoalAction({ id: "goal-1", amount: 10000 }, "user-1")
      ).rejects.toThrow("Contribution would exceed goal target");
    });

    it("atomically updates goal balance and records contribution in transaction", async () => {
      const existingGoal = {
        id: "goal-1",
        userId: "user-1",
        name: "Vacation",
        targetAmount: "5000000",
        currentAmount: "1000000",
        deadline: new Date("2026-10-01"),
      };

      const updatedGoal = {
        ...existingGoal,
        currentAmount: "2000000",
      };

      mockTx.query.goals.findFirst.mockResolvedValueOnce(existingGoal);

      mockUpdateSet.mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          returning: vi.fn().mockResolvedValueOnce([updatedGoal]),
        }),
      });

      mockInsertValues.mockResolvedValueOnce(undefined);

      const result = await contributeGoalAction(
        { id: "goal-1", amount: 1000000 },
        "user-1"
      );

      expect(mockDb.transaction).toHaveBeenCalled();
      expect(result).toEqual({
        id: "goal-1",
        name: "Vacation",
        target_amount: 5000000,
        current_amount: 2000000,
        deadline: existingGoal.deadline.toISOString(),
      });
    });
  });

  describe("deleteGoalAction", () => {
    it("throws error if goal is not found or owned by another user", async () => {
      mockDb.query.goals.findFirst.mockResolvedValueOnce(null);

      await expect(deleteGoalAction("goal-other", "user-1")).rejects.toThrow(
        "Unauthorized or goal not found"
      );
    });

    it("deletes goal if owned by user", async () => {
      mockDb.query.goals.findFirst.mockResolvedValueOnce({
        id: "goal-1",
        userId: "user-1",
      });

      mockDeleteWhere.mockResolvedValueOnce(undefined);

      const result = await deleteGoalAction("goal-1", "user-1");
      expect(result).toEqual({ success: true });
    });
  });
});
