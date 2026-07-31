"use server";

import { db } from "@/db";
import { accounts } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and, asc } from "drizzle-orm";

async function getAuthenticatedUser(reqHeaders?: Headers) {
  const h = reqHeaders ?? (await headers());
  const session = await auth.api.getSession({ headers: h });
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function getAccounts() {
  const user = await getAuthenticatedUser();

  const data = await db
    .select()
    .from(accounts)
    .where(eq(accounts.userId, user.id))
    .orderBy(asc(accounts.createdAt));

  return data.map((acc) => ({
    id: acc.id,
    user_id: acc.userId,
    name: acc.name,
    type: (acc.type as "CASH" | "BANK" | "WALLET" | "OTHER") || "OTHER",
    balance: Number(acc.balance || "0"),
    is_default: acc.isDefault ?? false,
    created_at: acc.createdAt?.toISOString() ?? new Date().toISOString(),
  }));
}

export async function createAccount(newAccount: {
  name: string;
  type: "CASH" | "BANK" | "WALLET" | "OTHER";
  balance: number;
}) {
  const user = await getAuthenticatedUser();

  const [inserted] = await db
    .insert(accounts)
    .values({
      userId: user.id,
      name: newAccount.name,
      type: newAccount.type,
      balance: newAccount.balance.toString(),
    })
    .returning();

  return {
    id: inserted.id,
    user_id: inserted.userId,
    name: inserted.name,
    type: inserted.type,
    balance: Number(inserted.balance || "0"),
    is_default: inserted.isDefault ?? false,
  };
}

export async function deleteAccount(id: string) {
  const user = await getAuthenticatedUser();

  const [deleted] = await db
    .delete(accounts)
    .where(and(eq(accounts.id, id), eq(accounts.userId, user.id)))
    .returning();

  return deleted;
}
