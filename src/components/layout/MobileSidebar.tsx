'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/useAppStore'
import { signOut } from '@/lib/auth-client'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Icon } from "@/components/ui/icon";
import { PieChartIcon, ListIcon, Briefcase09Icon, LayoutDashboardIcon, MenuIcon, Logout05Icon, UsersIcon, Wallet05Icon, BellIcon, Settings05Icon } from "@hugeicons/core-free-icons";
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/toast'

import { useProfile } from '@/hooks/use-profile'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function MobileSidebar() {
    const { mode, toggleMode } = useAppStore()
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [open, setOpen] = useState(false)
    const { profile } = useProfile()

    const handleLogout = async () => {
        try {
            await signOut()
            window.location.href = '/login'
        } catch {
            toast.error('Failed to sign out. Please try again.')
        }
    }

    const handleModeSwitch = () => {
        toggleMode()
        router.push('/dashboard')
        setOpen(false)
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
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={
                <Button variant="ghost" size="icon" className="md:hidden" />
            }>
                <Icon icon={MenuIcon} className="h-6 w-6" />
            </SheetTrigger>
            <SheetContent side="left" className="pt-safe pb-safe pl-safe">
                <SheetHeader className="text-left">
                    <SheetTitle>Menu</SheetTitle>
                    <div className="flex items-center gap-3 mt-4 mb-2">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || 'User'} />
                            <AvatarFallback>{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="font-semibold">{profile?.full_name || 'LedgerFlow'}</span>
                            <span className="text-xs text-muted-foreground">{mode === 'business' ? profile?.business_name || 'Business' : 'Personal Finance'}</span>
                        </div>
                    </div>
                </SheetHeader>
                <div className="flex flex-col gap-2 mt-4 px-6 pb-6 overflow-y-auto">
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
                            <Button
                                key={item.href}
                                variant={isActive ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start gap-2",
                                    isActive && "bg-secondary text-secondary-foreground"
                                )}
                                onClick={() => {
                                    router.push(item.href)
                                    setOpen(false)
                                }}
                            >
                                <Icon icon={NavIcon} className="h-4 w-4" />
                                <span>{item.label}</span>
                            </Button>
                        )
                    })}

                    <div className="my-2 border-t" />

                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-2"
                        onClick={handleModeSwitch}
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
                        className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={handleLogout}
                    >
                        <Icon icon={Logout05Icon} className="h-4 w-4" />
                        <span>Logout</span>
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}
