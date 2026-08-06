"use server";

import { db } from "@/db";
import { categories, transactions } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and, asc, desc, gte, sql } from "drizzle-orm";
import { addPaise, paiseToRupees } from "@/lib/currency";

async function getAuthenticatedUser(reqHeaders?: Headers) {
  const h = reqHeaders ?? (await headers());
  const session = await auth.api.getSession({ headers: h });
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function getCategories() {
  const user = await getAuthenticatedUser();

  const data = await db
    .select()
    .from(categories)
    .where(eq(categories.userId, user.id))
    .orderBy(desc(categories.active), asc(categories.name));

  return data.map((cat) => ({
    id: cat.id,
    user_id: cat.userId,
    name: cat.name,
    icon: cat.icon ?? "💰",
    type: (cat.type as "INCOME" | "EXPENSE") || "EXPENSE",
    budget_limit: cat.budgetLimit ? parseFloat(cat.budgetLimit) : null,
    active: cat.active ?? true,
    created_at: cat.createdAt?.toISOString() ?? new Date().toISOString(),
  }));
}

export async function createCategory(params: {
  name: string;
  icon: string;
  type: "INCOME" | "EXPENSE";
}) {
  const user = await getAuthenticatedUser();

  const [inserted] = await db
    .insert(categories)
    .values({
      userId: user.id,
      name: params.name,
      icon: params.icon,
      type: params.type,
      active: true,
    })
    .returning();

  return {
    id: inserted.id,
    user_id: inserted.userId,
    name: inserted.name,
    icon: inserted.icon ?? "💰",
    type: inserted.type,
    active: inserted.active ?? true,
  };
}

export async function updateCategory(params: {
  id: string;
  name?: string;
  icon?: string;
  type?: "INCOME" | "EXPENSE";
  budgetLimit?: number | null;
  active?: boolean;
}) {
  const user = await getAuthenticatedUser();

  const updateData: Record<string, unknown> = {};
  if (params.name !== undefined) updateData.name = params.name;
  if (params.icon !== undefined) updateData.icon = params.icon;
  if (params.type !== undefined) updateData.type = params.type;
  if (params.budgetLimit !== undefined) updateData.budgetLimit = params.budgetLimit?.toString() ?? null;
  if (params.active !== undefined) updateData.active = params.active;

  const [updated] = await db
    .update(categories)
    .set(updateData)
    .where(and(eq(categories.id, params.id), eq(categories.userId, user.id)))
    .returning();

  if (!updated) {
    throw new Error("Category not found or unauthorized");
  }

  return {
    id: updated.id,
    user_id: updated.userId,
    name: updated.name,
    icon: updated.icon ?? "💰",
    type: updated.type,
    budget_limit: updated.budgetLimit ? parseFloat(updated.budgetLimit) : null,
    active: updated.active ?? true,
  };
}

export async function getCategoryTransactionCount(categoryId: string) {
  const user = await getAuthenticatedUser();

  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(transactions)
    .where(and(eq(transactions.categoryId, categoryId), eq(transactions.userId, user.id)));

  return result[0]?.count ?? 0;
}

export async function deleteCategory(params: {
  id: string;
  targetCategoryId?: string;
}) {
  const user = await getAuthenticatedUser();

  return await db.transaction(async (tx) => {
    // 1. Reassign transactions if any
    if (params.targetCategoryId === "uncategorized" || !params.targetCategoryId) {
      await tx
        .update(transactions)
        .set({ categoryId: null })
        .where(and(eq(transactions.categoryId, params.id), eq(transactions.userId, user.id)));
    } else {
      await tx
        .update(transactions)
        .set({ categoryId: params.targetCategoryId })
        .where(and(eq(transactions.categoryId, params.id), eq(transactions.userId, user.id)));
    }

    // 2. Delete category
    const [deleted] = await tx
      .delete(categories)
      .where(and(eq(categories.id, params.id), eq(categories.userId, user.id)))
      .returning();

    return deleted;
  });
}

export async function disableCategory(params: {
  id: string;
  targetCategoryId?: string;
}) {
  const user = await getAuthenticatedUser();

  return await db.transaction(async (tx) => {
    if (params.targetCategoryId && params.targetCategoryId !== "uncategorized") {
      await tx
        .update(transactions)
        .set({ categoryId: params.targetCategoryId })
        .where(and(eq(transactions.categoryId, params.id), eq(transactions.userId, user.id)));
    }

    const [updated] = await tx
      .update(categories)
      .set({ active: false })
      .where(and(eq(categories.id, params.id), eq(categories.userId, user.id)))
      .returning();

    return updated;
  });
}

export async function getBudgets() {
  const user = await getAuthenticatedUser();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [catList, txList] = await Promise.all([
    db
      .select()
      .from(categories)
      .where(and(eq(categories.userId, user.id), eq(categories.type, "EXPENSE"), eq(categories.active, true))),
    db
      .select({
        categoryId: transactions.categoryId,
        amount: transactions.amount,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, user.id),
          eq(transactions.mode, "PERSONAL"),
          eq(transactions.flow, "OUT"),
          gte(transactions.date, startOfMonth)
        )
      ),
  ]);

  if (catList.length === 0) return [];

  const spendingMap = new Map<string, number>();
  txList.forEach((t) => {
    if (t.categoryId) {
      const current = spendingMap.get(t.categoryId) || 0;
      spendingMap.set(t.categoryId, addPaise(current, Number(t.amount)));
    }
  });

  return catList.map((cat) => {
    const spentPaise = spendingMap.get(cat.id) || 0;
    return {
      id: cat.id,
      name: cat.name,
      icon: cat.icon ?? "💰",
      budget_limit: cat.budgetLimit ? parseFloat(cat.budgetLimit) : null,
      spent: paiseToRupees(spentPaise).toNumber(),
    };
  });
}

export async function getMonthlyCategorySpend(month: number, year: number) {
  const user = await getAuthenticatedUser();

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const rows = await db
    .select({
      categoryName: categories.name,
      totalSpent: sql<number>`COALESCE(SUM(${transactions.amount}), 0)::numeric`,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.userId, user.id),
        eq(transactions.flow, "OUT"),
        gte(transactions.date, startDate),
        sql`${transactions.date} <= ${endDate}`
      )
    )
    .groupBy(categories.name);

  return rows.map((r) => ({
    category_name: r.categoryName,
    category_color: "blue",
    total_spent: Number(r.totalSpent),
  }));
}
