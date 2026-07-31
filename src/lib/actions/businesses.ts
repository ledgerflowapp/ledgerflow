"use server";

import { db } from "@/db";
import { businesses } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, asc } from "drizzle-orm";

async function getAuthenticatedUser(reqHeaders?: Headers) {
  const h = reqHeaders ?? (await headers());
  const session = await auth.api.getSession({ headers: h });
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function getBusinesses() {
  const user = await getAuthenticatedUser();

  const data = await db
    .select()
    .from(businesses)
    .where(eq(businesses.userId, user.id))
    .orderBy(asc(businesses.createdAt));

  return data.map((b) => ({
    id: b.id,
    name: b.name,
    created_at: b.createdAt?.toISOString() ?? new Date().toISOString(),
  }));
}

export async function createBusiness(name: string) {
  const user = await getAuthenticatedUser();

  const [inserted] = await db
    .insert(businesses)
    .values({
      userId: user.id,
      name,
    })
    .returning();

  return {
    id: inserted.id,
    name: inserted.name,
    created_at: inserted.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}
