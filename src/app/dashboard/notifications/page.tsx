import { Metadata } from "next";
import { NotificationFeed } from "@/components/notifications/NotificationFeed";

export const metadata: Metadata = {
  title: "Notifications | LedgerFlow",
  description: "View and manage group ghost member merge requests and system notifications.",
};

export default function NotificationsPage() {
  return (
    <div className="container max-w-4xl py-6 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review pending group ghost member merge requests and approval actions.
        </p>
      </div>

      <NotificationFeed />
    </div>
  );
}
