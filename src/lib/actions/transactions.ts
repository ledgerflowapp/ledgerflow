"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import {
  transactions,
  transactionSplits,
  categories,
  accounts,
  contacts,
  groups,
  user,
  profiles,
} from "@/db/schema";
import { eq, and, desc, asc, or } from "drizzle-orm";

export interface SplitInput {
  userId?: string | null;
  groupMemberId?: string | null;
  amount: number; // in paise
  percentage?: number | null;
  isSettled?: boolean;
  memberNameSnapshot?: string | null;
}

export interface CreateTransactionInput {
  amount: number; // in paise
  flow: "IN" | "OUT";
  mode: "BUSINESS" | "PERSONAL";
  name: string;
  note?: string | null;
  date: Date | string;
  dueDate?: Date | string | null;
  contactId?: string | null;
  categoryId?: string | null;
  accountId?: string | null;
  businessId?: string | null;
  groupId?: string | null;
  payerId?: string | null;
  payerGroupMemberId?: string | null;
  splitType?: "EQUALLY" | "BY_AMOUNT" | "BY_PERCENTAGE";
  splits?: SplitInput[] | null;
}

export interface UpdateTransactionInput {
  id: string;
  amount: number; // in paise
  flow: "IN" | "OUT";
  mode: "BUSINESS" | "PERSONAL";
  name: string;
  note?: string | null;
  date: Date | string;
  dueDate?: Date | string | null;
  contactId?: string | null;
  categoryId?: string | null;
  accountId?: string | null;
}

export interface GetTransactionsFilters {
  mode?: "BUSINESS" | "PERSONAL";
  contactId?: string | null;
  groupId?: string | null;
  limit?: number;
  offset?: number;
}

export async function getSessionUser() {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    return session?.user ?? null;
  } catch (err) {
    return null;
  }
}

/**
 * Creates a transaction and optional splits atomically using a Drizzle ORM database transaction.
 * Replaces the atomic_add_transaction_rpc / add_transaction_with_splits stored procedure.
 */
export async function createTransactionAction(
  input: CreateTransactionInput,
  overrideUserId?: string
) {
  const currentUser = overrideUserId ? { id: overrideUserId } : await getSessionUser();
  if (!currentUser) {
    throw new Error("Unauthorized");
  }

  return await db.transaction(async (tx) => {
    const [insertedTx] = await tx
      .insert(transactions)
      .values({
        userId: currentUser.id,
        businessId: input.mode === "BUSINESS" ? input.businessId || null : null,
        amount: String(input.amount),
        flow: input.flow,
        mode: input.mode,
        name: input.name,
        note: input.note || null,
        date: new Date(input.date),
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        contactId: input.contactId || null,
        categoryId: input.categoryId || null,
        accountId: input.accountId || null,
        groupId: input.groupId || null,
        payerId: input.payerId || currentUser.id,
        payerGroupMemberId: input.payerGroupMemberId || null,
        splitType: input.splitType || "EQUALLY",
      })
      .returning();

    if (input.splits && input.splits.length > 0) {
      await tx.insert(transactionSplits).values(
        input.splits.map((s) => ({
          transactionId: insertedTx.id,
          userId: s.userId || null,
          groupMemberId: s.groupMemberId || null,
          amount: String(s.amount),
          percentage: s.percentage != null ? String(s.percentage) : null,
          isSettled: s.isSettled || false,
          memberNameSnapshot: s.memberNameSnapshot || null,
        }))
      );
    }

    return { id: insertedTx.id, success: true, transaction: insertedTx };
  });
}

/**
 * Fetches transactions filtered by mode, contactId, or groupId.
 */
