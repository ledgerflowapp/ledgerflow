'use client'

import { useEffect } from 'react'
import { Icon } from "@/components/ui/icon";
import { RefreshCwIcon, Alert01Icon } from "@hugeicons/core-free-icons";
import { Button } from '@/components/ui/button'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Unhandled route error:', error)
    }, [error])

    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
            <div className="rounded-full bg-destructive/10 p-4 text-destructive mb-4">
                <Icon icon={Alert01Icon} className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold tracking-tight mb-2">Something went wrong!</h2>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
                {error.message || 'An unexpected error occurred while loading this page.'}
            </p>
            <Button onClick={() => reset()} className="gap-2">
                <Icon icon={RefreshCwIcon} className="h-4 w-4" />
                Try again
            </Button>
        </div>
    )
}
