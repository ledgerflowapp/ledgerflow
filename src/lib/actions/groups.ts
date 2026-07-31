"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { groups, groupMembers, transactions, transactionSplits, profiles } from "@/db/schema";
import { eq, and, isNull, count, inArray } from "drizzle-orm";

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

export async function getGroupByInviteAction(inviteCode: string) {
  const targetGroup = await db.select().from(groups).where(eq(groups.inviteCode, inviteCode)).limit(1);
  if (targetGroup.length === 0) return [];
  
  const group = targetGroup[0];
  
  const ghosts = await db.select({
    id: groupMembers.id,
    ghostName: groupMembers.ghostName,
    avatarUrl: groupMembers.avatarUrl
  }).from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, group.id),
        isNull(groupMembers.userId)
      )
    );
    
  return [{
    group_id: group.id,
    group_name: group.name,
    group_avatar_url: group.avatarUrl,
    ghost_members: ghosts.length > 0 ? ghosts.map(g => ({
      id: g.id,
      name: g.ghostName || "",
      avatar_url: g.avatarUrl ?? null
    })) : null
  }];
}

export async function joinGroupAction(inviteCode: string, claimGhostMemberId: string | null = null, userIdOverride?: string) {
  const user = await getSessionUser(userIdOverride);
  const userId = user.id;
  
  return await db.transaction(async (tx) => {
    // 1. Validate Invite Code
    const targetGroup = await tx.select().from(groups).where(eq(groups.inviteCode, inviteCode)).limit(1);
    if (targetGroup.length === 0) {
      throw new Error("Invalid invite code");
    }
    const targetGroupId = targetGroup[0].id;
    
    // 2. Check if already a member
    const existingMember = await tx.select().from(groupMembers).where(
      and(
        eq(groupMembers.groupId, targetGroupId),
        eq(groupMembers.userId, userId)
      )
    ).limit(1);
    
    if (existingMember.length > 0) {
      return { success: true, message: "Already a member", group_id: targetGroupId };
    }
    
    // 3. Logic Branch: Claim Ghost vs Join New
    if (claimGhostMemberId) {
      const ghostMatch = await tx.select().from(groupMembers).where(
        and(
          eq(groupMembers.id, claimGhostMemberId),
          eq(groupMembers.groupId, targetGroupId),
          isNull(groupMembers.userId)
        )
      ).limit(1);
      
      if (ghostMatch.length === 0) {
        throw new Error("Ghost member not found or already claimed");
      }
      
      await tx.update(groupMembers)
        .set({ userId, ghostName: null, joinedAt: new Date() })
        .where(eq(groupMembers.id, claimGhostMemberId));
    } else {
      await tx.insert(groupMembers).values({
        groupId: targetGroupId,
        userId: userId,
      });
    }
    
    return { success: true, group_id: targetGroupId };
  });
}

export async function linkGhostToFriendAction(groupId: string, ghostMemberId: string, friendUserId: string, userIdOverride?: string) {
  const user = await getSessionUser(userIdOverride);
  const currentUserId = user.id;
  
  return await db.transaction(async (tx) => {
    // 1. Check Permissions (Must be Group Creator)
    const targetGroup = await tx.select().from(groups).where(eq(groups.id, groupId)).limit(1);
    if (targetGroup.length === 0) throw new Error("Group not found");
    if (targetGroup[0].createdBy !== currentUserId) {
      throw new Error("Only group admin can link members");
    }
    
    // 2. Check if Friend is ALREADY in the group
    const existingMember = await tx.select().from(groupMembers).where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, friendUserId)
      )
    ).limit(1);
    
    if (existingMember.length > 0) {
      throw new Error("This friend is already a member of the group. Cannot merge.");
    }
    
    // 3. Perform the Link
    const ghostMatch = await tx.select().from(groupMembers).where(
      and(
        eq(groupMembers.id, ghostMemberId),
        eq(groupMembers.groupId, groupId),
        isNull(groupMembers.userId)
      )
    ).limit(1);
    
    if (ghostMatch.length === 0) {
      throw new Error("Ghost member not found");
    }
    
    await tx.update(groupMembers)
      .set({ userId: friendUserId, ghostName: null, avatarUrl: null })
      .where(eq(groupMembers.id, ghostMemberId));
      
    return { success: true };
  });
}

export async function createGroupAction(
  data: {
    name: string;
    type?: string;
    members?: Array<{ id?: string; name: string; type: "REAL" | "GHOST"; avatar_url?: string | null }>;
  },
  userIdOverride?: string
) {
  const user = await getSessionUser(userIdOverride);
  const userId = user.id;

  return await db.transaction(async (tx) => {
    const [insertedGroup] = await tx
      .insert(groups)
      .values({
        name: data.name,
        type: data.type || "GENERAL",
        createdBy: userId,
      })
      .returning();

    const membersToAdd = [
      { groupId: insertedGroup.id, userId: userId },
      ...(data.members || []).map((m) => ({
        groupId: insertedGroup.id,
        userId: m.type === "REAL" ? m.id : null,
        ghostName: m.type === "GHOST" ? m.name : null,
      })),
    ];

    await tx.insert(groupMembers).values(membersToAdd);

    return {
      id: insertedGroup.id,
      name: insertedGroup.name,
      type: insertedGroup.type,
      createdBy: insertedGroup.createdBy,
      avatarUrl: insertedGroup.avatarUrl,
      inviteCode: insertedGroup.inviteCode,
      createdAt: insertedGroup.createdAt ? insertedGroup.createdAt.toISOString() : new Date().toISOString(),
    };
  });
}

