import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockAuthSession } from "@/lib/__tests__/test-utils";

const { mockSelect } = vi.hoisted(() => {
  const mockSelect = vi.fn();
  return { mockSelect };
});

vi.mock("@/db", () => ({
  db: {
    select: mockSelect,
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

import { getBudgets } from "../categories";

describe("getBudgets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthSession({ id: "user-1" });
  });

  it("throws Unauthorized if no session user is found", async () => {
    mockAuthSession(null);
    await expect(getBudgets()).rejects.toThrow("Unauthorized");
  });

  it("converts accumulated category transaction totals from paise to Rupees", async () => {
    const mockCategories = [
      {
        id: "cat-1",
        userId: "user-1",
        name: "Food",
        icon: "🍔",
        type: "EXPENSE",
        budgetLimit: "5000", // ₹5000 limit
        active: true,
      },
      {
        id: "cat-2",
        userId: "user-1",
        name: "Transport",
        icon: "🚗",
        type: "EXPENSE",
        budgetLimit: "2000", // ₹2000 limit
        active: true,
      },
    ];

    // Transactions stored in paise: 250000 paise = ₹2500, 150000 paise = ₹1500
    const mockTransactions = [
      { categoryId: "cat-1", amount: "250000" },
      { categoryId: "cat-2", amount: "150000" },
    ];

    // First select call is for categories, second for transactions
    mockSelect
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockResolvedValueOnce(mockCategories),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockResolvedValueOnce(mockTransactions),
        }),
      });

    const result = await getBudgets();

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: "cat-1",
      name: "Food",
      icon: "🍔",
      budget_limit: 5000,
      spent: 2500, // ₹2500 (converted from 250000 paise)
    });
    expect(result[1]).toEqual({
      id: "cat-2",
      name: "Transport",
      icon: "🚗",
      budget_limit: 2000,
      spent: 1500, // ₹1500 (converted from 150000 paise)
    });
  });

  it("returns 0 spent when category has no transactions", async () => {
    const mockCategories = [
      {
        id: "cat-1",
        userId: "user-1",
        name: "Food",
        icon: "🍔",
        type: "EXPENSE",
        budgetLimit: "5000",
        active: true,
      },
    ];

    mockSelect
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockResolvedValueOnce(mockCategories),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockResolvedValueOnce([]),
        }),
      });

    const result = await getBudgets();

    expect(result[0]).toEqual({
      id: "cat-1",
      name: "Food",
      icon: "🍔",
      budget_limit: 5000,
      spent: 0,
    });
  });
});
