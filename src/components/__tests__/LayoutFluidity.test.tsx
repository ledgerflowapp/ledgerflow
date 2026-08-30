import { describe, it, expect, vi } from 'vitest'
import { viewport } from '@/app/layout'
import { renderToString } from 'react-dom/server'
import React from 'react'

// Layout & Shell components
import { MobileHeader } from '@/components/layout/MobileHeader'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { BusinessSummary } from '@/components/ledger/BusinessSummary'
import { PersonalFeaturesSection } from '@/components/landing/PersonalFeaturesSection'
import { BusinessModeSection } from '@/components/landing/BusinessModeSection'
import { SecuritySection } from '@/components/landing/SecuritySection'

// Mock next/navigation
vi.mock('next/navigation', () => ({
    usePathname: () => '/dashboard',
    useSearchParams: () => new URLSearchParams(),
    useRouter: () => ({
        push: vi.fn(),
        back: vi.fn(),
    }),
}))

// Mock app store
vi.mock('@/store/useAppStore', () => ({
    useAppStore: () => ({
        mode: 'personal',
        toggleMode: vi.fn(),
        currentBusinessId: null,
        setCurrentBusinessId: vi.fn(),
    }),
}))

// Mock hooks
vi.mock('@/hooks/use-profile', () => ({
    useProfile: () => ({
        profile: {
            full_name: 'Test User',
            avatar_url: '',
            business_name: 'Test Business',
            friend_invite_token: 'tok-123',
        },
    }),
}))

vi.mock('@/hooks/business/useBusinessContacts', () => ({
    useBusinessContacts: () => ({
        data: [
            { id: '1', name: 'Alice', net_balance: 50000 },
            { id: '2', name: 'Bob', net_balance: -25000 },
        ],
        isLoading: false,
    }),
}))

vi.mock('@/lib/auth-client', () => ({
    signOut: vi.fn(),
}))

describe('Layout Fluidity & Safe Zones (Issue #34)', () => {
    describe('1. Viewport & Safe-Area Configuration', () => {
        it('exports viewport metadata with viewportFit=cover and interactiveWidget=resizes-content', () => {
            expect(viewport).toBeDefined()
            expect(viewport.viewportFit).toBe('cover')
            expect(viewport.interactiveWidget).toBe('resizes-content')
        })
    })

    describe('2. Application Shell Safe-Area Insets', () => {
        it('MobileHeader includes safe-area-inset-top support', () => {
            const html = renderToString(<MobileHeader />)
            expect(
                html.includes('pt-[env(safe-area-inset-top,0px)]') ||
                html.includes('pt-safe') ||
                html.includes('env(safe-area-inset-top')
            ).toBe(true)
        })

        it('BottomNav includes safe-area-inset-bottom support', () => {
            const html = renderToString(<BottomNav />)
            expect(
                html.includes('pb-[env(safe-area-inset-bottom,0px)]') ||
                html.includes('pb-safe') ||
                html.includes('env(safe-area-inset-bottom')
            ).toBe(true)
        })

        it('Sidebar uses dynamic viewport height and safe padding', () => {
            const html = renderToString(<Sidebar />)
            expect(
                html.includes('h-dvh') ||
                html.includes('h-svh') ||
                html.includes('min-h-dvh')
            ).toBe(true)
        })
    })

    describe('3. Major Layout Wrappers & Container Queries', () => {
        it('BusinessSummary uses container queries for grid columns', () => {
            const html = renderToString(<BusinessSummary />)
            expect(
                html.includes('@container') ||
                html.includes('@sm:grid-cols-2') ||
                html.includes('@md:grid-cols-2')
            ).toBe(true)
        })

        it('PersonalFeaturesSection wraps in container context', () => {
            const html = renderToString(<PersonalFeaturesSection />)
            expect(
                html.includes('@container') ||
                html.includes('@md:grid-cols-2') ||
                html.includes('@lg:grid-cols-2')
            ).toBe(true)
        })

        it('BusinessModeSection wraps in container context and uses container queries', () => {
            const html = renderToString(<BusinessModeSection />)
            expect(
                html.includes('@container') ||
                html.includes('@md:grid-cols-3') ||
                html.includes('@sm:grid-cols-2')
            ).toBe(true)
        })

        it('SecuritySection wraps in container context', () => {
            const html = renderToString(<SecuritySection />)
            expect(
                html.includes('@container') ||
                html.includes('@md:grid-cols-2')
            ).toBe(true)
        })
    })
})
