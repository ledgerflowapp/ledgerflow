"use server";

import { db } from "@/db";
import { profiles, userSettings } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

async function getAuthenticatedUser(reqHeaders?: Headers) {
  const h = reqHeaders ?? (await headers());
  const session = await auth.api.getSession({ headers: h });
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function completeOnboarding(data: {
  username: string;
  mode: "personal" | "business";
  accent: string;
  currency: string;
}) {
  const user = await getAuthenticatedUser();
  
  await db
    .update(profiles)
    .set({
      username: data.username,
      currencySymbol: data.currency,
      onboardingCompleted: true,
      onboardingStep: 4,
    })
    .where(eq(profiles.id, user.id));

  await db
    .insert(userSettings)
    .values({
      userId: user.id,
      defaultWorkspaceMode: data.mode,
      businessAccent: data.accent,
      personalAccent: data.accent,
    })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: {
        defaultWorkspaceMode: data.mode,
        businessAccent: data.accent,
        personalAccent: data.accent,
      }
    });

  return { success: true };
}

export async function updateOnboardingStep(step: number) {
  const user = await getAuthenticatedUser();
  await db.update(profiles).set({ onboardingStep: step }).where(eq(profiles.id, user.id));
  return { success: true };
}
