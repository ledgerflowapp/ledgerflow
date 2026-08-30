'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'
import { Icon } from "@/components/ui/icon";
import { PieChartIcon, Briefcase09Icon, LayoutDashboardIcon, UsersIcon, Wallet05Icon, Settings05Icon } from "@hugeicons/core-free-icons";

import { MobileSidebar } from './MobileSidebar'
import { InteractiveBottomNav } from '@/components/ui/interactive-bottom-nav'

export function BottomNav() {
    const { mode } = useAppStore()

    const navItems = [
        {
            label: 'Home',
            href: '/dashboard',
            icon: LayoutDashboardIcon,
        },
        {
            label: 'Friends',
            href: '/dashboard/friends',
            icon: UsersIcon,
            showIn: 'personal' as const,
        },
        {
            label: 'Analytics',
            href: '/dashboard/analytics',
            icon: PieChartIcon,
            showIn: 'personal' as const,
        },
        // We might want to add more items for business mode or general items if needed
        // For now, sticking to what was there, but the component requires at least 2 items.
        // If mode filters result in < 2 items, the component handles it gracefully or shows default.
    ]

    // Filter items based on mode
    const filteredItems = navItems.filter(
        (item) => !item.showIn || item.showIn === mode
    )

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-[env(safe-area-inset-bottom,0px)] pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)] bg-card border-t border-border/40">
            <InteractiveBottomNav items={filteredItems} />
        </div>
    )
}