export async function getTransactionsAction(
  filters?: GetTransactionsFilters,
  overrideUserId?: string
) {
  const currentUser = overrideUserId ? { id: overrideUserId } : await getSessionUser();
  if (!currentUser) {
    throw new Error("Unauthorized");
  }

  const limit = filters?.limit ?? 20;
  const offset = filters?.offset ?? 0;

  const whereConditions = [];

  if (filters?.contactId) {
    whereConditions.push(eq(transactions.contactId, filters.contactId));
  } else if (filters?.groupId) {
    whereConditions.push(eq(transactions.groupId, filters.groupId));
  } else if (filters?.mode) {
    whereConditions.push(eq(transactions.mode, filters.mode));
    whereConditions.push(eq(transactions.userId, currentUser.id));
  } else {
    whereConditions.push(eq(transactions.userId, currentUser.id));
  }

  const rows = await db.query.transactions.findMany({
    where: and(...whereConditions),
    orderBy: [desc(transactions.date)],
    limit,
    offset,
    with: {
      category: {
        columns: {
          name: true,
          icon: true,
        },
      },
      account: {
        columns: {
          name: true,
          type: true,
        },
      },
      contact: {
        columns: {
          id: true,
          name: true,
          phone: true,
        },
      },
      group: {
        columns: {
          id: true,
          name: true,
        },
      },
      payer: {
        columns: {
          id: true,
          name: true,
          image: true,
        },
      },
      splits: true,
    },
  });

  return rows.map((t) => ({
    id: t.id,
    user_id: t.userId,
    amount: Number(t.amount),
    flow: t.flow as "IN" | "OUT",
    mode: t.mode as "BUSINESS" | "PERSONAL",
    name: t.name,
    note: t.note || undefined,
    date: t.date ? t.date.toISOString() : new Date().toISOString(),
    due_date: t.dueDate ? t.dueDate.toISOString() : undefined,
    contact_id: t.contactId || undefined,
    category_id: t.categoryId || undefined,
    account_id: t.accountId || undefined,
    group_id: t.groupId || undefined,
    payer_id: t.payerId || undefined,
    payer_group_member_id: t.payerGroupMemberId || undefined,
    split_type: t.splitType as "EQUALLY" | "BY_AMOUNT" | "BY_PERCENTAGE" | undefined,
    contacts: t.contact ? { name: t.contact.name, phone: t.contact.phone || undefined } : null,
    category: t.category,
    account: t.account,
    contact: t.contact ? { id: t.contact.id, name: t.contact.name } : null,
    payer: t.payer ? { full_name: t.payer.name, avatar_url: t.payer.image || undefined } : null,
    group: t.group,
    splits: t.splits.map((s) => ({
      id: s.id,
      user_id: s.userId || undefined,
      group_member_id: s.groupMemberId || undefined,
      amount: Number(s.amount),
      percentage: s.percentage ? Number(s.percentage) : null,
      is_settled: s.isSettled ?? false,
      member_name_snapshot: s.memberNameSnapshot || null,
    })),
  }));
}

/**
 * Fetches personal transactions for the logged-in user.
 */
export async function getPersonalTransactionsAction(
  filters?: {
    limit?: number;
    offset?: number;
  },
  overrideUserId?: string
) {
  const currentUser = overrideUserId ? { id: overrideUserId } : await getSessionUser();
  if (!currentUser) {
    throw new Error("Unauthorized");
  }

  const limit = filters?.limit ?? 100;
  const offset = filters?.offset ?? 0;

  const rows = await db.query.transactions.findMany({
    where: and(eq(transactions.userId, currentUser.id), eq(transactions.mode, "PERSONAL")),
    orderBy: [desc(transactions.date)],
    limit,
    offset,
    with: {
      category: {
        columns: {
          name: true,
          icon: true,
        },
      },
      account: {
        columns: {
          name: true,
          type: true,
        },
      },
      contact: {
        columns: {
          id: true,
          name: true,
        },
      },
      group: {
        columns: {
          id: true,
          name: true,
        },
      },
    },
  });

  return rows.map((t) => ({
    id: t.id,
    amount: Number(t.amount),
    flow: t.flow as "IN" | "OUT",
    name: t.name,
    note: t.note || undefined,
    date: t.date ? t.date.toISOString() : new Date().toISOString(),
    category_id: t.categoryId || undefined,
    account_id: t.accountId || undefined,
    contact_id: t.contactId || undefined,
    mode: t.mode as "PERSONAL" | "BUSINESS",
    category: t.category,
    account: t.account,
    contact: t.contact,
    group: t.group,
  }));
}

/**
 * Fetches unified transactions feed combining personal, contact, and group transactions.
 */
