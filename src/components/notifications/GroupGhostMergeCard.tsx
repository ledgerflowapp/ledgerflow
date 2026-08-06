"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Check, X, Users, UserCheck, UserX, Mail, Phone } from "lucide-react";
import { toast } from "@/components/ui/toast";
import {
  approveGroupGhostMerge,
  rejectGroupGhostMerge,
} from "@/lib/actions/groups";

export interface GroupGhostMergeCardProps {
  request: {
    id: string; // notification ID / requestId
    groupId: string;
    groupName: string;
    ghostMemberId: string;
    ghostName: string;
    targetUser: {
      id: string;
      name: string;
      email?: string | null;
      phone?: string | null;
      avatarUrl?: string | null;
    };
    status: "PENDING" | "APPROVED" | "REJECTED";
    createdAt?: string;
  };
  onApprove?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
}

export function GroupGhostMergeCard({
  request,
  onApprove,
  onReject,
}: GroupGhostMergeCardProps) {
  const [status, setStatus] = useState<"PENDING" | "APPROVED" | "REJECTED">(
    request.status
  );
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  const handleApprove = async () => {
    if (loading || status !== "PENDING") return;
    const previousStatus = status;
    setStatus("APPROVED");
    setLoading("approve");
    try {
      await approveGroupGhostMerge(request.id);
      toast.success(`Approved merge request for ${request.targetUser.name}`);
      onApprove?.(request.id);
    } catch (err: any) {
      setStatus(previousStatus);
      toast.error(err?.message || "Failed to approve merge request");
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async () => {
    if (loading || status !== "PENDING") return;
    const previousStatus = status;
    setStatus("REJECTED");
    setLoading("reject");
    try {
      await rejectGroupGhostMerge(request.id);
      toast.success(`Rejected merge request for ${request.targetUser.name}`);
      onReject?.(request.id);
    } catch (err: any) {
      setStatus(previousStatus);
      toast.error(err?.message || "Failed to reject merge request");
    } finally {
      setLoading(null);
    }
  };

  const initials = request.targetUser.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <Card className="w-full border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-semibold">
            {request.groupName}
          </CardTitle>
        </div>
        <Badge variant="secondary" className="text-xs font-normal">
          Ghost: {request.ghostName}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border">
            <AvatarImage
              src={request.targetUser.avatarUrl || ""}
              alt={request.targetUser.name}
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium truncate">
              {request.targetUser.name}
            </span>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {request.targetUser.email && (
                <span className="flex items-center gap-1 truncate">
                  <Mail className="h-3 w-3" />
                  {request.targetUser.email}
                </span>
              )}
              {request.targetUser.phone && (
                <span className="flex items-center gap-1 truncate">
                  <Phone className="h-3 w-3" />
                  {request.targetUser.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-xs text-muted-foreground">
            {request.createdAt
              ? new Date(request.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Merge Request"}
          </span>

          <div className="flex items-center gap-2">
            {status === "PENDING" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReject}
                  disabled={!!loading}
                  aria-label="Reject merge request"
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
                  onClick={handleApprove}
                  disabled={!!loading}
                  aria-label="Approve merge request"
                  className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {loading === "approve" ? (
                    <Spinner className="h-3.5 w-3.5 mr-1" />
                  ) : (
                    <Check className="h-3.5 w-3.5 mr-1" />
                  )}
                  Approve
                </Button>
              </>
            )}

            {status === "APPROVED" && (
              <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20 px-2.5 py-1">
                <UserCheck className="h-3.5 w-3.5 mr-1" /> Approved
              </Badge>
            )}

            {status === "REJECTED" && (
              <Badge
                variant="destructive"
                className="px-2.5 py-1"
              >
                <UserX className="h-3.5 w-3.5 mr-1" /> Rejected
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
