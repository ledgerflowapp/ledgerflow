"use server";

import { db } from "@/db";
import { userSettings } from "@/db/schema";
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

export async function getUserSettings() {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session || !session.user) {
    return null;
  }

  const [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, session.user.id));

  if (!settings) {
    return null;
  }

  return {
    sync_themes: settings.syncThemes ?? false,
    business_theme: settings.businessTheme ?? "light",
    business_accent: settings.businessAccent ?? "blue",
    personal_theme: settings.personalTheme ?? "dark",
    personal_accent: settings.personalAccent ?? "green",
  };
}

export async function updateUserSettings(data: {
  business_theme?: string;
  business_accent?: string;
  personal_theme?: string;
  personal_accent?: string;
  sync_themes?: boolean;
}) {
  const user = await getAuthenticatedUser();

  const updateValues: Record<string, unknown> = {};
  if (data.business_theme !== undefined) updateValues.businessTheme = data.business_theme;
  if (data.business_accent !== undefined) updateValues.businessAccent = data.business_accent;
  if (data.personal_theme !== undefined) updateValues.personalTheme = data.personal_theme;
  if (data.personal_accent !== undefined) updateValues.personalAccent = data.personal_accent;
  if (data.sync_themes !== undefined) updateValues.syncThemes = data.sync_themes;

  const [upserted] = await db
    .insert(userSettings)
    .values({
      userId: user.id,
      ...updateValues,
    })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: updateValues,
    })
    .returning();

  return upserted;
}
