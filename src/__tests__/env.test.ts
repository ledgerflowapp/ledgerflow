import { describe, it, expect, vi } from "vitest";
import { validateEnv, formatEnvErrors, serverSchema } from "@/env";

describe("env validation", () => {
  const validMinEnv = {
    DATABASE_URL: "postgresql://postgres:password@localhost:5432/ledgerflow",
    BETTER_AUTH_SECRET: "super-secret-key-1234567890",
    BETTER_AUTH_URL: "http://localhost:3000",
  };

  it("validates successfully with minimal required variables (server)", () => {
    const result = validateEnv(validMinEnv, { isServer: true });
    expect(result.DATABASE_URL).toBe(validMinEnv.DATABASE_URL);
    expect(result.BETTER_AUTH_SECRET).toBe(validMinEnv.BETTER_AUTH_SECRET);
    expect(result.BETTER_AUTH_URL).toBe(validMinEnv.BETTER_AUTH_URL);
    expect(result.NODE_ENV).toBe("development");
  });

  it("validates successfully with all optional variables set", () => {
    const fullEnv = {
      ...validMinEnv,
      NODE_ENV: "production",
      BETTER_AUTH_URL: "https://ledgerflow.example.com",
      BETTER_AUTH_TRUSTED_ORIGINS: "https://app.example.com,https://admin.example.com",
      GOOGLE_CLIENT_ID: "google-id-123",
      GOOGLE_CLIENT_SECRET: "google-secret-456",
      CRON_SECRET: "cron-secret-789",
      NEXT_PUBLIC_SITE_URL: "https://ledgerflow.example.com",
      NEXT_PUBLIC_SUPABASE_URL: "https://xyz.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key-123",
    };

    const result = validateEnv(fullEnv, { isServer: true });
    expect(result.NODE_ENV).toBe("production");
    expect(result.BETTER_AUTH_URL).toBe("https://ledgerflow.example.com");
    expect(result.GOOGLE_CLIENT_ID).toBe("google-id-123");
    expect(result.NEXT_PUBLIC_SITE_URL).toBe("https://ledgerflow.example.com");
  });

  it("throws error and logs formatted output when DATABASE_URL is missing", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const invalidEnv = {
      BETTER_AUTH_SECRET: "super-secret-key-1234567890",
      BETTER_AUTH_URL: "http://localhost:3000",
    };

    expect(() => validateEnv(invalidEnv as any, { isServer: true })).toThrowError(/DATABASE_URL/);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("❌ Invalid environment variables:"));
    consoleSpy.mockRestore();
  });

  it("throws error when BETTER_AUTH_SECRET is missing", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const invalidEnv = {
      DATABASE_URL: "postgresql://postgres:password@localhost:5432/ledgerflow",
      BETTER_AUTH_URL: "http://localhost:3000",
    };

    expect(() => validateEnv(invalidEnv as any, { isServer: true })).toThrowError(/BETTER_AUTH_SECRET/);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("BETTER_AUTH_SECRET"));
    consoleSpy.mockRestore();
  });

  it("throws error when URL format is invalid", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const invalidEnv = {
      ...validMinEnv,
      BETTER_AUTH_URL: "not-a-valid-url",
    };

    expect(() => validateEnv(invalidEnv, { isServer: true })).toThrowError(/BETTER_AUTH_URL must be a valid URL/);
    consoleSpy.mockRestore();
  });

  it("converts empty string optional values to undefined", () => {
    const envWithEmptyStrings = {
      ...validMinEnv,
      GOOGLE_CLIENT_ID: "",
      GOOGLE_CLIENT_SECRET: "",
      NEXT_PUBLIC_SITE_URL: "",
    };

    const result = validateEnv(envWithEmptyStrings, { isServer: true });
    expect(result.GOOGLE_CLIENT_ID).toBeUndefined();
    expect(result.GOOGLE_CLIENT_SECRET).toBeUndefined();
    expect(result.NEXT_PUBLIC_SITE_URL).toBeUndefined();
  });

  it("validates client environment variables separately when isServer is false", () => {
    const clientEnv = {
      NEXT_PUBLIC_SITE_URL: "https://ledgerflow.example.com",
      NEXT_PUBLIC_SUPABASE_URL: "https://xyz.supabase.co",
    };

    const result = validateEnv(clientEnv, { isServer: false });
    expect(result.NEXT_PUBLIC_SITE_URL).toBe("https://ledgerflow.example.com");
    expect(result.NEXT_PUBLIC_SUPABASE_URL).toBe("https://xyz.supabase.co");
  });

  it("formats env errors correctly with formatEnvErrors", () => {
    const result = serverSchema.safeParse({});
    if (!result.success) {
      const formatted = formatEnvErrors(result.error.issues);
      expect(formatted).toContain("❌ Invalid environment variables:");
      expect(formatted).toContain("DATABASE_URL");
      expect(formatted).toContain("BETTER_AUTH_SECRET");
    } else {
      throw new Error("Expected schema parse to fail");
    }
  });
});
