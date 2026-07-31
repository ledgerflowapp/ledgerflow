"use server";

import { db } from "@/db";
import { recurringTransactions, categories, accounts } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and, asc } from "drizzle-orm";
import { rupeesToPaise } from "@/lib/currency";
import { RecurringTransaction } from "@/types";

async function getAuthenticatedUser(reqHeaders?: Headers) {
  const h = reqHeaders ?? (await headers());
  const session = await auth.api.getSession({ headers: h });
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function getRecurringTransactions(): Promise<RecurringTransaction[]> {
  const user = await getAuthenticatedUser();

  const rows = await db
    .select({
      rec: recurringTransactions,
      catName: categories.name,
      catIcon: categories.icon,
      accName: accounts.name,
      accType: accounts.type,
    })
    .from(recurringTransactions)
    .leftJoin(categories, eq(recurringTransactions.categoryId, categories.id))
    .leftJoin(accounts, eq(recurringTransactions.accountId, accounts.id))
    .where(eq(recurringTransactions.userId, user.id))
    .orderBy(asc(recurringTransactions.nextRunDate));

  return rows.map(({ rec, catName, catIcon, accName, accType }) => ({
    id: rec.id,
    user_id: rec.userId,
    name: rec.name,
    amount: Number(rec.amount),
    flow: (rec.flow as "IN" | "OUT") || "OUT",
    frequency: rec.frequency as "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY",
    start_date: rec.startDate.toISOString(),
    next_run_date: rec.nextRunDate.toISOString(),
    last_run_date: rec.lastRunDate?.toISOString() || null,
    category_id: rec.categoryId || null,
    account_id: rec.accountId || null,
    active: rec.active ?? true,
    created_at: rec.createdAt?.toISOString() || new Date().toISOString(),
    note: rec.note || undefined,
    category: catName ? { name: catName, icon: catIcon || "💰" } : null,
    account: accName ? { name: accName, type: (accType as "CASH" | "BANK" | "WALLET" | "OTHER") || "OTHER" } : null,
  }));
}

export async function addRecurringTransaction(data: {
  name: string;
  amount: number;
  flow: "IN" | "OUT";
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  start_date: string;
  next_run_date: string;
  category_id?: string | null;
  account_id?: string | null;
  active?: boolean;
  note?: string;
}) {
  const user = await getAuthenticatedUser();

  const amountInPaise = rupeesToPaise(data.amount);

  const [inserted] = await db
    .insert(recurringTransactions)
    .values({
      userId: user.id,
      name: data.name,
      amount: amountInPaise.toString(),
      flow: data.flow,
      frequency: data.frequency,
      startDate: new Date(data.start_date),
      nextRunDate: new Date(data.next_run_date),
      categoryId: data.category_id || null,
      accountId: data.account_id || null,
      active: data.active ?? true,
      note: data.note,
    })
    .returning();

  return inserted;
}

export async function deleteRecurringTransaction(id: string) {
  const user = await getAuthenticatedUser();

  const [deleted] = await db
    .delete(recurringTransactions)
    .where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, user.id)))
    .returning();

  return deleted;
}
