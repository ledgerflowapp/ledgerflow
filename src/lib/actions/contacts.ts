"use server";

import { db } from "@/db";
import { contacts, friendships, notifications, profiles, user as userTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and, isNull, desc, gte, or } from "drizzle-orm";
import { startOfDay, startOfWeek, startOfMonth, startOfYear } from "date-fns";
import { Contact } from "@/types";
import { getSessionUser } from "@/lib/auth-session";
import { validateContactMergeGuards as validateGuards } from "./contacts-guards";

export async function validateContactMergeGuards(
  ...args: Parameters<typeof validateGuards>
) {
  return validateGuards(...args);
}

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

export async function mergeContactToUserProfile(contactId: string, targetUserId: string) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    throw new Error("Unauthorized: Active session required");
  }

  return await db.transaction(async (tx) => {
    const contactRecords = await tx
      .select()
      .from(contacts)
      .where(eq(contacts.id, contactId))
      .limit(1);

    if (contactRecords.length === 0) {
      throw new Error("Contact not found");
    }
    const contact = contactRecords[0];

    const targetUserRecords = await tx
      .select({
        id: userTable.id,
        emailVerified: userTable.emailVerified,
      })
      .from(userTable)
      .where(eq(userTable.id, targetUserId))
      .limit(1);

    if (targetUserRecords.length === 0) {
      throw new Error("Target user profile not found");
    }
    const targetUser = targetUserRecords[0];

    const profileRecords = await tx
      .select({
        phone: profiles.phone,
      })
      .from(profiles)
      .where(eq(profiles.id, targetUserId))
      .limit(1);

    const targetProfile = {
      id: targetUser.id,
      emailVerified: targetUser.emailVerified,
      phoneVerified: Boolean(profileRecords[0]?.phone),
    };

    await validateContactMergeGuards({
      contact,
      targetProfile,
      sessionUser,
    });

    const [updatedContact] = await tx
      .update(contacts)
      .set({ linkedUserId: targetUserId })
      .where(eq(contacts.id, contactId))
      .returning();

    const existingFriendships = await tx
      .select()
      .from(friendships)
      .where(
        or(
          and(eq(friendships.userId1, contact.userId), eq(friendships.userId2, targetUserId)),
          and(eq(friendships.userId1, targetUserId), eq(friendships.userId2, contact.userId))
        )
      )
      .limit(1);

    if (existingFriendships.length === 0) {
      const [firstUserId, secondUserId] =
        contact.userId < targetUserId
          ? [contact.userId, targetUserId]
          : [targetUserId, contact.userId];
      await tx.insert(friendships).values({
        userId1: firstUserId,
        userId2: secondUserId,
        status: "ACCEPTED",
        initiatorId: sessionUser.id,
      });
    } else if (existingFriendships[0].status === "PENDING") {
      await tx
        .update(friendships)
        .set({ status: "ACCEPTED", initiatorId: sessionUser.id })
        .where(eq(friendships.id, existingFriendships[0].id));
    }

    await tx.insert(notifications).values({
      userId: contact.userId,
      type: "CONTACT_MERGED",
      title: "Contact Merged",
      message: `Contact '${contact.name}' was successfully merged with user profile.`,
      data: {
        contactId: contact.id,
        targetUserId,
      },
    });

    return mapContact(updatedContact);
  });
}

