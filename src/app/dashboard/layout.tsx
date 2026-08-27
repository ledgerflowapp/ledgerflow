import { Suspense } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { MobileHeader } from '@/components/layout/MobileHeader'
import { UnverifiedEmailBanner } from '@/components/auth/UnverifiedEmailBanner'
import { RealtimeProvider } from '@/components/providers/RealtimeProvider'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { eq } from 'drizzle-orm'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const h = await headers();
    const session = await auth.api.getSession({ headers: h });
    
    if (session?.user) {
        const [profile] = await db.select().from(profiles).where(eq(profiles.id, session.user.id));
        if (profile && !profile.onboardingCompleted) {
            redirect('/onboarding');
        }
    }

    return (
        <div className="flex h-screen w-full flex-col bg-muted/40 md:flex-row overflow-hidden">
            <Suspense fallback={<aside className="hidden md:flex w-64 border-r bg-card shrink-0" />}>
                <Sidebar />
            </Suspense>
            <div className="flex flex-1 flex-col sm:gap-4 sm:py-4 sm:pl-14 md:pl-0 overflow-y-auto">
                <Suspense fallback={<header className="h-14 border-b bg-card md:hidden" />}>
                    <MobileHeader />
                </Suspense>
                <main className="flex-1 p-4 sm:px-6 sm:py-0 pb-20 md:pb-4">
                    <UnverifiedEmailBanner />
                    <RealtimeProvider>
                        {children}
                    </RealtimeProvider>
                </main>
            </div>
            <BottomNav />
        </div>
    )
}
