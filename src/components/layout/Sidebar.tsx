'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'
import { Icon } from "@/components/ui/icon";
import { PieChartIcon, Sun03Icon, ListIcon, Briefcase09Icon, LayoutDashboardIcon, MoonIcon, Logout05Icon, UsersIcon, Wallet05Icon, BellIcon, Settings05Icon } from "@hugeicons/core-free-icons";
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/toast'

import { useProfile } from '@/hooks/use-profile'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function Sidebar() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { mode, toggleMode } = useAppStore()
    const router = useRouter()
    const { profile } = useProfile()

    const handleLogout = async () => {
        try {
            await signOut()
            window.location.href = '/login'
        } catch {
            toast.error('Failed to sign out. Please try again.')
        }
    }

    const navItems = [
        {
            label: 'Dashboard',
            href: '/dashboard',
            icon: LayoutDashboardIcon,
        },
        {
            label: 'Friends',
            href: '/dashboard/friends',
            icon: UsersIcon,
            showIn: 'personal',
        },
        {
            label: 'Groups',
            href: '/dashboard/friends?tab=groups',
            icon: UsersIcon,
            showIn: 'personal',
        },
        {
            label: 'Analytics',
            href: '/dashboard/analytics',
            icon: PieChartIcon,
            showIn: 'personal',
        },
        {
            label: 'Manage Categories',
            href: '/dashboard/categories',
            icon: ListIcon,
            showIn: 'personal',
        },
        {
            label: 'Notifications',
            href: '/dashboard/notifications',
            icon: BellIcon,
            showIn: 'personal',
        },
        {
            label: 'Settings',
            href: '/dashboard/settings',
            icon: Settings05Icon,
        },
    ]

    return (
        <aside className="hidden h-dvh min-h-dvh w-64 flex-col border-r bg-sidebar text-sidebar-foreground md:flex pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] pl-[env(safe-area-inset-left,0px)] shrink-0">
            <div className="flex h-16 items-center border-b px-4 gap-3">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || 'User'} />
                    <AvatarFallback>{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-semibold truncate">{profile?.full_name || 'LedgerFlow'}</span>
                    <span className="text-xs text-muted-foreground truncate">{mode === 'business' ? profile?.business_name || 'Business' : 'Personal Finance'}</span>
                </div>
            </div>
            <div className="flex-1 overflow-auto py-4">
                <nav className="grid gap-1 px-2">
                    {navItems.map((item) => {
                        if (item.showIn && item.showIn !== mode) return null
                        const NavIcon = item.icon

                        let isActive = pathname === item.href

                        // Special handling for Friends vs Groups
                        if (item.href === '/dashboard/friends') {
                            isActive = pathname === '/dashboard/friends' && !searchParams.has('tab')
                        } else if (item.href === '/dashboard/friends?tab=groups') {
                            isActive = pathname === '/dashboard/friends' && searchParams.get('tab') === 'groups'
                        } else {
                            isActive = pathname === item.href
                        }

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                                    isActive
                                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                        : 'text-muted-foreground'
                                )}
                            >
                                <Icon icon={NavIcon} className="h-4 w-4" />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>
            </div>
            <div className="border-t p-4">
                <div className="flex flex-col gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2"
                        onClick={() => {
                            toggleMode()
                            router.push('/dashboard')
                        }}
                        title={mode === 'business' ? 'Switch to Personal' : 'Switch to Business'}
                    >
                        {mode === 'business' ? (
                            <>
                                <Icon icon={Wallet05Icon} className="h-4 w-4" />
                                <span>Switch to Personal</span>
                            </>
                        ) : (
                            <>
                                <Icon icon={Briefcase09Icon} className="h-4 w-4" />
                                <span>Switch to Business</span>
                            </>
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={handleLogout}
                        title="Logout"
                    >
                        <Icon icon={Logout05Icon} className="h-4 w-4" />
                        <span>Logout</span>
                    </Button>
                </div>
            </div>
        </aside>
    )
}