export async function updateGroupAction(data: { id: string; name: string }, userIdOverride?: string) {
  await getSessionUser(userIdOverride);

  await db
    .update(groups)
    .set({ name: data.name })
    .where(eq(groups.id, data.id));

  return { success: true };
}

export async function deleteGroupAction(data: { id: string }, userIdOverride?: string) {
  await getSessionUser(userIdOverride);

  await db.delete(groups).where(eq(groups.id, data.id));

  return { success: true };
}

export async function removeGroupMemberAction(data: { groupId: string; memberId: string }, userIdOverride?: string) {
  await getSessionUser(userIdOverride);

  await db.delete(groupMembers).where(
    and(
      eq(groupMembers.id, data.memberId),
      eq(groupMembers.groupId, data.groupId)
    )
  );

  return { success: true };
}

export async function getGroupsAction(userIdOverride?: string) {
  const user = await getSessionUser(userIdOverride);

  const rows = await db
    .select({
      groups: groups,
    })
    .from(groupMembers)
    .innerJoin(groups, eq(groupMembers.groupId, groups.id))
    .where(eq(groupMembers.userId, user.id));

  return rows.map((row) => ({
    id: row.groups.id,
    name: row.groups.name,
    type: row.groups.type,
    created_by: row.groups.createdBy,
    avatar_url: row.groups.avatarUrl,
    invite_code: row.groups.inviteCode,
    created_at: row.groups.createdAt ? row.groups.createdAt.toISOString() : new Date().toISOString(),
  }));
}

export async function getGroupDetailsAction(groupId: string, userIdOverride?: string) {
  await getSessionUser(userIdOverride);

  const groupRows = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
  if (groupRows.length === 0) throw new Error("Group not found");

  const group = groupRows[0];

  const memberRows = await db
    .select({
      member: groupMembers,
      profile: profiles,
    })
    .from(groupMembers)
    .leftJoin(profiles, eq(groupMembers.userId, profiles.id))
    .where(eq(groupMembers.groupId, groupId));

  const membersList = memberRows.map((r) => ({
    id: r.member.id,
    group_id: r.member.groupId,
    user_id: r.member.userId,
    ghost_name: r.member.ghostName,
    avatar_url: r.member.avatarUrl,
    joined_at: r.member.joinedAt ? r.member.joinedAt.toISOString() : new Date().toISOString(),
    profiles: r.profile
      ? {
          full_name: r.profile.fullName,
          avatar_url: r.profile.avatarUrl,
        }
      : undefined,
  }));

  return {
    group: {
      id: group.id,
      name: group.name,
      type: group.type,
      created_by: group.createdBy,
      avatar_url: group.avatarUrl,
      invite_code: group.inviteCode,
      created_at: group.createdAt ? group.createdAt.toISOString() : new Date().toISOString(),
    },
    members: membersList,
  };
}

export async function getGroupBalancesAction(groupId: string, userIdOverride?: string) {
  await getSessionUser(userIdOverride);

  const membersList = await db
    .select({ id: groupMembers.id, userId: groupMembers.userId })
    .from(groupMembers)
    .where(eq(groupMembers.groupId, groupId));

  const txns = await db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      payerId: transactions.payerId,
      payerGroupMemberId: transactions.payerGroupMemberId,
    })
    .from(transactions)
    .where(eq(transactions.groupId, groupId));

  const balanceMap: Record<string, number> = {};
  for (const member of membersList) {
    balanceMap[member.id] = 0;
  }

  if (txns.length === 0) return balanceMap;

  const txnIds = txns.map((t) => t.id);
  const splits = await db
    .select({
      transactionId: transactionSplits.transactionId,
      groupMemberId: transactionSplits.groupMemberId,
      amount: transactionSplits.amount,
    })
    .from(transactionSplits)
    .where(inArray(transactionSplits.transactionId, txnIds));

  const splitsByTxn: Record<string, typeof splits> = {};
  for (const split of splits) {
    if (!split.transactionId) continue;
    if (!splitsByTxn[split.transactionId]) {
      splitsByTxn[split.transactionId] = [];
    }
    splitsByTxn[split.transactionId].push(split);
  }

  for (const txn of txns) {
    let payerMemberId: string | null = null;
    if (txn.payerGroupMemberId) {
      payerMemberId = txn.payerGroupMemberId;
    } else if (txn.payerId) {
      const match = membersList.find((m) => m.userId === txn.payerId);
      payerMemberId = match?.id || null;
    }

    const numAmount = Number(txn.amount);
    if (payerMemberId && balanceMap[payerMemberId] !== undefined) {
      balanceMap[payerMemberId] += numAmount;
    }

    const txnSplits = splitsByTxn[txn.id] || [];
    for (const split of txnSplits) {
      if (split.groupMemberId && balanceMap[split.groupMemberId] !== undefined) {
        balanceMap[split.groupMemberId] -= Number(split.amount);
      }
    }
  }

  for (const key of Object.keys(balanceMap)) {
    balanceMap[key] = Math.round(balanceMap[key] * 100) / 100;
  }

  return balanceMap;
}

export async function getGroupTransactionCountAction(groupId: string, userIdOverride?: string) {
  await getSessionUser(userIdOverride);

  const [result] = await db
    .select({ count: count() })
    .from(transactions)
    .where(eq(transactions.groupId, groupId));

  return { count: result ? result.count : 0 };
}
