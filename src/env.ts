import { z } from "zod";

const optionalString = () =>
  z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    z.string().optional()
  ) as z.ZodType<string | undefined>;

const optionalUrl = (message?: string) =>
  z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    z.string().url(message).optional()
  ) as z.ZodType<string | undefined>;

/**
 * Server-side environment variables schema.
 * Secret keys and server configuration options that must NEVER be exposed to the client.
 */
export const serverSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z
    .string({
      message: "DATABASE_URL is required to connect to Postgres",
    })
    .min(1, "DATABASE_URL cannot be empty"),
  BETTER_AUTH_SECRET: z
    .string({
      message: "BETTER_AUTH_SECRET is required for session signing",
    })
    .min(1, "BETTER_AUTH_SECRET cannot be empty"),
  BETTER_AUTH_URL: z
    .string({
      message: "BETTER_AUTH_URL is required",
    })
    .url("BETTER_AUTH_URL must be a valid URL"),
  BETTER_AUTH_TRUSTED_ORIGINS: optionalString(),
  GOOGLE_CLIENT_ID: optionalString(),
  GOOGLE_CLIENT_SECRET: optionalString(),
  CRON_SECRET: optionalString(),
  PORT: optionalString(),
  CI: optionalString(),
  DB_SCHEMA: optionalString(),
});

/**
 * Client-side environment variables schema.
 * Environment variables exposed to the browser. Must start with NEXT_PUBLIC_.
 */
export const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: optionalUrl("NEXT_PUBLIC_SITE_URL must be a valid URL"),
  NEXT_PUBLIC_VERCEL_URL: optionalString(),
});

export const envSchema = serverSchema.extend(clientSchema.shape);

export type Env = z.infer<typeof envSchema>;

export interface ValidateEnvOptions {
  /**
   * Override server vs client validation mode.
   * Defaults to `typeof window === "undefined"`.
   */
  isServer?: boolean;
}

/**
 * Format Zod validation errors into a clear, readable message.
 */
export function formatEnvErrors(issues: z.ZodIssue[]): string {
  const formattedLines = issues.map(
    (issue) => `  - ${issue.path.join(".")}: ${issue.message}`
  );
  return [
    "❌ Invalid environment variables:",
    ...formattedLines,
    "\nPlease check your .env or .env.local file. Refer to .env.example for required variables.",
  ].join("\n");
}

/**
 * Validate runtime environment variables against schemas.
 * Throws an error and logs a clear message if validation fails.
 */
export function validateEnv(
  runtimeEnv: Record<string, string | undefined> = process.env,
  options?: ValidateEnvOptions
): Env {
  const isServer =
    options?.isServer ??
    (typeof window === "undefined" || process.env.NODE_ENV === "test");

  // Validate server + client on server, or client-only on browser
  const schemaToValidate = isServer ? envSchema : clientSchema;

  const parsed = schemaToValidate.safeParse(runtimeEnv);

  if (!parsed.success) {
    const errorMessage = formatEnvErrors(parsed.error.issues);
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  return parsed.data as Env;
}

let cachedEnv: Env | undefined;

/**
 * Get or initialize validated environment variables singleton.
 */
export function getEnv(): Env {
  if (!cachedEnv || process.env.NODE_ENV === "test") {
    cachedEnv = validateEnv(process.env);
  }
  return cachedEnv;
}

/**
 * Reset cached env (useful for testing).
 */
export function resetEnvCache(): void {
  cachedEnv = undefined;
}

/**
 * Proxy object for direct `env.VARIABLE` access.
 * Lazily validates `process.env` on first access.
 */
export const env: Env = new Proxy({} as Env, {
  get(_target, prop: string | symbol) {
    if (typeof prop === "string") {
      const validated = getEnv();
      return validated[prop as keyof Env];
    }
    return undefined;
  },
});
