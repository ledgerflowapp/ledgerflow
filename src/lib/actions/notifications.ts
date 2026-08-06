"use server";

import { db } from "@/db";
import {
  notifications,
  groups,
  groupMembers,
  friendships,
  user as userTable,
  profiles,
} from "@/db/schema";
import { eq, and, or, desc } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth-session";
import {
  acceptInAppRequestAction,
  rejectInAppRequestAction,
} from "./friends";

export interface PersonalNotification {
  id: string;
  userId: string;
  type: string;
  title: string | null;
  message: string | null;
  isRead: boolean;
  createdAt: string;
  data: Record<string, any>;
}

export interface GroupGhostMergeNotification extends PersonalNotification {
  type: "GROUP_GHOST_MERGE_REQUEST";
  data: {
    groupId: string;
    groupName: string;
    ghostMemberId: string;
    ghostName: string;
    targetUserId: string;
    targetUser: {
      id: string;
      name: string;
      email: string | null;
      phone: string | null;
      avatarUrl: string | null;
    };
    status: "PENDING" | "APPROVED" | "REJECTED";
    approvedAt?: string;
    rejectedAt?: string;
  };
}

export async function getNotificationsAction(): Promise<PersonalNotification[]> {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    throw new Error("Unauthorized");
  }

  const userNotifs = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, sessionUser.id))
    .orderBy(desc(notifications.createdAt));

  const enrichedNotifs: PersonalNotification[] = [];

  for (const notif of userNotifs) {
    const rawData = (notif.data || {}) as Record<string, any>;
    const type = notif.type || "GENERAL";
    const notifDate = notif.createdAt
      ? notif.createdAt.toISOString()
      : new Date().toISOString();

    if (type === "GROUP_GHOST_MERGE_REQUEST") {
      const groupId = rawData.groupId as string;
      const ghostMemberId = rawData.ghostMemberId as string;
      const targetUserId = rawData.targetUserId as string;
      const status = (rawData.status || "PENDING") as
        | "PENDING"
        | "APPROVED"
        | "REJECTED";

      if (!groupId || !ghostMemberId || !targetUserId) {
        enrichedNotifs.push({
          id: notif.id,
          userId: notif.userId || sessionUser.id,
          type,
          title: notif.title,
          message: notif.message,
          isRead: notif.isRead ?? false,
          createdAt: notifDate,
          data: rawData,
        });
        continue;
      }

      // Fetch group details
      const groupRows = await db
        .select({ id: groups.id, name: groups.name })
        .from(groups)
        .where(eq(groups.id, groupId))
        .limit(1);
      const groupName = groupRows[0]?.name || "Unknown Group";

      // Fetch ghost member details
      const ghostRows = await db
        .select({ id: groupMembers.id, ghostName: groupMembers.ghostName })
        .from(groupMembers)
        .where(eq(groupMembers.id, ghostMemberId))
        .limit(1);
      const ghostName =
        ghostRows[0]?.ghostName || rawData.ghostName || "Ghost Member";

      // Fetch target user userTable & profile details
      const userRows = await db
        .select({
          id: userTable.id,
          name: userTable.name,
          email: userTable.email,
          image: userTable.image,
        })
        .from(userTable)
        .where(eq(userTable.id, targetUserId))
        .limit(1);

      const profileRows = await db
        .select({
          id: profiles.id,
          fullName: profiles.fullName,
          phone: profiles.phone,
          email: profiles.email,
          avatarUrl: profiles.avatarUrl,
        })
        .from(profiles)
        .where(eq(profiles.id, targetUserId))
        .limit(1);

      const targetUserObj = userRows[0];
      const targetProfileObj = profileRows[0];

      const name =
        targetProfileObj?.fullName || targetUserObj?.name || "Unknown User";
      const email = targetProfileObj?.email || targetUserObj?.email || null;
      const phone = targetProfileObj?.phone || null;
      const avatarUrl =
        targetProfileObj?.avatarUrl || targetUserObj?.image || null;

      enrichedNotifs.push({
        id: notif.id,
        userId: notif.userId || sessionUser.id,
        type: "GROUP_GHOST_MERGE_REQUEST",
        title: notif.title,
        message: notif.message,
        isRead: notif.isRead ?? false,
        createdAt: notifDate,
        data: {
          groupId,
          groupName,
          ghostMemberId,
          ghostName,
          targetUserId,
          targetUser: {
            id: targetUserId,
            name,
            email,
            phone,
            avatarUrl,
          },
          status,
          approvedAt: rawData.approvedAt,
          rejectedAt: rawData.rejectedAt,
        },
      });
    } else if (type === "FRIEND_REQ") {
      const initiatorId = (rawData.initiator_id || rawData.initiatorId) as string;
      let initiatorObj:
        | {
            id: string;
            name: string;
            email: string | null;
            avatarUrl: string | null;
          }
        | undefined = undefined;
      let friendshipId: string | undefined = rawData.friendshipId;
      let status: "PENDING" | "ACCEPTED" | "REJECTED" =
        rawData.status || "PENDING";

      if (initiatorId) {
        const uRows = await db
          .select({
            id: userTable.id,
            name: userTable.name,
            email: userTable.email,
            image: userTable.image,
          })
          .from(userTable)
          .where(eq(userTable.id, initiatorId))
          .limit(1);

        const pRows = await db
          .select({
            id: profiles.id,
            fullName: profiles.fullName,
            email: profiles.email,
            avatarUrl: profiles.avatarUrl,
          })
          .from(profiles)
          .where(eq(profiles.id, initiatorId))
          .limit(1);

        const uObj = uRows[0];
        const pObj = pRows[0];

        if (uObj || pObj) {
          initiatorObj = {
            id: initiatorId,
            name: pObj?.fullName || uObj?.name || "Friend",
            email: pObj?.email || uObj?.email || null,
            avatarUrl: pObj?.avatarUrl || uObj?.image || null,
          };
        }

        // Query corresponding friendship
        const friendshipRows = await db
          .select()
          .from(friendships)
          .where(
            or(
              and(
                eq(friendships.userId1, sessionUser.id),
                eq(friendships.userId2, initiatorId)
              ),
              and(
                eq(friendships.userId1, initiatorId),
                eq(friendships.userId2, sessionUser.id)
              )
            )
          )
          .limit(1);

        if (friendshipRows.length > 0) {
          friendshipId = friendshipRows[0].id;
          if (friendshipRows[0].status === "ACCEPTED") {
            status = "ACCEPTED";
          }
        }
      }

      enrichedNotifs.push({
        id: notif.id,
        userId: notif.userId || sessionUser.id,
        type: "FRIEND_REQ",
        title: notif.title || "New Friend Request",
        message: notif.message || "Someone sent you a friend request",
        isRead: notif.isRead ?? false,
        createdAt: notifDate,
        data: {
          ...rawData,
          initiator_id: initiatorId,
          initiatorId,
          initiator: initiatorObj,
          friendshipId,
          status,
        },
      });
    } else if (type === "GROUP_INVITE") {
      const groupId = rawData.groupId as string | undefined;
      const inviterId = rawData.inviterId as string | undefined;
      let groupName = rawData.groupName as string | undefined;
      let inviterObj:
        | { id: string; name: string; email: string | null; avatarUrl: string | null }
        | undefined = undefined;

      if (groupId) {
        const gRows = await db
          .select({ name: groups.name })
          .from(groups)
          .where(eq(groups.id, groupId))
          .limit(1);
        if (gRows[0]?.name) {
          groupName = gRows[0].name;
        }
      }

      if (inviterId) {
        const uRows = await db
          .select({ id: userTable.id, name: userTable.name, email: userTable.email, image: userTable.image })
          .from(userTable)
          .where(eq(userTable.id, inviterId))
          .limit(1);
        const pRows = await db
          .select({ fullName: profiles.fullName, email: profiles.email, avatarUrl: profiles.avatarUrl })
          .from(profiles)
          .where(eq(profiles.id, inviterId))
          .limit(1);
        if (uRows[0] || pRows[0]) {
          inviterObj = {
            id: inviterId,
            name: pRows[0]?.fullName || uRows[0]?.name || "Group Admin",
            email: pRows[0]?.email || uRows[0]?.email || null,
            avatarUrl: pRows[0]?.avatarUrl || uRows[0]?.image || null,
          };
        }
      }

      enrichedNotifs.push({
        id: notif.id,
        userId: notif.userId || sessionUser.id,
        type: "GROUP_INVITE",
        title: notif.title || "Group Invitation",
        message: notif.message || `You were invited to join ${groupName || "a group"}`,
        isRead: notif.isRead ?? false,
        createdAt: notifDate,
        data: {
          ...rawData,
          groupId,
          groupName: groupName || "Group",
          inviteToken: rawData.inviteToken,
          inviterId,
          inviter: inviterObj,
          status: rawData.status || "PENDING",
        },
      });
    } else if (type === "EXPENSE_ADDED") {
      const groupId = rawData.groupId as string | undefined;
      let groupName = rawData.groupName as string | undefined;

      if (groupId) {
        const gRows = await db
          .select({ name: groups.name })
          .from(groups)
          .where(eq(groups.id, groupId))
          .limit(1);
        if (gRows[0]?.name) {
          groupName = gRows[0].name;
        }
      }

      enrichedNotifs.push({
        id: notif.id,
        userId: notif.userId || sessionUser.id,
        type: "EXPENSE_ADDED",
        title: notif.title || "New Expense Added",
        message: notif.message || "A new shared expense was recorded",
        isRead: notif.isRead ?? false,
        createdAt: notifDate,
        data: {
          ...rawData,
          transactionId: rawData.transaction_id || rawData.transactionId,
          amount: rawData.amount,
          groupId,
          groupName,
        },
      });
    } else {
      enrichedNotifs.push({
        id: notif.id,
        userId: notif.userId || sessionUser.id,
        type,
        title: notif.title,
        message: notif.message,
        isRead: notif.isRead ?? false,
        createdAt: notifDate,
        data: rawData,
      });
    }
  }

  return enrichedNotifs;
}

