"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { Sparkles, X } from "lucide-react";
import { Alert, AlertTitle, AlertDescription, AlertAction } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function UnverifiedEmailBanner() {
  const { data: session } = useSession();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (session?.user && !session.user.emailVerified) {
      const isDismissed = sessionStorage.getItem("ledgerflow_unverified_banner_dismissed");
      if (!isDismissed) {
        setDismissed(false);
      }
    } else {
      setDismissed(true);
    }
  }, [session]);

  if (dismissed || !session?.user || session.user.emailVerified) {
    return null;
  }

  const handleDismiss = () => {
    sessionStorage.setItem("ledgerflow_unverified_banner_dismissed", "true");
    setDismissed(true);
  };

  return (
    <div className="mb-4">
      <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200">
        <Sparkles className="size-4 text-amber-600 dark:text-amber-400" />
        <AlertTitle className="flex items-center gap-2 font-semibold">
          <span>Welcome to LedgerFlow!</span>
          <span className="inline-flex items-center rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
            Early Access
          </span>
        </AlertTitle>
        <AlertDescription className="text-amber-800/90 dark:text-amber-300/90">
          Email verification is currently optional while we upgrade our messaging systems. You have full, unrestricted access to your workspace!
        </AlertDescription>
        <AlertAction>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleDismiss}
            className="text-amber-800 hover:bg-amber-500/20 hover:text-amber-950 dark:text-amber-300 dark:hover:text-amber-100"
            aria-label="Dismiss banner"
          >
            <X className="size-4" />
          </Button>
        </AlertAction>
      </Alert>
    </div>
  );
}
