import Link from 'next/link'
import { Icon } from "@/components/ui/icon";
import { FileQuestionMarkIcon } from "@hugeicons/core-free-icons";

export default function NotFound() {
    return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
            <div className="rounded-full bg-muted p-4 text-muted-foreground mb-4">
                <Icon icon={FileQuestionMarkIcon} className="h-10 w-10" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">404 - Page Not Found</h1>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
                The page or resource you are looking for doesn't exist or has been moved.
            </p>
            <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 shadow transition-colors"
            >
                Return to Dashboard
            </Link>
        </div>
    )
}
