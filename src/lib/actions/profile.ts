"use server";

import { db } from "@/db";
import { profiles } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { Profile } from "@/types";

async function getAuthenticatedUser(reqHeaders?: Headers) {
  const h = reqHeaders ?? (await headers());
  const session = await auth.api.getSession({ headers: h });
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function getProfile(): Promise<Profile | null> {
    try {
        const user = await getAuthenticatedUser();
        const [profile] = await db
            .select()
            .from(profiles)
            .where(eq(profiles.id, user.id));

        if (!profile) return null;

        return {
            id: profile.id,
            full_name: profile.fullName || null,
            username: profile.username || null,
            business_name: profile.businessName || null,
            phone: profile.phone || null,
            email: profile.email || null,
            avatar_url: profile.avatarUrl || null,
            currency_symbol: profile.currencySymbol || '₹',
            discoverable_by_phone: profile.discoverableByPhone ?? true,
            discoverable_by_username: profile.discoverableByUsername ?? true,
        };
    } catch (e) {
        return null;
    }
}

export async function updateProfileData(data: Partial<Profile>) {
    const user = await getAuthenticatedUser();

    const updateValues: Record<string, any> = {};
    if (data.full_name !== undefined) updateValues.fullName = data.full_name;
    if (data.business_name !== undefined) updateValues.businessName = data.business_name;
    if (data.phone !== undefined) updateValues.phone = data.phone;
    if (data.avatar_url !== undefined) updateValues.avatarUrl = data.avatar_url;
    if (data.discoverable_by_phone !== undefined) updateValues.discoverableByPhone = data.discoverable_by_phone;
    if (data.discoverable_by_username !== undefined) updateValues.discoverableByUsername = data.discoverable_by_username;
    
    // We do NOT update username here because it's read-only after onboarding

    if (Object.keys(updateValues).length > 0) {
        await db
            .update(profiles)
            .set(updateValues)
            .where(eq(profiles.id, user.id));
    }

    return { success: true };
}
