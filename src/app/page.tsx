import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingHero } from '@/components/landing/LandingHero';
import { PersonalFeaturesSection } from '@/components/landing/PersonalFeaturesSection';
import { SocialLedgerSection } from '@/components/landing/SocialLedgerSection';
import { BusinessModeSection } from '@/components/landing/BusinessModeSection';
import { SecuritySection } from '@/components/landing/SecuritySection';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { PersonalDashboardPreview } from '@/components/landing/PersonalDashboardPreview';

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;

  // Rich JSON-LD data for search engine crawlers
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'LedgerFlow',
    operatingSystem: 'All',
    applicationCategory: 'FinanceApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
    },
    description: 'Direct and secure personal financial logs, group expense reconciliations with Ghost Members, and multi-business ledger tools.',
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* JSON-LD Script tag for Rich Structured Metadata */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <LandingHeader user={user} />

      <main className="flex-1">
        <LandingHero user={user} />

        {/* Interactive Preview Dashboard Island */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <PersonalDashboardPreview />
          </div>
        </section>

        <PersonalFeaturesSection />
        <SocialLedgerSection />
        <BusinessModeSection />
        <SecuritySection user={user} />
      </main>

      <LandingFooter />
    </div>
  );
}
