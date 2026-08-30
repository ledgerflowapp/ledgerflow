'use client'

import { useAppStore } from '@/store/useAppStore'
import { ProfileSection } from './sections/ProfileSection'
import { BusinessSection } from './sections/BusinessSection'
import { SecuritySection } from './sections/SecuritySection'
import { AppearanceSection } from './sections/AppearanceSection'

export function SettingsContent() {
    const { mode } = useAppStore()

    return (
        <div className="space-y-6 md:space-y-8 max-w-4xl mx-auto w-full pb-16">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-1">
                    Manage your preferences for {mode === 'business' ? 'Business' : 'Personal'} mode.
                </p>
            </div>

            <div className="flex flex-col space-y-8">
                <ProfileSection />
                <BusinessSection />
                <SecuritySection />
                <AppearanceSection />
            </div>
        </div>
    )
}
