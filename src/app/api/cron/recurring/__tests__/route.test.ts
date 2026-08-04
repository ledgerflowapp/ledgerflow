import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

const mockProcessDue = vi.fn();

vi.mock("@/lib/actions/recurring", () => ({
  processDueRecurringTransactions: () => mockProcessDue(),
}));

import { POST } from "../route";

describe("POST /api/cron/recurring", () => {
  const originalEnv = process.env.CRON_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "super-secret-key-123";
  });

  afterEach(() => {
    process.env.CRON_SECRET = originalEnv;
  });

  it("returns 401 Unauthorized if Authorization header is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/cron/recurring", {
      method: "POST",
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("returns 401 Unauthorized if Bearer token is invalid", async () => {
    const req = new NextRequest("http://localhost:3000/api/cron/recurring", {
      method: "POST",
      headers: {
        authorization: "Bearer wrong-key",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("executes processDueRecurringTransactions and returns 200 on valid Bearer auth", async () => {
    mockProcessDue.mockResolvedValueOnce({
      processedCount: 3,
      errorCount: 0,
      rulesProcessed: 2,
    });

    const req = new NextRequest("http://localhost:3000/api/cron/recurring", {
      method: "POST",
      headers: {
        authorization: "Bearer super-secret-key-123",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      success: true,
      processedCount: 3,
      errorCount: 0,
      rulesProcessed: 2,
    });
    expect(mockProcessDue).toHaveBeenCalledTimes(1);
  });
});
