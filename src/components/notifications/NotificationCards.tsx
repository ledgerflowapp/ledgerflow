"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Check,
  X,
  UserPlus,
  Users,
  Receipt,
  Bell,
  Mail,
  CheckCheck,
  UserCheck,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import {
  PersonalNotification,
  markNotificationAsReadAction,
  acceptFriendRequestNotificationAction,
  rejectFriendRequestNotificationAction,
  acceptGroupInviteNotificationAction,
  rejectGroupInviteNotificationAction,
} from "@/lib/actions/notifications";

interface NotificationCardBaseProps {
  notification: PersonalNotification;
  onUpdate?: (updated: PersonalNotification) => void;
}

export function FriendRequestCard({ notification, onUpdate }: NotificationCardBaseProps) {
  const [status, setStatus] = useState<"PENDING" | "ACCEPTED" | "REJECTED">(
    notification.data?.status || "PENDING"
  );
  const [isRead, setIsRead] = useState<boolean>(notification.isRead);
  const [loading, setLoading] = useState<"accept" | "reject" | "markRead" | null>(null);

  const initiator = notification.data?.initiator;
  const initiatorName = initiator?.name || notification.title || "Friend Request";
  const initials = initiatorName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const handleAccept = async () => {
    if (loading || status !== "PENDING") return;
    setLoading("accept");
    try {
      await acceptFriendRequestNotificationAction(notification.id);
      setStatus("ACCEPTED");
      setIsRead(true);
      toast.success(`Accepted friend request from ${initiatorName}`);
      onUpdate?.({
        ...notification,
        isRead: true,
        data: { ...notification.data, status: "ACCEPTED" },
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to accept friend request");
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async () => {
    if (loading || status !== "PENDING") return;
    setLoading("reject");
    try {
      await rejectFriendRequestNotificationAction(notification.id);
      setStatus("REJECTED");
      setIsRead(true);
      toast.success(`Rejected friend request from ${initiatorName}`);
      onUpdate?.({
        ...notification,
        isRead: true,
        data: { ...notification.data, status: "REJECTED" },
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to reject friend request");
    } finally {
      setLoading(null);
    }
  };

  const handleMarkRead = async () => {
    if (loading || isRead) return;
    setLoading("markRead");
    try {
      await markNotificationAsReadAction(notification.id);
      setIsRead(true);
      toast.success("Marked notification as read");
      onUpdate?.({ ...notification, isRead: true });
    } catch (err: any) {
      toast.error(err?.message || "Failed to mark as read");
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card className={`w-full border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md ${!isRead ? "border-l-4 border-l-blue-500 bg-blue-50/20 dark:bg-blue-950/10" : ""}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-blue-500" />
          <CardTitle className="text-sm font-semibold">Friend Request</CardTitle>
        </div>
        {!isRead && (
          <Badge variant="outline" className="text-xs border-blue-300 text-blue-600 dark:text-blue-400">
            New
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border">
            <AvatarImage src={initiator?.avatarUrl || ""} alt={initiatorName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium truncate">{initiatorName}</span>
            {initiator?.email && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                <Mail className="h-3 w-3" />
                {initiator.email}
              </span>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">{notification.message}</p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-xs text-muted-foreground">
            {notification.createdAt
              ? new Date(notification.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Recent"}
          </span>

          <div className="flex items-center gap-2">
            {!isRead && status === "PENDING" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkRead}
                disabled={!!loading}
                title="Mark as read"
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                {loading === "markRead" ? (
                  <Spinner className="h-3.5 w-3.5" />
                ) : (
                  <CheckCheck className="h-3.5 w-3.5 mr-1" />
                )}
                Mark read
              </Button>
            )}

            {status === "PENDING" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReject}
                  disabled={!!loading}
                  aria-label="Reject friend request"
                  className="h-8 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  {loading === "reject" ? (
                    <Spinner className="h-3.5 w-3.5 mr-1" />
                  ) : (
                    <X className="h-3.5 w-3.5 mr-1" />
                  )}
                  Reject
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleAccept}
                  disabled={!!loading}
                  aria-label="Accept friend request"
                  className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {loading === "accept" ? (
                    <Spinner className="h-3.5 w-3.5 mr-1" />
                  ) : (
                    <Check className="h-3.5 w-3.5 mr-1" />
                  )}
                  Accept
                </Button>
              </>
            )}

            {status === "ACCEPTED" && (
              <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20 px-2.5 py-1">
                <UserCheck className="h-3.5 w-3.5 mr-1" /> Accepted
              </Badge>
            )}

            {status === "REJECTED" && (
              <Badge variant="destructive" className="px-2.5 py-1">
                <UserX className="h-3.5 w-3.5 mr-1" /> Rejected
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function GroupInviteCard({ notification, onUpdate }: NotificationCardBaseProps) {
  const [status, setStatus] = useState<"PENDING" | "ACCEPTED" | "REJECTED">(
    notification.data?.status || "PENDING"
  );
  const [isRead, setIsRead] = useState<boolean>(notification.isRead);
  const [loading, setLoading] = useState<"accept" | "reject" | "markRead" | null>(null);

  const groupName = notification.data?.groupName || "Group";
  const inviterName = notification.data?.inviter?.name;

  const handleAccept = async () => {
    if (loading || status !== "PENDING") return;
    setLoading("accept");
    try {
      await acceptGroupInviteNotificationAction(notification.id);
      setStatus("ACCEPTED");
      setIsRead(true);
      toast.success(`Joined group ${groupName}`);
      onUpdate?.({
        ...notification,
        isRead: true,
        data: { ...notification.data, status: "ACCEPTED" },
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to join group");
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async () => {
    if (loading || status !== "PENDING") return;
    setLoading("reject");
    try {
      await rejectGroupInviteNotificationAction(notification.id);
      setStatus("REJECTED");
      setIsRead(true);
      toast.success(`Declined group invite for ${groupName}`);
      onUpdate?.({
        ...notification,
        isRead: true,
        data: { ...notification.data, status: "REJECTED" },
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to decline invite");
    } finally {
      setLoading(null);
    }
  };

  const handleMarkRead = async () => {
    if (loading || isRead) return;
    setLoading("markRead");
    try {
      await markNotificationAsReadAction(notification.id);
      setIsRead(true);
      toast.success("Marked notification as read");
      onUpdate?.({ ...notification, isRead: true });
    } catch (err: any) {
      toast.error(err?.message || "Failed to mark as read");
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card className={`w-full border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md ${!isRead ? "border-l-4 border-l-purple-500 bg-purple-50/20 dark:bg-purple-950/10" : ""}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-purple-500" />
          <CardTitle className="text-sm font-semibold">{groupName}</CardTitle>
        </div>
        <Badge variant="secondary" className="text-xs font-normal">
          Group Invitation
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        <div className="flex flex-col gap-1">
          {inviterName && (
            <span className="text-xs font-medium text-muted-foreground">
              Invited by: {inviterName}
            </span>
          )}
          <p className="text-sm text-foreground">{notification.message || `You have been invited to join ${groupName}.`}</p>
        </div>

        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-xs text-muted-foreground">
            {notification.createdAt
              ? new Date(notification.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Recent"}
          </span>

          <div className="flex items-center gap-2">
            {!isRead && status === "PENDING" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkRead}
                disabled={!!loading}
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                {loading === "markRead" ? (
                  <Spinner className="h-3.5 w-3.5" />
                ) : (
                  <CheckCheck className="h-3.5 w-3.5 mr-1" />
                )}
                Mark read
              </Button>
            )}

            {status === "PENDING" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReject}
                  disabled={!!loading}
                  aria-label="Decline group invitation"
                  className="h-8 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  {loading === "reject" ? (
                    <Spinner className="h-3.5 w-3.5 mr-1" />
                  ) : (
                    <X className="h-3.5 w-3.5 mr-1" />
                  )}
                  Decline
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleAccept}
                  disabled={!!loading}
                  aria-label="Accept group invitation"
                  className="h-8 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {loading === "accept" ? (
                    <Spinner className="h-3.5 w-3.5 mr-1" />
                  ) : (
                    <Check className="h-3.5 w-3.5 mr-1" />
                  )}
                  Join Group
                </Button>
              </>
            )}

            {status === "ACCEPTED" && (
              <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20 px-2.5 py-1">
                <UserCheck className="h-3.5 w-3.5 mr-1" /> Joined
              </Badge>
            )}

            {status === "REJECTED" && (
              <Badge variant="destructive" className="px-2.5 py-1">
                <UserX className="h-3.5 w-3.5 mr-1" /> Declined
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ExpenseAddedCard({ notification, onUpdate }: NotificationCardBaseProps) {
  const [isRead, setIsRead] = useState<boolean>(notification.isRead);
  const [loading, setLoading] = useState<boolean>(false);

  const amountVal = notification.data?.amount;
  let formattedAmount = "";
  if (typeof amountVal === "number") {
    // If integer >= 100, assume paise, otherwise rupees
    const rupees = amountVal >= 100 && Number.isInteger(amountVal) ? amountVal / 100 : amountVal;
    formattedAmount = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(rupees);
  }

  const groupName = notification.data?.groupName;

  const handleMarkRead = async () => {
    if (loading || isRead) return;
    setLoading(true);
    try {
      await markNotificationAsReadAction(notification.id);
      setIsRead(true);
      toast.success("Marked notification as read");
      onUpdate?.({ ...notification, isRead: true });
    } catch (err: any) {
      toast.error(err?.message || "Failed to mark as read");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={`w-full border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md ${!isRead ? "border-l-4 border-l-amber-500 bg-amber-50/20 dark:bg-amber-950/10" : ""}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-amber-500" />
          <CardTitle className="text-sm font-semibold">
            {notification.title || "Expense Added"}
          </CardTitle>
        </div>
        {groupName && (
          <Badge variant="secondary" className="text-xs font-normal">
            {groupName}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-foreground">{notification.message}</p>
          {formattedAmount && (
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
              {formattedAmount}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-xs text-muted-foreground">
            {notification.createdAt
              ? new Date(notification.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Recent"}
          </span>

          <div>
            {!isRead ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkRead}
                disabled={loading}
                className="h-8 gap-1 text-xs"
              >
                {loading ? (
                  <Spinner className="h-3.5 w-3.5" />
                ) : (
                  <CheckCheck className="h-3.5 w-3.5" />
                )}
                Mark as read
              </Button>
            ) : (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Read
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function GenericNotificationCard({ notification, onUpdate }: NotificationCardBaseProps) {
  const [isRead, setIsRead] = useState<boolean>(notification.isRead);
  const [loading, setLoading] = useState<boolean>(false);

  const handleMarkRead = async () => {
    if (loading || isRead) return;
    setLoading(true);
    try {
      await markNotificationAsReadAction(notification.id);
      setIsRead(true);
      toast.success("Marked notification as read");
      onUpdate?.({ ...notification, isRead: true });
    } catch (err: any) {
      toast.error(err?.message || "Failed to mark as read");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={`w-full border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md ${!isRead ? "border-l-4 border-l-primary bg-primary/5" : ""}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm font-semibold">
            {notification.title || "Notification"}
          </CardTitle>
        </div>
        {!isRead && (
          <Badge variant="outline" className="text-xs border-primary/40 text-primary">
            New
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        <p className="text-sm text-foreground">{notification.message}</p>

        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-xs text-muted-foreground">
            {notification.createdAt
              ? new Date(notification.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Recent"}
          </span>

          <div>
            {!isRead ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkRead}
                disabled={loading}
                className="h-8 gap-1 text-xs"
              >
                {loading ? (
                  <Spinner className="h-3.5 w-3.5" />
                ) : (
                  <CheckCheck className="h-3.5 w-3.5" />
                )}
                Mark as read
              </Button>
            ) : (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Read
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
