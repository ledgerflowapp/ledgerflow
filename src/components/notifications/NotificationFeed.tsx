"use client";

import { useEffect, useState, useTransition } from "react";
import {
  GroupGhostMergeNotification,
  getGroupGhostMergeNotificationsAction,
} from "@/lib/actions/notifications";
import { GroupGhostMergeCard } from "./GroupGhostMergeCard";
import { Bell, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

export interface NotificationFeedProps {
  initialNotifications?: GroupGhostMergeNotification[];
  onApprove?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
}

export function NotificationFeed({
  initialNotifications,
  onApprove,
  onReject,
}: NotificationFeedProps) {
  const [notifications, setNotifications] = useState<
    GroupGhostMergeNotification[]
  >(initialNotifications || []);
  const [loading, setLoading] = useState<boolean>(!initialNotifications);
  const [isPending, startTransition] = useTransition();

  const fetchNotifications = () => {
    setLoading(true);
    startTransition(async () => {
      try {
        const notifs = await getGroupGhostMergeNotificationsAction();
        setNotifications(notifs);
      } catch (err: any) {
        toast.error(err?.message || "Failed to load notifications");
      } finally {
        setLoading(false);
      }
    });
  };

  useEffect(() => {
    if (!initialNotifications) {
      fetchNotifications();
    }
  }, [initialNotifications]);

  const handleApprove = (requestId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === requestId
          ? { ...n, data: { ...n.data, status: "APPROVED" as const } }
          : n
      )
    );
    onApprove?.(requestId);
  };

  const handleReject = (requestId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === requestId
          ? { ...n, data: { ...n.data, status: "REJECTED" as const } }
          : n
      )
    );
    onReject?.(requestId);
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">
            Merge Requests Feed
          </h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchNotifications}
          disabled={loading || isPending}
          className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${
              loading || isPending ? "animate-spin" : ""
            }`}
          />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2 border rounded-lg bg-card">
          <Spinner className="h-6 w-6 text-primary" />
          <span className="text-sm">Loading merge requests...</span>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center border rounded-lg bg-card/50">
          <Bell className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <h3 className="text-sm font-medium text-foreground">
            No merge requests pending
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            When auto-matching detects unlinked group ghost member slots for users, approval requests will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {notifications.map((notif) => (
            <GroupGhostMergeCard
              key={notif.id}
              request={{
                id: notif.id,
                groupId: notif.data.groupId,
                groupName: notif.data.groupName,
                ghostMemberId: notif.data.ghostMemberId,
                ghostName: notif.data.ghostName,
                targetUser: notif.data.targetUser,
                status: notif.data.status,
                createdAt: notif.createdAt,
              }}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  );
}