export async function getUnifiedTransactionsAction(
  filters?: {
    limit?: number;
    offset?: number;
  },
  overrideUserId?: string
) {
  const currentUser = overrideUserId ? { id: overrideUserId } : await getSessionUser();
  if (!currentUser) {
    throw new Error("Unauthorized");
  }

  const limit = filters?.limit ?? 100;
  const offset = filters?.offset ?? 0;

  const rows = await db.query.transactions.findMany({
    where: or(
      eq(transactions.userId, currentUser.id),
      eq(transactions.payerId, currentUser.id)
    ),
    orderBy: [desc(transactions.date)],
    limit,
    offset,
    with: {
      category: {
        columns: {
          name: true,
          icon: true,
        },
      },
      account: {
        columns: {
          name: true,
          type: true,
        },
      },
      contact: {
        columns: {
          id: true,
          name: true,
          phone: true,
        },
      },
      group: {
        columns: {
          id: true,
          name: true,
        },
      },
      payer: {
        columns: {
          id: true,
          name: true,
          image: true,
        },
      },
      splits: true,
    },
  });

  return rows.map((t) => ({
    id: t.id,
    user_id: t.userId,
    amount: Number(t.amount),
    flow: t.flow as "IN" | "OUT",
    mode: t.mode as "BUSINESS" | "PERSONAL",
    name: t.name,
    note: t.note || undefined,
    date: t.date ? t.date.toISOString() : new Date().toISOString(),
    due_date: t.dueDate ? t.dueDate.toISOString() : undefined,
    contact_id: t.contactId || undefined,
    category_id: t.categoryId || undefined,
    account_id: t.accountId || undefined,
    group_id: t.groupId || undefined,
    payer_id: t.payerId || undefined,
    contacts: t.contact ? { name: t.contact.name, phone: t.contact.phone || undefined } : null,
    category: t.category,
    account: t.account,
    contact: t.contact ? { id: t.contact.id, name: t.contact.name } : null,
    payer: t.payer ? { full_name: t.payer.name, avatar_url: t.payer.image || undefined } : null,
    group: t.group,
    splits: t.splits.map((s) => ({
      id: s.id,
      user_id: s.userId || undefined,
      group_member_id: s.groupMemberId || undefined,
      amount: Number(s.amount),
      percentage: s.percentage ? Number(s.percentage) : null,
      is_settled: s.isSettled ?? false,
      member_name_snapshot: s.memberNameSnapshot || null,
    })),
  }));
}

/**
 * Updates an existing transaction if owned by the logged-in user.
 */
export async function updateTransactionAction(
  input: UpdateTransactionInput,
  overrideUserId?: string
) {
  const currentUser = overrideUserId ? { id: overrideUserId } : await getSessionUser();
  if (!currentUser) {
    throw new Error("Unauthorized");
  }

  const existing = await db.query.transactions.findFirst({
    where: and(eq(transactions.id, input.id), eq(transactions.userId, currentUser.id)),
  });

  if (!existing) {
    throw new Error("Unauthorized or transaction not found");
  }

  const [updated] = await db
    .update(transactions)
    .set({
      amount: String(input.amount),
      flow: input.flow,
      mode: input.mode,
      name: input.name,
      note: input.note || null,
      date: new Date(input.date),
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      contactId: input.contactId || null,
      categoryId: input.categoryId || null,
      accountId: input.accountId || null,
    })
    .where(and(eq(transactions.id, input.id), eq(transactions.userId, currentUser.id)))
    .returning();

  return updated;
}

/**
 * Deletes a transaction by ID if owned by the logged-in user.
 */
export async function deleteTransactionAction(id: string, overrideUserId?: string) {
  const currentUser = overrideUserId ? { id: overrideUserId } : await getSessionUser();
  if (!currentUser) {
    throw new Error("Unauthorized");
  }

  const existing = await db.query.transactions.findFirst({
    where: and(eq(transactions.id, id), eq(transactions.userId, currentUser.id)),
  });

  if (!existing) {
    throw new Error("Unauthorized or transaction not found");
  }

  await db
    .delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, currentUser.id)));

  return { success: true };
}
