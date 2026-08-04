"use server";

import { db } from "@/db";
import {
  notifications,
  groups,
  groupMembers,
  user as userTable,
  profiles,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth-session";

export interface GroupGhostMergeNotification {
  id: string;
  userId: string;
  type: "GROUP_GHOST_MERGE_REQUEST";
  title: string | null;
  message: string | null;
  isRead: boolean;
  createdAt: string;
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

export async function getGroupGhostMergeNotificationsAction(): Promise<
  GroupGhostMergeNotification[]
> {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    throw new Error("Unauthorized");
  }

  const userNotifs = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, sessionUser.id))
    .orderBy(desc(notifications.createdAt));

  const mergeRequestNotifs = userNotifs.filter(
    (n) => n.type === "GROUP_GHOST_MERGE_REQUEST"
  );

  const enrichedNotifs: GroupGhostMergeNotification[] = [];

  for (const notif of mergeRequestNotifs) {
    const rawData = (notif.data || {}) as Record<string, any>;
    const groupId = rawData.groupId as string;
    const ghostMemberId = rawData.ghostMemberId as string;
    const targetUserId = rawData.targetUserId as string;
    const status = (rawData.status || "PENDING") as "PENDING" | "APPROVED" | "REJECTED";

    if (!groupId || !ghostMemberId || !targetUserId) continue;

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
    const ghostName = ghostRows[0]?.ghostName || rawData.ghostName || "Ghost Member";

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
      targetProfileObj?.fullName ||
      targetUserObj?.name ||
      "Unknown User";
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
      createdAt: notif.createdAt ? notif.createdAt.toISOString() : new Date().toISOString(),
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
  }

  return enrichedNotifs;
}
