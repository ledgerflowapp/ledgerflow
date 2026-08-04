"use server";

import { db } from "@/db";
import { recurringTransactions, transactions, categories, accounts } from "@/db/schema";
import { getSessionUser } from "@/lib/auth-session";
import { eq, and, asc, lte } from "drizzle-orm";
import { rupeesToPaise } from "@/lib/currency";
import { RecurringTransaction } from "@/types";
import { addDays, addWeeks, addMonths, addYears, getDaysInMonth } from "date-fns";

async function getAuthenticatedUser() {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export function calculateNextRunDate(
  currentDate: Date,
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY",
  scheduleMode: "CALENDAR" | "FIXED_INTERVAL" = "CALENDAR",
  startDate?: Date
): Date {
  const effectiveStartDate = startDate || currentDate;

  switch (frequency) {
    case "DAILY":
      return addDays(currentDate, 1);

    case "WEEKLY":
      return addWeeks(currentDate, 1);

    case "MONTHLY": {
      if (scheduleMode === "FIXED_INTERVAL") {
        return addMonths(currentDate, 1);
      }
      // CALENDAR mode: preserves target day of month from startDate
      const targetDay = effectiveStartDate.getDate();
      const nextMonthBase = addMonths(currentDate, 1);
      const nextDate = new Date(nextMonthBase);
      nextDate.setDate(1);
      const maxDaysInNextMonth = getDaysInMonth(nextDate);
      const newDay = Math.min(targetDay, maxDaysInNextMonth);

      nextDate.setDate(newDay);
      return nextDate;
    }

    case "YEARLY": {
      if (scheduleMode === "FIXED_INTERVAL") {
        return addYears(currentDate, 1);
      }
      // CALENDAR mode: preserves target day and month from startDate
      const targetDay = effectiveStartDate.getDate();
      const targetMonth = effectiveStartDate.getMonth();
      const nextYearBase = addYears(currentDate, 1);
      
      const nextDate = new Date(nextYearBase);
      nextDate.setDate(1);
      nextDate.setMonth(targetMonth);
      const maxDaysInNextMonth = getDaysInMonth(nextDate);
      const newDay = Math.min(targetDay, maxDaysInNextMonth);

      nextDate.setDate(newDay);
      return nextDate;
    }

    default:
      return addMonths(currentDate, 1);
  }
}

export async function processDueRecurringTransactions(userIdFilter?: string) {
  const now = new Date();

  const whereConditions = [
    eq(recurringTransactions.active, true),
    lte(recurringTransactions.nextRunDate, now),
  ];

  if (userIdFilter) {
    whereConditions.push(eq(recurringTransactions.userId, userIdFilter));
  }

  const dueRules = await db
    .select()
    .from(recurringTransactions)
    .where(and(...whereConditions))
    .orderBy(asc(recurringTransactions.nextRunDate));

  let processedCount = 0;
  let errorCount = 0;

  for (const rule of dueRules) {
    let iterations = 0;
    const MAX_ITERATIONS = 50;

    let currentNextRunDate = new Date(rule.nextRunDate);
    let currentFailureCount = rule.failureCount ?? 0;
    let currentActive = rule.active ?? true;

    while (currentActive && currentNextRunDate <= now && iterations < MAX_ITERATIONS) {
      iterations++;
      try {
        const nextDate = calculateNextRunDate(
          currentNextRunDate,
          rule.frequency as "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY",
          (rule.scheduleMode as "CALENDAR" | "FIXED_INTERVAL") || "CALENDAR",
          rule.startDate ? new Date(rule.startDate) : undefined
        );

        await db.transaction(async (tx) => {
          await tx.insert(transactions).values({
            userId: rule.userId,
            amount: String(rule.amount),
            flow: rule.flow || "OUT",
            mode: "PERSONAL",
            name: rule.name,
            note: rule.note || `Generated from recurring: ${rule.name}`,
            date: currentNextRunDate,
            categoryId: rule.categoryId || null,
            accountId: rule.accountId || null,
            payerId: rule.userId,
            splitType: "EQUALLY",
          });

          await tx
            .update(recurringTransactions)
            .set({
              lastRunDate: currentNextRunDate,
              nextRunDate: nextDate,
              failureCount: 0,
              lastFailureReason: null,
            })
            .where(eq(recurringTransactions.id, rule.id));
        });

        currentNextRunDate = nextDate;
        currentFailureCount = 0;
        processedCount++;
      } catch (err: any) {
        errorCount++;
        const errorMessage = err?.message || "Execution error";
        currentFailureCount += 1;
        const shouldPause = currentFailureCount >= 3;

        try {
          await db
            .update(recurringTransactions)
            .set({
              failureCount: currentFailureCount,
              lastFailureReason: errorMessage,
              active: shouldPause ? false : currentActive,
            })
            .where(eq(recurringTransactions.id, rule.id));
        } catch {
          // ignore database errors when recording failure state
        }

        break;
      }
    }
  }

  return {
    processedCount,
    errorCount,
    rulesProcessed: dueRules.length,
  };
}

export async function getRecurringTransactions(): Promise<RecurringTransaction[]> {
  const user = await getAuthenticatedUser();

  // Session catch-up processing
  try {
    await processDueRecurringTransactions(user.id);
  } catch (err) {
    console.warn("[Recurring Catch-up Error]:", err);
  }

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
    schedule_mode: (rec.scheduleMode as "CALENDAR" | "FIXED_INTERVAL") || "CALENDAR",
    failure_count: rec.failureCount ?? 0,
    last_failure_reason: rec.lastFailureReason || null,
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
  schedule_mode?: "CALENDAR" | "FIXED_INTERVAL";
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
      scheduleMode: data.schedule_mode || "CALENDAR",
      startDate: new Date(data.start_date),
      nextRunDate: new Date(data.next_run_date),
      categoryId: data.category_id || null,
      accountId: data.account_id || null,
      active: data.active ?? true,
      failureCount: 0,
      lastFailureReason: null,
      note: data.note,
    })
    .returning();

  return inserted;
}

export async function updateRecurringTransaction(
  id: string,
  data: {
    name?: string;
    amount?: number;
    flow?: "IN" | "OUT";
    frequency?: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
    schedule_mode?: "CALENDAR" | "FIXED_INTERVAL";
    category_id?: string | null;
    account_id?: string | null;
    active?: boolean;
    note?: string;
  }
) {
  const user = await getAuthenticatedUser();

  const updateData: Partial<typeof recurringTransactions.$inferInsert> = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.amount !== undefined) updateData.amount = rupeesToPaise(data.amount).toString();
  if (data.flow !== undefined) updateData.flow = data.flow;
  if (data.frequency !== undefined) updateData.frequency = data.frequency;
  if (data.schedule_mode !== undefined) updateData.scheduleMode = data.schedule_mode;
  if (data.category_id !== undefined) updateData.categoryId = data.category_id;
  if (data.account_id !== undefined) updateData.accountId = data.account_id;
  if (data.note !== undefined) updateData.note = data.note;

  // Reset failure count & reason ONLY when active: true is explicitly provided (e.g., resuming rule)
  if (data.active !== undefined) {
    updateData.active = data.active;
    if (data.active === true) {
      updateData.failureCount = 0;
      updateData.lastFailureReason = null;
    }
  }

  const [updated] = await db
    .update(recurringTransactions)
    .set(updateData)
    .where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, user.id)))
    .returning();

  return updated;
}

export async function deleteRecurringTransaction(id: string) {
  const user = await getAuthenticatedUser();

  const [deleted] = await db
    .delete(recurringTransactions)
    .where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, user.id)))
    .returning();

  return deleted;
}
