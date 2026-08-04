import { db } from "@/db";
import {
  groups,
  groupMembers,
  user as userTable,
  profiles,
  contacts,
  notifications,
} from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export function normalizeEmail(email?: string | null): string {
  return email ? email.trim().toLowerCase() : "";
}

export function normalizePhone(phone?: string | null): string {
  if (!phone) return "";
  return phone.replace(/[^0-9+]/g, "");
}

export function isPhoneMatch(phoneA?: string | null, phoneB?: string | null): boolean {
  const normA = normalizePhone(phoneA);
  const normB = normalizePhone(phoneB);
  if (!normA || !normB) return false;
  if (normA === normB) return true;
  const digitsA = normA.replace(/\+/g, "");
  const digitsB = normB.replace(/\+/g, "");
  if (digitsA.length >= 7 && digitsB.length >= 7) {
    return digitsA.endsWith(digitsB) || digitsB.endsWith(digitsA);
  }
  return false;
}

export interface GhostMatchResult {
  success: boolean;
  reason?: string;
  matchedCount: number;
  requests: Array<{
    groupId: string;
    ghostMemberId: string;
    targetUserId: string;
    requestId?: string;
  }>;
}

export async function scanGhostMatchesForUser(
  targetUserId: string
): Promise<GhostMatchResult> {
  // 1. Fetch target user account details
  const userRecords = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, targetUserId))
    .limit(1);

  if (userRecords.length === 0) {
    return {
      success: false,
      reason: "Target user profile not found",
      matchedCount: 0,
      requests: [],
    };
  }

  const targetUser = userRecords[0];

  // 2. Fetch target user profile details
  const profileRecords = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, targetUserId))
    .limit(1);

  const targetProfile = profileRecords[0] || null;

  const email = normalizeEmail(targetUser.email || targetProfile?.email);
  const phone = normalizePhone(targetProfile?.phone);

  if (!email && !phone) {
    return {
      success: true,
      matchedCount: 0,
      requests: [],
    };
  }

  // 3. Scan for unclaimed group ghost members
  const unclaimedGhostMembers = await db
    .select({
      ghostMemberId: groupMembers.id,
      ghostName: groupMembers.ghostName,
      groupId: groups.id,
      groupName: groups.name,
      groupAdminId: groups.createdBy,
    })
    .from(groupMembers)
    .innerJoin(groups, eq(groupMembers.groupId, groups.id))
    .where(isNull(groupMembers.userId));

  const matchedRequests: Array<{
    groupId: string;
    ghostMemberId: string;
    targetUserId: string;
    requestId?: string;
  }> = [];

  for (const ghost of unclaimedGhostMembers) {
    if (!ghost.groupAdminId) continue;

    // Check if target user is already a member of this group
    const existingMember = await db
      .select({ id: groupMembers.id })
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, ghost.groupId),
          eq(groupMembers.userId, targetUserId)
        )
      )
      .limit(1);

    if (existingMember.length > 0) {
      continue;
    }

    // Check if a merge request notification already exists for this ghost member & target user
    const existingNotifs = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, ghost.groupAdminId),
          eq(notifications.type, "GROUP_GHOST_MERGE_REQUEST")
        )
      )
      .limit(1);

    // Filter notification data in JS for exact match
    const duplicateNotif = existingNotifs.find((n) => {
      const data = (n.data || {}) as Record<string, any>;
      return (
        data.groupId === ghost.groupId &&
        data.ghostMemberId === ghost.ghostMemberId &&
        data.targetUserId === targetUserId
      );
    });

    if (duplicateNotif) {
      continue;
    }

    // 4. Evaluate contact matching criteria
    let isMatch = false;

    const ghostNameNormalized = ghost.ghostName ? ghost.ghostName.trim() : "";
    const ghostNameEmail = normalizeEmail(ghostNameNormalized);

    // Criteria A: Direct match on email
    if (email && ghostNameEmail && ghostNameEmail === email) {
      isMatch = true;
    }

    // Criteria B: Direct match on normalized phone
    if (!isMatch && phone && isPhoneMatch(ghostNameNormalized, phone)) {
      isMatch = true;
    }

    // Criteria C: Check group admin's contacts table for phone/email matching target user
    if (!isMatch && ghost.groupAdminId) {
      const adminContacts = await db
        .select()
        .from(contacts)
        .where(eq(contacts.userId, ghost.groupAdminId));

      const contactMatch = adminContacts.find((c) => {
        const phoneMatched = phone && isPhoneMatch(c.phone, phone);
        const nameMatched =
          ghostNameNormalized &&
          c.name.trim().toLowerCase() === ghostNameNormalized.toLowerCase();
        return phoneMatched && nameMatched;
      });

      if (contactMatch) {
        isMatch = true;
      }
    }

    if (isMatch) {
      // 5. Create GROUP_GHOST_MERGE_REQUEST notification to group admin
      const [insertedReq] = await db
        .insert(notifications)
        .values({
          userId: ghost.groupAdminId,
          type: "GROUP_GHOST_MERGE_REQUEST",
          title: "Group Ghost Member Merge Request",
          message: `Request to merge ghost member '${ghost.ghostName || "Ghost"}' with user profile in '${ghost.groupName}'.`,
          data: {
            groupId: ghost.groupId,
            ghostMemberId: ghost.ghostMemberId,
            targetUserId,
            requestingUserId: targetUserId,
            status: "PENDING",
          },
        })
        .returning();

      // 6. Create GROUP_GHOST_MERGE_REQUEST_SENT audit notification to requesting target user
      if (targetUserId !== ghost.groupAdminId) {
        await db.insert(notifications).values({
          userId: targetUserId,
          type: "GROUP_GHOST_MERGE_REQUEST_SENT",
          title: "Merge Request Sent",
          message: `Your request to join group '${ghost.groupName}' as ghost member '${ghost.ghostName || "Ghost"}' has been sent to the group admin.`,
          data: {
            groupId: ghost.groupId,
            ghostMemberId: ghost.ghostMemberId,
            targetUserId,
            requestId: insertedReq ? insertedReq.id : undefined,
          },
        });
      }

      matchedRequests.push({
        groupId: ghost.groupId,
        ghostMemberId: ghost.ghostMemberId,
        targetUserId,
        requestId: insertedReq ? insertedReq.id : undefined,
      });
    }
  }

  return {
    success: true,
    matchedCount: matchedRequests.length,
    requests: matchedRequests,
  };
}
