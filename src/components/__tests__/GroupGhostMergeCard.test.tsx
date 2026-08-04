import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderToString } from "react-dom/server";
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { GroupGhostMergeCard } from "../notifications/GroupGhostMergeCard";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
import { NotificationFeed } from "../notifications/NotificationFeed";
import { approveGroupGhostMerge, rejectGroupGhostMerge } from "@/lib/actions/groups";
import { toast } from "sonner";

vi.mock("@/lib/actions/groups", () => ({
  approveGroupGhostMerge: vi.fn(),
  rejectGroupGhostMerge: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("GroupGhostMergeCard Component Rendering", () => {
  const samplePendingRequest = {
    id: "req-123",
    groupId: "g-1",
    groupName: "Ski Trip 2026",
    ghostMemberId: "ghost-99",
    ghostName: "Ghost Alex",
    targetUser: {
      id: "user-target-1",
      name: "Alex Rivera",
      email: "alex@example.com",
      phone: "+15550199",
      avatarUrl: "https://example.com/avatar.jpg",
    },
    status: "PENDING" as const,
    createdAt: "2026-08-04T10:00:00.000Z",
  };

  it("renders group name, ghost member display name, target user profile info, and action buttons", () => {
    const html = renderToString(<GroupGhostMergeCard request={samplePendingRequest} />);

    expect(html).toContain("Ski Trip 2026");
    expect(html).toContain("Ghost:");
    expect(html).toContain("Ghost Alex");
    expect(html).toContain("Alex Rivera");
    expect(html).toContain("alex@example.com");
    expect(html).toContain("+15550199");
    expect(html).toContain("Approve");
    expect(html).toContain("Reject");
  });

  it("renders Approved badge when status is APPROVED", () => {
    const approvedRequest = {
      ...samplePendingRequest,
      status: "APPROVED" as const,
    };
    const html = renderToString(<GroupGhostMergeCard request={approvedRequest} />);

    expect(html).toContain("Approved");
    expect(html).not.toContain("Approve</button>");
    expect(html).not.toContain("Reject</button>");
  });

  it("renders Rejected badge when status is REJECTED", () => {
    const rejectedRequest = {
      ...samplePendingRequest,
      status: "REJECTED" as const,
    };
    const html = renderToString(<GroupGhostMergeCard request={rejectedRequest} />);

    expect(html).toContain("Rejected");
    expect(html).not.toContain("Approve</button>");
    expect(html).not.toContain("Reject</button>");
  });
});

describe("GroupGhostMergeCard Action Button Interactions", () => {
  let container: HTMLDivElement;
  let root: Root;

  const sampleRequest = {
    id: "req-777",
    groupId: "g-1",
    groupName: "Camping 2026",
    ghostMemberId: "ghost-123",
    ghostName: "Ghost Jordan",
    targetUser: {
      id: "user-jordan",
      name: "Jordan Lee",
      email: "jordan@example.com",
      phone: "+15550999",
      avatarUrl: null,
    },
    status: "PENDING" as const,
    createdAt: "2026-08-04T10:00:00.000Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("invokes approveGroupGhostMerge and displays success toast on Approve click", async () => {
    const onApprove = vi.fn();
    (approveGroupGhostMerge as any).mockResolvedValueOnce({ success: true });

    await act(async () => {
      root.render(<GroupGhostMergeCard request={sampleRequest} onApprove={onApprove} />);
    });

    const approveBtn = container.querySelector("button[aria-label='Approve merge request']") as HTMLButtonElement;
    expect(approveBtn).not.toBeNull();

    await act(async () => {
      approveBtn.click();
    });

    expect(approveGroupGhostMerge).toHaveBeenCalledWith("req-777");
    expect(toast.success).toHaveBeenCalledWith("Approved merge request for Jordan Lee");
    expect(onApprove).toHaveBeenCalledWith("req-777");
    expect(container.textContent).toContain("Approved");
  });

  it("invokes rejectGroupGhostMerge and displays success toast on Reject click", async () => {
    const onReject = vi.fn();
    (rejectGroupGhostMerge as any).mockResolvedValueOnce({ success: true });

    await act(async () => {
      root.render(<GroupGhostMergeCard request={sampleRequest} onReject={onReject} />);
    });

    const rejectBtn = container.querySelector("button[aria-label='Reject merge request']") as HTMLButtonElement;
    expect(rejectBtn).not.toBeNull();

    await act(async () => {
      rejectBtn.click();
    });

    expect(rejectGroupGhostMerge).toHaveBeenCalledWith("req-777");
    expect(toast.success).toHaveBeenCalledWith("Rejected merge request for Jordan Lee");
    expect(onReject).toHaveBeenCalledWith("req-777");
    expect(container.textContent).toContain("Rejected");
  });

  it("reverts status and shows error toast when approveGroupGhostMerge fails", async () => {
    (approveGroupGhostMerge as any).mockRejectedValueOnce(new Error("Database error"));

    await act(async () => {
      root.render(<GroupGhostMergeCard request={sampleRequest} />);
    });

    const approveBtn = container.querySelector("button[aria-label='Approve merge request']") as HTMLButtonElement;

    await act(async () => {
      approveBtn.click();
    });

    expect(approveGroupGhostMerge).toHaveBeenCalledWith("req-777");
    expect(toast.error).toHaveBeenCalledWith("Database error");
    expect(container.textContent).toContain("Approve");
    expect(container.textContent).not.toContain("Approved");
  });
});

describe("NotificationFeed Component Rendering", () => {
  it("renders empty state when initialNotifications is empty", () => {
    const html = renderToString(<NotificationFeed initialNotifications={[]} />);

    expect(html).toContain("No merge requests pending");
  });

  it("renders pending merge request cards when items exist", () => {
    const notifs = [
      {
        id: "req-1",
        userId: "admin-1",
        type: "GROUP_GHOST_MERGE_REQUEST" as const,
        title: "Merge Request",
        message: "Merge request message",
        isRead: false,
        createdAt: "2026-08-04T10:00:00.000Z",
        data: {
          groupId: "g-1",
          groupName: "Beach Trip 2026",
          ghostMemberId: "ghost-1",
          ghostName: "Ghost Sam",
          targetUserId: "user-target-1",
          targetUser: {
            id: "user-target-1",
            name: "Sam Taylor",
            email: "sam@example.com",
            phone: null,
            avatarUrl: null,
          },
          status: "PENDING" as const,
        },
      },
    ];

    const html = renderToString(<NotificationFeed initialNotifications={notifs} />);

    expect(html).toContain("Beach Trip 2026");
    expect(html).toContain("Ghost:");
    expect(html).toContain("Ghost Sam");
    expect(html).toContain("Sam Taylor");
  });
});

