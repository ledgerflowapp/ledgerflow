import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateContactMergeGuards } from "../contacts-guards";
import { validateContactMergeGuards as validateFromContacts } from "../contacts";
import { getSessionUser } from "@/lib/auth-session";

vi.mock("@/lib/auth-session", () => ({
  getSessionUser: vi.fn(),
}));

describe("validateContactMergeGuards", () => {
  const mockGetSessionUser = vi.mocked(getSessionUser);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should re-export validateContactMergeGuards from contacts.ts", () => {
    expect(validateFromContacts).toBe(validateContactMergeGuards);
  });

  describe("1. Session Authentication Guard", () => {
    it("should throw an error if no active session exists", async () => {
      mockGetSessionUser.mockResolvedValueOnce(null);

      const input = {
        contact: { id: "c1", userId: "user-owner" },
        targetProfile: { id: "user-target", phoneVerified: true },
      };

      await expect(validateContactMergeGuards(input)).rejects.toThrow(
        "Unauthorized: Active session required"
      );
    });

    it("should throw an error if explicit sessionUser is null", async () => {
      const input = {
        contact: { id: "c1", userId: "user-owner" },
        targetProfile: { id: "user-target", phoneVerified: true },
        sessionUser: null,
      };

      await expect(validateContactMergeGuards(input)).rejects.toThrow(
        "Unauthorized: Active session required"
      );
    });
  });

  describe("2. Caller Ownership Guard", () => {
    it("should allow caller who is the contact owner", async () => {
      const input = {
        contact: { id: "c1", userId: "user-owner" },
        targetProfile: { id: "user-target", emailVerified: true },
        sessionUser: { id: "user-owner" },
      };

      const result = await validateContactMergeGuards(input);
      expect(result.valid).toBe(true);
    });

    it("should allow caller who is the target user", async () => {
      const input = {
        contact: { id: "c1", userId: "user-owner" },
        targetProfile: { id: "user-target", phoneVerified: true },
        sessionUser: { id: "user-target" },
      };

      const result = await validateContactMergeGuards(input);
      expect(result.valid).toBe(true);
    });

    it("should throw an error if caller is neither contact owner nor target user", async () => {
      const input = {
        contact: { id: "c1", userId: "user-owner" },
        targetProfile: { id: "user-target", phoneVerified: true },
        sessionUser: { id: "user-unrelated" },
      };

      await expect(validateContactMergeGuards(input)).rejects.toThrow(
        "Unauthorized: Caller must be contact owner or target user"
      );
    });
  });

  describe("3. Self-Merge Guard", () => {
    it("should throw an error if contact.userId equals targetProfile.id", async () => {
      const input = {
        contact: { id: "c1", userId: "user-same" },
        targetProfile: { id: "user-same", phoneVerified: true },
        sessionUser: { id: "user-same" },
      };

      await expect(validateContactMergeGuards(input)).rejects.toThrow(
        "Invalid merge: Cannot merge contact into owner profile"
      );
    });
  });

  describe("4. Target Profile Verification Guard", () => {
    it("should succeed when target profile has phoneVerified = true", async () => {
      const input = {
        contact: { id: "c1", userId: "user-owner" },
        targetProfile: { id: "user-target", phoneVerified: true, emailVerified: false },
        sessionUser: { id: "user-owner" },
      };

      const result = await validateContactMergeGuards(input);
      expect(result.valid).toBe(true);
    });

    it("should succeed when target profile has emailVerified = true", async () => {
      const input = {
        contact: { id: "c1", userId: "user-owner" },
        targetProfile: { id: "user-target", phoneVerified: false, emailVerified: true },
        sessionUser: { id: "user-owner" },
      };

      const result = await validateContactMergeGuards(input);
      expect(result.valid).toBe(true);
    });

    it("should throw an error when target profile is unverified (both phoneVerified and emailVerified false)", async () => {
      const input = {
        contact: { id: "c1", userId: "user-owner" },
        targetProfile: { id: "user-target", phoneVerified: false, emailVerified: false },
        sessionUser: { id: "user-owner" },
      };

      await expect(validateContactMergeGuards(input)).rejects.toThrow(
        "Invalid merge: Target profile must have verified phone or email"
      );
    });

    it("should throw an error when target profile verification properties are missing or undefined", async () => {
      const input = {
        contact: { id: "c1", userId: "user-owner" },
        targetProfile: { id: "user-target" },
        sessionUser: { id: "user-owner" },
      };

      await expect(validateContactMergeGuards(input)).rejects.toThrow(
        "Invalid merge: Target profile must have verified phone or email"
      );
    });
  });
});
