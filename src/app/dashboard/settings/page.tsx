import type { Metadata } from 'next'
import { SettingsContent } from '@/components/settings/SettingsContent'

export const metadata: Metadata = {
    title: 'Settings',
    description: 'Manage account settings and appearance preferences',
}

export default function SettingsPage() {
    return <SettingsContent />
}
