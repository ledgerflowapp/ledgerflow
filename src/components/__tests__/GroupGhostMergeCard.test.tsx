import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import React from "react";
import { GroupGhostMergeCard } from "../notifications/GroupGhostMergeCard";
import { NotificationFeed } from "../notifications/NotificationFeed";

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
