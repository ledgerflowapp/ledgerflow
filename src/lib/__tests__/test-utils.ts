import { vi } from "vitest";
import { auth } from "@/lib/auth";

export function mockAuthSession(user: { id: string; email?: string; name?: string } | null) {
  if (user) {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: {
        id: user.id,
        email: user.email ?? "test@example.com",
        name: user.name ?? "Test User",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      session: {
        id: "session-1",
        userId: user.id,
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    } as any);
  } else {
    vi.mocked(auth.api.getSession).mockResolvedValue(null as any);
  }
}
