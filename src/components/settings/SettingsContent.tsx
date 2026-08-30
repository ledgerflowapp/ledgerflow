'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Icon } from "@/components/ui/icon"
import { UserIcon, BuildingIcon, Shield02Icon, Sun03Icon } from "@hugeicons/core-free-icons"
import { cn } from '@/lib/utils'

import { ProfileSection } from './sections/ProfileSection'
import { BusinessSection } from './sections/BusinessSection'
import { SecuritySection } from './sections/SecuritySection'
import { AppearanceSection } from './sections/AppearanceSection'

const SECTIONS = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'business', label: 'Business', icon: BuildingIcon },
    { id: 'security', label: 'Privacy & Security', icon: Shield02Icon },
    { id: 'appearance', label: 'Appearance', icon: Sun03Icon },
] as const

type SectionId = typeof SECTIONS[number]['id']

export function SettingsContent() {
    const { mode } = useAppStore()
    const [activeSection, setActiveSection] = useState<SectionId>('profile')

    return (
        <div className="space-y-6 md:space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-1">
                    Manage your preferences for {mode === 'business' ? 'Business' : 'Personal'} mode.
                </p>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Navigation: Horizontal scroll on mobile, Vertical sidebar on desktop */}
                <aside className="w-full md:w-64 shrink-0 -mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto no-scrollbar">
                    <nav className="flex md:flex-col gap-2 min-w-max md:min-w-0 pb-1 md:pb-0">
                        {SECTIONS.map((section) => {
                            const isActive = activeSection === section.id
                            return (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-2.5 rounded-full md:rounded-lg text-sm font-medium transition-colors min-h-11 md:min-h-0",
                                        isActive
                                            ? "bg-primary text-primary-foreground shadow-sm md:bg-secondary md:text-secondary-foreground"
                                            : "hover:bg-secondary/50 text-muted-foreground hover:text-foreground border border-transparent bg-secondary/20 md:bg-transparent"
                                    )}
                                >
                                    <Icon icon={section.icon} className={cn("h-4 w-4 shrink-0", isActive ? "opacity-100" : "opacity-70")} />
                                    <span>{section.label}</span>
                                </button>
                            )
                        })}
                    </nav>
                </aside>

                {/* Main Content Area */}
                <div className="flex-1 min-w-0">
                    <div className={cn("transition-opacity duration-200", activeSection === 'profile' ? "block" : "hidden")}>
                        <ProfileSection />
                    </div>
                    <div className={cn("transition-opacity duration-200", activeSection === 'business' ? "block" : "hidden")}>
                        <BusinessSection />
                    </div>
                    <div className={cn("transition-opacity duration-200", activeSection === 'security' ? "block" : "hidden")}>
                        <SecuritySection />
                    </div>
                    <div className={cn("transition-opacity duration-200", activeSection === 'appearance' ? "block" : "hidden")}>
                        <AppearanceSection />
                    </div>
                </div>
            </div>
        </div>
    )
}
