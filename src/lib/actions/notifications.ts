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
import { eq, and, or, desc, inArray } from "drizzle-orm";
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

  if (userNotifs.length === 0) {
    return [];
  }

  // Collect unique IDs for batch queries
  const groupIds = new Set<string>();
  const ghostMemberIds = new Set<string>();
  const userIds = new Set<string>();
  const friendInitiatorIds = new Set<string>();

  for (const notif of userNotifs) {
    const rawData = (notif.data || {}) as Record<string, any>;
    const type = notif.type || "GENERAL";

    if (type === "GROUP_GHOST_MERGE_REQUEST") {
      if (rawData.groupId) groupIds.add(rawData.groupId as string);
      if (rawData.ghostMemberId) ghostMemberIds.add(rawData.ghostMemberId as string);
      if (rawData.targetUserId) userIds.add(rawData.targetUserId as string);
    } else if (type === "FRIEND_REQ") {
      const initiatorId = (rawData.initiator_id || rawData.initiatorId) as string;
      if (initiatorId) {
        userIds.add(initiatorId);
        friendInitiatorIds.add(initiatorId);
      }
    } else if (type === "GROUP_INVITE") {
      if (rawData.groupId) groupIds.add(rawData.groupId as string);
      if (rawData.inviterId) userIds.add(rawData.inviterId as string);
    } else if (type === "EXPENSE_ADDED") {
      if (rawData.groupId) groupIds.add(rawData.groupId as string);
    }
  }

  // Execute batch queries in parallel
  const [
    groupRows,
    ghostRows,
    userRows,
    profileRows,
    friendshipRows,
  ] = await Promise.all([
    groupIds.size > 0
      ? db
          .select({ id: groups.id, name: groups.name })
          .from(groups)
          .where(inArray(groups.id, Array.from(groupIds)))
      : Promise.resolve([]),
    ghostMemberIds.size > 0
      ? db
          .select({ id: groupMembers.id, ghostName: groupMembers.ghostName })
          .from(groupMembers)
          .where(inArray(groupMembers.id, Array.from(ghostMemberIds)))
      : Promise.resolve([]),
    userIds.size > 0
      ? db
          .select({
            id: userTable.id,
            name: userTable.name,
            email: userTable.email,
            image: userTable.image,
          })
          .from(userTable)
          .where(inArray(userTable.id, Array.from(userIds)))
      : Promise.resolve([]),
    userIds.size > 0
      ? db
          .select({
            id: profiles.id,
            fullName: profiles.fullName,
            phone: profiles.phone,
            email: profiles.email,
            avatarUrl: profiles.avatarUrl,
          })
          .from(profiles)
          .where(inArray(profiles.id, Array.from(userIds)))
      : Promise.resolve([]),
    friendInitiatorIds.size > 0
      ? db
          .select()
          .from(friendships)
          .where(
            or(
              and(
                eq(friendships.userId1, sessionUser.id),
                inArray(friendships.userId2, Array.from(friendInitiatorIds))
              ),
              and(
                eq(friendships.userId2, sessionUser.id),
                inArray(friendships.userId1, Array.from(friendInitiatorIds))
              )
            )
          )
      : Promise.resolve([]),
  ]);

  // Index batch query results for O(1) lookup
  const groupsMap = new Map(groupRows.map((g) => [g.id, g]));
  const ghostsMap = new Map(ghostRows.map((g) => [g.id, g]));
  const usersMap = new Map(userRows.map((u) => [u.id, u]));
  const profilesMap = new Map(profileRows.map((p) => [p.id, p]));

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

      const groupName = groupsMap.get(groupId)?.name || "Unknown Group";
      const ghostName = ghostsMap.get(ghostMemberId)?.ghostName || rawData.ghostName || "Ghost Member";
      const targetUserObj = usersMap.get(targetUserId);
      const targetProfileObj = profilesMap.get(targetUserId);

      const name = targetProfileObj?.fullName || targetUserObj?.name || "Unknown User";
      const email = targetProfileObj?.email || targetUserObj?.email || null;
      const phone = targetProfileObj?.phone || null;
      const avatarUrl = targetProfileObj?.avatarUrl || targetUserObj?.image || null;

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
        const uObj = usersMap.get(initiatorId);
        const pObj = profilesMap.get(initiatorId);

        if (uObj || pObj) {
          initiatorObj = {
            id: initiatorId,
            name: pObj?.fullName || uObj?.name || "Friend",
            email: pObj?.email || uObj?.email || null,
            avatarUrl: pObj?.avatarUrl || uObj?.image || null,
          };
        }

        const friendship = friendshipRows.find(
          (f) =>
            (f.userId1 === sessionUser.id && f.userId2 === initiatorId) ||
            (f.userId1 === initiatorId && f.userId2 === sessionUser.id)
        );

        if (friendship) {
          friendshipId = friendship.id;
          if (friendship.status === "ACCEPTED") {
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
        const gName = groupsMap.get(groupId)?.name;
        if (gName) groupName = gName;
      }

      if (inviterId) {
        const uObj = usersMap.get(inviterId);
        const pObj = profilesMap.get(inviterId);
        if (uObj || pObj) {
          inviterObj = {
            id: inviterId,
            name: pObj?.fullName || uObj?.name || "Group Admin",
            email: pObj?.email || uObj?.email || null,
            avatarUrl: pObj?.avatarUrl || uObj?.image || null,
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
        const gName = groupsMap.get(groupId)?.name;
        if (gName) groupName = gName;
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

