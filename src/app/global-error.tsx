'use client'

import { Icon } from "@/components/ui/icon";
import { RefreshCwIcon, Alert01Icon } from "@hugeicons/core-free-icons";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <html lang="en">
            <body className="flex min-h-screen items-center justify-center bg-background font-sans p-6">
                <div className="flex max-w-md w-full flex-col items-center justify-center text-center p-8 border rounded-lg shadow-sm">
                    <div className="rounded-full bg-destructive/10 p-4 text-destructive mb-4">
                        <Icon icon={Alert01Icon} className="h-8 w-8" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight mb-2">Application Error</h1>
                    <p className="text-sm text-muted-foreground mb-6">
                        {error.message || 'A critical error occurred. Please refresh the page.'}
                    </p>
                    <button
                        onClick={() => reset()}
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 shadow transition-colors"
                    >
                        <Icon icon={RefreshCwIcon} className="h-4 w-4" />
                        Reload Application
                    </button>
                </div>
            </body>
        </html>
    )
}
