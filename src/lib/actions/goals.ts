"use server";

import { db } from "@/db";
import { goals, goalContributions } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth-session";

export interface CreateGoalInput {
  name: string;
  targetAmount: number; // in paise
  deadline?: Date | string | null;
}

export interface ContributeGoalInput {
  id: string; // goalId
  amount: number; // in paise
  note?: string | null;
}

/**
 * Creates a new goal for the authenticated user.
 */
export async function createGoalAction(input: CreateGoalInput) {
  const currentUser = await getSessionUser();
  if (!currentUser) {
    throw new Error("Unauthorized");
  }

  const [insertedGoal] = await db
    .insert(goals)
    .values({
      userId: currentUser.id,
      name: input.name,
      targetAmount: String(input.targetAmount),
      currentAmount: "0",
      deadline: input.deadline ? new Date(input.deadline) : null,
    })
    .returning();

  return {
    id: insertedGoal.id,
    name: insertedGoal.name,
    target_amount: Number(insertedGoal.targetAmount),
    current_amount: Number(insertedGoal.currentAmount || 0),
    deadline: insertedGoal.deadline ? insertedGoal.deadline.toISOString() : null,
  };
}

/**
 * Fetches all goals for the authenticated user ordered by deadline.
 */
export async function getGoalsAction() {
  const currentUser = await getSessionUser();
  if (!currentUser) {
    throw new Error("Unauthorized");
  }

  const rows = await db.query.goals.findMany({
    where: eq(goals.userId, currentUser.id),
    orderBy: [asc(goals.deadline)],
  });

  return rows.map((g) => ({
    id: g.id,
    name: g.name,
    target_amount: Number(g.targetAmount),
    current_amount: Number(g.currentAmount || 0),
    deadline: g.deadline ? g.deadline.toISOString() : null,
  }));
}

/**
 * Contributes an amount to a goal using an atomic Drizzle database transaction.
 * Replaces the atomic_contribute_goal_rpc / contribute_to_goal PostgreSQL procedure.
 */
export async function contributeGoalAction(input: ContributeGoalInput) {
  const currentUser = await getSessionUser();
  if (!currentUser) {
    throw new Error("Unauthorized");
  }

  return await db.transaction(async (tx) => {
    // 1. Fetch goal with ownership guard check
    const goal = await tx.query.goals.findFirst({
      where: and(eq(goals.id, input.id), eq(goals.userId, currentUser.id)),
    });

    if (!goal) {
      throw new Error("Goal not found or unauthorized");
    }

    const currentAmount = Number(goal.currentAmount || 0);
    const targetAmount = Number(goal.targetAmount);
    const newAmount = currentAmount + input.amount;

    // 2. Overcontribution guard check
    if (newAmount > targetAmount) {
      throw new Error("Contribution would exceed goal target");
    }

    // 3. Update goal current_amount
    const [updatedGoal] = await tx
      .update(goals)
      .set({ currentAmount: String(newAmount) })
      .where(and(eq(goals.id, input.id), eq(goals.userId, currentUser.id)))
      .returning();

    // 4. Record contribution entry
    await tx.insert(goalContributions).values({
      goalId: input.id,
      userId: currentUser.id,
      amount: String(input.amount),
      note: input.note || null,
    });

    return {
      id: updatedGoal.id,
      name: updatedGoal.name,
      target_amount: Number(updatedGoal.targetAmount),
      current_amount: Number(updatedGoal.currentAmount || 0),
      deadline: updatedGoal.deadline ? updatedGoal.deadline.toISOString() : null,
    };
  });
}

/**
 * Deletes a goal by ID if owned by the logged-in user.
 */
export async function deleteGoalAction(id: string) {
  const currentUser = await getSessionUser();
  if (!currentUser) {
    throw new Error("Unauthorized");
  }

  const existing = await db.query.goals.findFirst({
    where: and(eq(goals.id, id), eq(goals.userId, currentUser.id)),
  });

  if (!existing) {
    throw new Error("Unauthorized or goal not found");
  }

  await db
    .delete(goals)
    .where(and(eq(goals.id, id), eq(goals.userId, currentUser.id)));

  return { success: true };
}
