'use client'

import { usePathname, useRouter } from 'next/navigation'
import { MobileSidebar } from '@/components/layout/MobileSidebar'
import { Button } from '@/components/ui/button'
import { Icon } from "@/components/ui/icon";
import { ArrowLeft05Icon } from "@hugeicons/core-free-icons";
import Image from 'next/image'

const ROOT_ROUTES = [
    '/dashboard',
    '/dashboard/settings',
    '/dashboard/analytics',
    '/dashboard/friends',
    '/dashboard/categories',
    '/dashboard/notifications'
]

export function MobileHeader() {
    const pathname = usePathname()
    const router = useRouter()

    const isRootRoute = ROOT_ROUTES.includes(pathname)

    return (
        <header className="flex min-h-14 h-[calc(3.5rem+env(safe-area-inset-top,0px))] items-center border-b px-4 pt-[env(safe-area-inset-top,0px)] pl-[calc(1rem+env(safe-area-inset-left,0px))] pr-[calc(1rem+env(safe-area-inset-right,0px))] bg-background md:hidden sticky top-0 z-50 gap-4">
            <div className="flex items-center">
                {isRootRoute ? (
                    <MobileSidebar />
                ) : (
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <Icon icon={ArrowLeft05Icon} className="h-5 w-5" />
                    </Button>
                )}
            </div>

            <div className="flex items-center gap-2">
                <div className="relative h-5 w-5">
                    <Image
                        src="/logo.png"
                        alt="LedgerFlow Logo"
                        fill
                        className="object-contain"
                    />
                </div>
                <span className="font-semibold text-md">LedgerFlow</span>
            </div>
        </header>
    )
}