export async function getGroupGhostMergeNotificationsAction(): Promise<
  GroupGhostMergeNotification[]
> {
  const allNotifs = await getNotificationsAction();
  return allNotifs.filter(
    (n): n is GroupGhostMergeNotification => n.type === "GROUP_GHOST_MERGE_REQUEST"
  );
}

export async function markNotificationAsReadAction(notificationId: string) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    throw new Error("Unauthorized");
  }

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, sessionUser.id)
      )
    );

  return { success: true };
}

export async function markAllNotificationsAsReadAction() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    throw new Error("Unauthorized");
  }

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.userId, sessionUser.id),
        eq(notifications.isRead, false)
      )
    );

  return { success: true };
}

export async function acceptFriendRequestNotificationAction(notificationId: string) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    throw new Error("Unauthorized");
  }

  const notifRows = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, sessionUser.id)
      )
    )
    .limit(1);

  if (notifRows.length === 0) {
    throw new Error("Notification not found");
  }

  const rawData = (notifRows[0].data || {}) as Record<string, any>;
  const initiatorId = (rawData.initiator_id || rawData.initiatorId) as string;

  if (!initiatorId) {
    throw new Error("Missing friend request initiator ID");
  }

  const friendshipRows = await db
    .select()
    .from(friendships)
    .where(
      or(
        and(
          eq(friendships.userId1, sessionUser.id),
          eq(friendships.userId2, initiatorId)
        ),
        and(
          eq(friendships.userId1, initiatorId),
          eq(friendships.userId2, sessionUser.id)
        )
      )
    )
    .limit(1);

  if (friendshipRows.length === 0) {
    throw new Error("Friend request not found");
  }

  await acceptInAppRequestAction(friendshipRows[0].id);

  await db
    .update(notifications)
    .set({
      isRead: true,
      data: { ...rawData, status: "ACCEPTED" },
    })
    .where(eq(notifications.id, notificationId));

  return { success: true };
}

