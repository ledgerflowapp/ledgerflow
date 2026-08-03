"use server";

import { db } from "@/db";
import { contacts } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and, isNull, desc, gte } from "drizzle-orm";
import { startOfDay, startOfWeek, startOfMonth, startOfYear } from "date-fns";
import { Contact } from "@/types";

export { validateContactMergeGuards } from "./contacts-guards";

async function getAuthenticatedUser(reqHeaders?: Headers) {
  const h = reqHeaders ?? (await headers());
  const session = await auth.api.getSession({ headers: h });
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

function mapContact(c: typeof contacts.$inferSelect): Contact {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone ?? null,
    type: (c.type as Contact["type"]) || "OTHER",
    net_balance: Number(c.netBalance || "0"),
    last_transaction_at: c.lastTransactionAt?.toISOString() || new Date().toISOString(),
    business_id: c.businessId ?? null,
    image_url: c.imageUrl ?? null,
    transaction_count: c.transactionCount || 0,
    invite_token: c.inviteToken || undefined,
    linked_user_id: c.linkedUserId || undefined,
  };
}

export async function getBusinessContacts(businessId: string) {
  const user = await getAuthenticatedUser();

  const data = await db
    .select()
    .from(contacts)
    .where(and(eq(contacts.userId, user.id), eq(contacts.businessId, businessId)))
    .orderBy(desc(contacts.lastTransactionAt));

  return data.map(mapContact);
}

export async function getPersonalPeople(filters: {
  sortBy?: "LATEST" | "MOST_ACTIVE";
  timeFilter?: "ALL" | "TODAY" | "WEEK" | "MONTH" | "YEAR";
} = {}) {
  const user = await getAuthenticatedUser();

  const conditions = [eq(contacts.userId, user.id), isNull(contacts.businessId)];

  if (filters.timeFilter && filters.timeFilter !== "ALL") {
    const now = new Date();
    let startDate: Date;

    switch (filters.timeFilter) {
      case "TODAY":
        startDate = startOfDay(now);
        break;
      case "WEEK":
        startDate = startOfWeek(now);
        break;
      case "MONTH":
        startDate = startOfMonth(now);
        break;
      case "YEAR":
        startDate = startOfYear(now);
        break;
      default:
        startDate = startOfDay(now);
    }

    conditions.push(gte(contacts.lastTransactionAt, startDate));
  }

  const query = db
    .select()
    .from(contacts)
    .where(and(...conditions));

  if (filters.sortBy === "MOST_ACTIVE") {
    query.orderBy(desc(contacts.transactionCount));
  } else {
    query.orderBy(desc(contacts.lastTransactionAt));
  }

  const data = await query;
  return data.map(mapContact);
}

export async function addBusinessContact(params: {
  name: string;
  phone?: string;
  type: Contact["type"];
  image_url?: string;
  businessId: string;
}) {
  const user = await getAuthenticatedUser();

  const [inserted] = await db
    .insert(contacts)
    .values({
      userId: user.id,
      name: params.name,
      phone: params.phone,
      type: params.type,
      imageUrl: params.image_url,
      businessId: params.businessId,
    })
    .returning();

  return mapContact(inserted);
}

export async function addPersonalPerson(params: {
  name: string;
  phone?: string;
  image_url?: string;
}) {
  const user = await getAuthenticatedUser();

  const [inserted] = await db
    .insert(contacts)
    .values({
      userId: user.id,
      name: params.name,
      phone: params.phone,
      type: "OTHER",
      imageUrl: params.image_url,
      businessId: null,
    })
    .returning();

  return mapContact(inserted);
}

export async function updateContact(params: Partial<Contact> & { id: string }) {
  const user = await getAuthenticatedUser();

  const {
    id,
    net_balance,
    last_transaction_at,
    transaction_count,
    name,
    phone,
    type,
    image_url,
  } = params;

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone;
  if (type !== undefined) updateData.type = type;
  if (image_url !== undefined) updateData.imageUrl = image_url;

  const [updated] = await db
    .update(contacts)
    .set(updateData)
    .where(and(eq(contacts.id, id), eq(contacts.userId, user.id)))
    .returning();

  if (!updated) {
    throw new Error("Contact not found or unauthorized");
  }

  return mapContact(updated);
}

export async function deleteContact(id: string) {
  const user = await getAuthenticatedUser();

  const [deleted] = await db
    .delete(contacts)
    .where(and(eq(contacts.id, id), eq(contacts.userId, user.id)))
    .returning();

  return deleted?.id;
}
