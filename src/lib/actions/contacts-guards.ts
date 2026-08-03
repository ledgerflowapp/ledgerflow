import { getSessionUser } from "@/lib/auth-session";

export interface ContactMergeGuardContact {
  id: string;
  userId: string;
  [key: string]: unknown;
}

export interface ContactMergeGuardTargetProfile {
  id: string;
  phoneVerified?: boolean | null;
  emailVerified?: boolean | null;
  [key: string]: unknown;
}

export interface ContactMergeGuardSessionUser {
  id: string;
  [key: string]: unknown;
}

export interface ValidateContactMergeGuardsParams {
  contact: ContactMergeGuardContact;
  targetProfile: ContactMergeGuardTargetProfile;
  sessionUser?: ContactMergeGuardSessionUser | null;
}

export interface ContactMergeGuardResult {
  valid: true;
  sessionUser: ContactMergeGuardSessionUser;
  contact: ContactMergeGuardContact;
  targetProfile: ContactMergeGuardTargetProfile;
}

/**
 * Validates authorization, caller ownership, self-merge restrictions,
 * and target profile verification for contact merging workflows.
 */
export async function validateContactMergeGuards(
  params: ValidateContactMergeGuardsParams
): Promise<ContactMergeGuardResult> {
  const { contact, targetProfile } = params;

  // 1. Session Authentication Guard
  let sessionUser = params.sessionUser;
  if (sessionUser === undefined) {
    sessionUser = await getSessionUser();
  }

  if (!sessionUser || !sessionUser.id) {
    throw new Error("Unauthorized: Active session required");
  }

  const targetUserId = targetProfile.id;

  // 2. Caller Ownership Guard
  if (sessionUser.id !== contact.userId && sessionUser.id !== targetUserId) {
    throw new Error("Unauthorized: Caller must be contact owner or target user");
  }

  // 3. Self-Merge Guard
  if (contact.userId === targetUserId) {
    throw new Error("Invalid merge: Cannot merge contact into owner profile");
  }

  // 4. Target Profile Verification Guard
  const isVerified = Boolean(targetProfile.phoneVerified || targetProfile.emailVerified);
  if (!isVerified) {
    throw new Error("Invalid merge: Target profile must have verified phone or email");
  }

  return {
    valid: true,
    sessionUser,
    contact,
    targetProfile,
  };
}
