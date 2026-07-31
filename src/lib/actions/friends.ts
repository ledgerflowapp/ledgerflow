"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { friendships, contacts, profiles, notifications, user as userTable } from "@/db/schema";
import { eq, and, or, isNull } from "drizzle-orm";

async function getSessionUser(userIdOverride?: string) {
  if (userIdOverride) {
    return { id: userIdOverride };
  }
  let reqHeaders: Headers | undefined;
  try {
    reqHeaders = await headers();
  } catch {
    reqHeaders = undefined;
  }
  const session = await auth.api.getSession({ headers: reqHeaders ?? new Headers() });
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

export async function detectUserByPhoneAction(phone: string, userIdOverride?: string) {
  await getSessionUser(userIdOverride);

  const matched = await db
    .select({
      id: profiles.id,
      fullName: profiles.fullName,
      avatarUrl: profiles.avatarUrl,
    })
    .from(profiles)
    .where(and(eq(profiles.phone, phone), eq(profiles.discoverableByPhone, true)))
    .limit(1);

  if (matched.length === 0) return null;

  return {
    id: matched[0].id,
    full_name: matched[0].fullName,
    avatar_url: matched[0].avatarUrl,
  };
}

export async function sendFriendRequestAction(
  data: { targetUserId: string; contactId?: string },
  userIdOverride?: string
) {
  const sessionUser = await getSessionUser(userIdOverride);
  const uid = sessionUser.id;

  if (uid === data.targetUserId) {
    throw new Error("Cannot send a friend request to yourself");
  }

  const existing = await db
    .select()
    .from(friendships)
    .where(
      or(
        and(eq(friendships.userId1, data.targetUserId), eq(friendships.userId2, uid)),
        and(eq(friendships.userId1, uid), eq(friendships.userId2, data.targetUserId))
      )
    )
    .limit(1);

  if (existing.length > 0) {
    if (existing[0].status === "ACCEPTED") {
      throw new Error("You are already friends with this user");
    } else {
      throw new Error("A friend request is already pending");
    }
  }

  const userId1 = data.targetUserId < uid ? data.targetUserId : uid;
  const userId2 = data.targetUserId < uid ? uid : data.targetUserId;

  await db.insert(friendships).values({
    userId1,
    userId2,
    status: "PENDING",
    initiatorId: uid,
  });

  if (data.contactId) {
    await db
      .update(contacts)
      .set({ linkedUserId: data.targetUserId })
      .where(and(eq(contacts.id, data.contactId), eq(contacts.userId, uid)));
  }

  await db.insert(notifications).values({
    userId: data.targetUserId,
    type: "FRIEND_REQ",
    title: "New Friend Request",
    message: "Someone wants to connect with you.",
    data: { initiator_id: uid },
  });

  return { success: true };
}

export async function acceptInAppRequestAction(friendshipId: string, userIdOverride?: string) {
  const sessionUser = await getSessionUser(userIdOverride);
  const uid = sessionUser.id;

  return await db.transaction(async (tx) => {
    const fRecords = await tx
      .select()
      .from(friendships)
      .where(eq(friendships.id, friendshipId))
      .limit(1);

    if (fRecords.length === 0) throw new Error("Friend request not found");
    const fRecord = fRecords[0];

    if (fRecord.status === "ACCEPTED") throw new Error("Friend request already accepted");
    if (fRecord.initiatorId === uid) throw new Error("You cannot accept your own request");
    if (fRecord.userId1 !== uid && fRecord.userId2 !== uid) {
      throw new Error("You are not involved in this friend request");
    }

    const senderId = fRecord.initiatorId!;

    await tx
      .update(friendships)
      .set({ status: "ACCEPTED" })
      .where(eq(friendships.id, friendshipId));

    const senderProfiles = await tx.select().from(profiles).where(eq(profiles.id, senderId)).limit(1);
    const receiverProfiles = await tx.select().from(profiles).where(eq(profiles.id, uid)).limit(1);
    const senderProfile = senderProfiles[0];
    const receiverProfile = receiverProfiles[0];

    // Check contact for receiver
    const receiverContacts = await tx
      .select()
      .from(contacts)
      .where(and(eq(contacts.userId, uid), eq(contacts.linkedUserId, senderId)))
      .limit(1);

    if (receiverContacts.length === 0) {
      if (senderProfile?.phone) {
        const phoneMatch = await tx
          .select()
          .from(contacts)
          .where(
            and(
              eq(contacts.userId, uid),
              eq(contacts.phone, senderProfile.phone),
              isNull(contacts.linkedUserId)
            )
          )
          .limit(1);

        if (phoneMatch.length > 0) {
          await tx
            .update(contacts)
            .set({ linkedUserId: senderId })
            .where(eq(contacts.id, phoneMatch[0].id));
        } else {
          await tx.insert(contacts).values({
            userId: uid,
            name: senderProfile?.fullName || "Friend",
            type: "OTHER",
            linkedUserId: senderId,
            imageUrl: senderProfile?.avatarUrl,
          });
        }
      } else {
        await tx.insert(contacts).values({
          userId: uid,
          name: senderProfile?.fullName || "Friend",
          type: "OTHER",
          linkedUserId: senderId,
          imageUrl: senderProfile?.avatarUrl,
        });
      }
    }

    // Check contact for sender
    const senderContacts = await tx
      .select()
      .from(contacts)
      .where(and(eq(contacts.userId, senderId), eq(contacts.linkedUserId, uid)))
      .limit(1);

    if (senderContacts.length === 0) {
      await tx.insert(contacts).values({
        userId: senderId,
        name: receiverProfile?.fullName || "Friend",
        type: "OTHER",
        linkedUserId: uid,
        imageUrl: receiverProfile?.avatarUrl,
      });
    }

    return { success: true, sender_name: senderProfile?.fullName || "" };
  });
}

export async function rejectInAppRequestAction(friendshipId: string, userIdOverride?: string) {
  const sessionUser = await getSessionUser(userIdOverride);
  const uid = sessionUser.id;

  const fRecords = await db
    .select()
    .from(friendships)
    .where(eq(friendships.id, friendshipId))
    .limit(1);

  if (fRecords.length === 0) throw new Error("Friend request not found");
  const fRecord = fRecords[0];

  const otherUserId = fRecord.userId1 === uid ? fRecord.userId2 : fRecord.userId1;

  await db.delete(friendships).where(eq(friendships.id, friendshipId));

  if (otherUserId) {
    await db
      .update(contacts)
      .set({ linkedUserId: null })
      .where(and(eq(contacts.userId, uid), eq(contacts.linkedUserId, otherUserId)));
  }

  return { success: true };
}

export async function removeFriendAction(friendId: string, userIdOverride?: string) {
  const sessionUser = await getSessionUser(userIdOverride);
  const uid = sessionUser.id;

  return await db.transaction(async (tx) => {
    await tx
      .delete(friendships)
      .where(
        or(
          and(eq(friendships.userId1, uid), eq(friendships.userId2, friendId)),
          and(eq(friendships.userId1, friendId), eq(friendships.userId2, uid))
        )
      );

    await tx
      .update(contacts)
      .set({ linkedUserId: null })
      .where(
        or(
          and(eq(contacts.userId, uid), eq(contacts.linkedUserId, friendId)),
          and(eq(contacts.userId, friendId), eq(contacts.linkedUserId, uid))
        )
      );

    return { success: true };
  });
}

export async function acceptContactInviteAction(token: string, userIdOverride?: string) {
  const sessionUser = await getSessionUser(userIdOverride);
  const uid = sessionUser.id;

  return await db.transaction(async (tx) => {
    const contactRecords = await tx
      .select()
      .from(contacts)
      .where(eq(contacts.inviteToken, token))
      .limit(1);

    if (contactRecords.length === 0) {
      throw new Error("Invalid or expired invite token");
    }

    const contactRecord = contactRecords[0];
    if (contactRecord.userId === uid) {
      throw new Error("Cannot invite yourself");
    }

    const ownerProfiles = await tx
      .select({ fullName: profiles.fullName })
      .from(profiles)
      .where(eq(profiles.id, contactRecord.userId))
      .limit(1);
    const ownerName = ownerProfiles[0]?.fullName || "";

    const existing = await tx
      .select()
      .from(friendships)
      .where(
        or(
          and(eq(friendships.userId1, contactRecord.userId), eq(friendships.userId2, uid)),
          and(eq(friendships.userId1, uid), eq(friendships.userId2, contactRecord.userId))
        )
      )
      .limit(1);

    if (existing.length === 0) {
      const u1 = contactRecord.userId < uid ? contactRecord.userId : uid;
      const u2 = contactRecord.userId < uid ? uid : contactRecord.userId;
      await tx.insert(friendships).values({
        userId1: u1,
        userId2: u2,
        status: "ACCEPTED",
      });
    } else if (existing[0].status === "PENDING") {
      await tx
        .update(friendships)
        .set({ status: "ACCEPTED" })
        .where(eq(friendships.id, existing[0].id));
    }

    await tx
      .update(contacts)
      .set({ linkedUserId: uid, inviteToken: null })
      .where(eq(contacts.id, contactRecord.id));

    return { success: true, owner_name: ownerName };
  });
}

export async function acceptFriendInviteAction(inviteToken: string, userIdOverride?: string) {
  const sessionUser = await getSessionUser(userIdOverride);
  const uid = sessionUser.id;

  return await db.transaction(async (tx) => {
    const targetProfiles = await tx
      .select()
      .from(profiles)
      .where(eq(profiles.friendInviteToken, inviteToken))
      .limit(1);

    if (targetProfiles.length === 0) {
      throw new Error("Invalid or expired invite link");
    }

    const targetUser = targetProfiles[0];
    if (targetUser.id === uid) {
      throw new Error("You cannot become friends with yourself");
    }

    const currentUserProfiles = await tx.select().from(profiles).where(eq(profiles.id, uid)).limit(1);
    const currentUserProfile = currentUserProfiles[0];

    const existing = await tx
      .select()
      .from(friendships)
      .where(
        or(
          and(eq(friendships.userId1, targetUser.id), eq(friendships.userId2, uid)),
          and(eq(friendships.userId1, uid), eq(friendships.userId2, targetUser.id))
        )
      )
      .limit(1);

    if (existing.length === 0) {
      const u1 = targetUser.id < uid ? targetUser.id : uid;
      const u2 = targetUser.id < uid ? uid : targetUser.id;
      await tx.insert(friendships).values({
        userId1: u1,
        userId2: u2,
        status: "ACCEPTED",
      });
    } else if (existing[0].status === "PENDING") {
      await tx
        .update(friendships)
        .set({ status: "ACCEPTED" })
        .where(eq(friendships.id, existing[0].id));
    }

    // Mutual contacts
    const currentContactMatch = await tx
      .select()
      .from(contacts)
      .where(and(eq(contacts.userId, uid), eq(contacts.linkedUserId, targetUser.id)))
      .limit(1);

    if (currentContactMatch.length === 0) {
      await tx.insert(contacts).values({
        userId: uid,
        name: targetUser.fullName || "Friend",
        type: "OTHER",
        linkedUserId: targetUser.id,
        imageUrl: targetUser.avatarUrl,
      });
    }

    const targetContactMatch = await tx
      .select()
      .from(contacts)
      .where(and(eq(contacts.userId, targetUser.id), eq(contacts.linkedUserId, uid)))
      .limit(1);

    if (targetContactMatch.length === 0) {
      await tx.insert(contacts).values({
        userId: targetUser.id,
        name: currentUserProfile?.fullName || "Friend",
        type: "OTHER",
        linkedUserId: uid,
        imageUrl: currentUserProfile?.avatarUrl,
      });
    }

    return { success: true, target_name: targetUser.fullName || "" };
  });
}

export async function getFriendshipsAction(userIdOverride?: string) {
  const sessionUser = await getSessionUser(userIdOverride);
  const uid = sessionUser.id;

  const friendshipRows = await db
    .select()
    .from(friendships)
    .where(
      and(
        eq(friendships.status, "ACCEPTED"),
        or(eq(friendships.userId1, uid), eq(friendships.userId2, uid))
      )
    );

  const friendsList = [];
  for (const f of friendshipRows) {
    const otherUserId = f.userId1 === uid ? f.userId2 : f.userId1;
    if (!otherUserId) continue;

    const prof = await db.select().from(profiles).where(eq(profiles.id, otherUserId)).limit(1);
    const friendProfile = prof[0];

    friendsList.push({
      friendship_id: f.id,
      profile: {
        id: otherUserId,
        full_name: friendProfile?.fullName || null,
        avatar_url: friendProfile?.avatarUrl || null,
        email: friendProfile?.email || undefined,
      },
    });
  }

  return friendsList;
}

export async function getFriendRequestsAction(userIdOverride?: string) {
  const sessionUser = await getSessionUser(userIdOverride);
  const uid = sessionUser.id;

  const friendshipRows = await db
    .select()
    .from(friendships)
    .where(
      and(
        eq(friendships.status, "PENDING"),
        or(eq(friendships.userId1, uid), eq(friendships.userId2, uid))
      )
    );

  const requestsList = [];
  for (const f of friendshipRows) {
    const otherUserId = f.userId1 === uid ? f.userId2 : f.userId1;
    if (!otherUserId) continue;

    const prof = await db.select().from(profiles).where(eq(profiles.id, otherUserId)).limit(1);
    const friendProfile = prof[0];
    const isIncoming = f.initiatorId !== uid;

    requestsList.push({
      id: f.id,
      type: (isIncoming ? "INCOMING" : "OUTGOING") as "INCOMING" | "OUTGOING",
      profile: {
        id: otherUserId,
        full_name: friendProfile?.fullName || null,
        avatar_url: friendProfile?.avatarUrl || null,
      },
    });
  }

  return requestsList;
}
