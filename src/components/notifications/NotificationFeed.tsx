"use client";

import { useEffect, useState, useTransition } from "react";
import {
  PersonalNotification,
  getNotificationsAction,
  markAllNotificationsAsReadAction,
} from "@/lib/actions/notifications";
import { GroupGhostMergeCard } from "./GroupGhostMergeCard";
import {
  FriendRequestCard,
  GroupInviteCard,
  ExpenseAddedCard,
  GenericNotificationCard,
} from "./NotificationCards";
import { Icon } from "@/components/ui/icon";
import { RefreshCwIcon, TickDouble02Icon, BellIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";

export interface NotificationFeedProps {
  initialNotifications?: PersonalNotification[];
  onApprove?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
}

export function NotificationFeed({
  initialNotifications,
  onApprove,
  onReject,
}: NotificationFeedProps) {
  const [notifications, setNotifications] = useState<PersonalNotification[]>(
    initialNotifications || []
  );
  const [loading, setLoading] = useState<boolean>(!initialNotifications);
  const [filter, setFilter] = useState<"ALL" | "UNREAD" | "REQUESTS" | "ACTIVITY">("ALL");
  const [isPending, startTransition] = useTransition();

  const fetchNotifications = () => {
    setLoading(true);
    startTransition(async () => {
      try {
        const notifs = await getNotificationsAction();
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

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsReadAction();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("Marked all notifications as read");
    } catch (err: any) {
      toast.error(err?.message || "Failed to mark all as read");
    }
  };

  const handleCardUpdate = (updatedNotif: PersonalNotification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === updatedNotif.id ? updatedNotif : n))
    );
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "UNREAD") return !notif.isRead;
    if (filter === "REQUESTS") {
      return (
        notif.type === "FRIEND_REQ" ||
        notif.type === "GROUP_INVITE" ||
        notif.type === "GROUP_GHOST_MERGE_REQUEST"
      );
    }
    if (filter === "ACTIVITY") {
      return (
        notif.type === "EXPENSE_ADDED" ||
        notif.type === "GHOST_CLAIMED" ||
        notif.type === "CONTACT_MERGED" ||
        notif.type === "GENERAL"
      );
    }
    return true;
  });

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon icon={BellIcon} className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">
            Notifications Feed
          </h2>
          {unreadCount > 0 && (
            <Badge variant="default" className="rounded-full bg-primary text-primary-foreground text-xs px-2">
              {unreadCount} new
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Icon icon={TickDouble02Icon} className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchNotifications}
            disabled={loading || isPending}
            className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Icon icon={RefreshCwIcon}
              className={`h-3.5 w-3.5 ${
                loading || isPending ? "animate-spin" : ""
              }`}
            />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 border-b pb-2">
        {(["ALL", "UNREAD", "REQUESTS", "ACTIVITY"] as const).map((tab) => (
          <Button
            key={tab}
            variant={filter === tab ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter(tab)}
            className="h-7 text-xs font-medium px-3 capitalize"
          >
            {tab === "ALL" ? "All" : tab === "UNREAD" ? `Unread (${unreadCount})` : tab === "REQUESTS" ? "Requests" : "Activity"}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2 border rounded-lg bg-card">
          <Spinner className="h-6 w-6 text-primary" />
          <span className="text-sm">Loading notifications...</span>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center border rounded-lg bg-card/50">
          <Icon icon={BellIcon} className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <h3 className="text-sm font-medium text-foreground">
            No notifications found
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            {filter === "UNREAD"
              ? "You're all caught up! No unread notifications."
              : "When you receive friend requests, group invites, or shared expense alerts, they will appear here."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredNotifications.map((notif) => {
            if (notif.type === "GROUP_GHOST_MERGE_REQUEST" && notif.data?.targetUser) {
              return (
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
                  onApprove={(id) => {
                    handleCardUpdate({
                      ...notif,
                      isRead: true,
                      data: { ...notif.data, status: "APPROVED" },
                    });
                    onApprove?.(id);
                  }}
                  onReject={(id) => {
                    handleCardUpdate({
                      ...notif,
                      isRead: true,
                      data: { ...notif.data, status: "REJECTED" },
                    });
                    onReject?.(id);
                  }}
                />
              );
            }

            if (notif.type === "FRIEND_REQ") {
              return (
                <FriendRequestCard
                  key={notif.id}
                  notification={notif}
                  onUpdate={handleCardUpdate}
                />
              );
            }

            if (notif.type === "GROUP_INVITE") {
              return (
                <GroupInviteCard
                  key={notif.id}
                  notification={notif}
                  onUpdate={handleCardUpdate}
                />
              );
            }

            if (notif.type === "EXPENSE_ADDED") {
              return (
                <ExpenseAddedCard
                  key={notif.id}
                  notification={notif}
                  onUpdate={handleCardUpdate}
                />
              );
            }

            return (
              <GenericNotificationCard
                key={notif.id}
                notification={notif}
                onUpdate={handleCardUpdate}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