export async function rejectFriendRequestNotificationAction(notificationId: string) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    throw new Error("Unauthorized");
  }

  const notifRows = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, sessionUser.id)
      )
    )
    .limit(1);

  if (notifRows.length === 0) {
    throw new Error("Notification not found");
  }

  const rawData = (notifRows[0].data || {}) as Record<string, any>;
  const initiatorId = (rawData.initiator_id || rawData.initiatorId) as string;

  if (!initiatorId) {
    throw new Error("Missing friend request initiator ID");
  }

  const friendshipRows = await db
    .select()
    .from(friendships)
    .where(
      or(
        and(
          eq(friendships.userId1, sessionUser.id),
          eq(friendships.userId2, initiatorId)
        ),
        and(
          eq(friendships.userId1, initiatorId),
          eq(friendships.userId2, sessionUser.id)
        )
      )
    )
    .limit(1);

  if (friendshipRows.length > 0) {
    await rejectInAppRequestAction(friendshipRows[0].id);
  }

  await db
    .update(notifications)
    .set({
      isRead: true,
      data: { ...rawData, status: "REJECTED" },
    })
    .where(eq(notifications.id, notificationId));

  return { success: true };
}

export async function acceptGroupInviteNotificationAction(notificationId: string) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    throw new Error("Unauthorized");
  }

  const notifRows = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, sessionUser.id)
      )
    )
    .limit(1);

  if (notifRows.length === 0) {
    throw new Error("Notification not found");
  }

  const rawData = (notifRows[0].data || {}) as Record<string, any>;
  const groupId = rawData.groupId as string;

  if (groupId) {
    const existingMember = await db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, sessionUser.id)
        )
      )
      .limit(1);

    if (existingMember.length === 0) {
      await db.insert(groupMembers).values({
        groupId,
        userId: sessionUser.id,
      });
    }
  }

  await db
    .update(notifications)
    .set({
      isRead: true,
      data: { ...rawData, status: "ACCEPTED" },
    })
    .where(eq(notifications.id, notificationId));

  return { success: true };
}

export async function rejectGroupInviteNotificationAction(notificationId: string) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    throw new Error("Unauthorized");
  }

  const notifRows = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, sessionUser.id)
      )
    )
    .limit(1);

  if (notifRows.length === 0) {
    throw new Error("Notification not found");
  }

  const rawData = (notifRows[0].data || {}) as Record<string, any>;

  await db
    .update(notifications)
    .set({
      isRead: true,
      data: { ...rawData, status: "REJECTED" },
    })
    .where(eq(notifications.id, notificationId));

  return { success: true };
}

