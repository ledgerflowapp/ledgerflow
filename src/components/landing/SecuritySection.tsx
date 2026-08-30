import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from "@/components/ui/icon";
import { UserCheck02Icon, ShieldCheckIcon, EyeOffIcon, LockIcon } from "@hugeicons/core-free-icons";
import Link from 'next/link';

interface SecuritySectionProps {
  user?: {
    id: string;
    name?: string | null;
  } | null;
}

export function SecuritySection({ user }: SecuritySectionProps) {
  return (
    <section id="security" className="py-20 lg:py-28 bg-background border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl space-y-20 @container">

        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <Badge variant="outline" className="px-3 py-1 font-semibold uppercase tracking-wider text-xs">
            Privacy & Identity Controls
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Strict Multi-Mode Isolation and Discoverability Safety
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Your data is isolated with clear permissions. Control how other profiles locate your record, authenticate securely with OAuth integrations, and manage your financial records under strict privacy boundaries.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 @md:grid-cols-2 gap-8 text-left">

          <div className="flex gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0 h-12 w-12 flex items-center justify-center">
              <Icon icon={EyeOffIcon} className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-foreground">Discoverability Settings</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Control whether other users can discover your account via registered phone number lookups or your custom `@username` handle. Toggle these permissions on or off at any time.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0 h-12 w-12 flex items-center justify-center">
              <Icon icon={LockIcon} className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-foreground">Strict Mode Boundaries</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Data in Personal Mode is mathematically and structurally isolated from your Business Mode ledgers. Keep personal budgets clean and business tax books compliant.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0 h-12 w-12 flex items-center justify-center">
              <Icon icon={UserCheck02Icon} className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-foreground">Multi-Auth Integration</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Log in and verify identity safely using OAuth providers, secure phone OTPs, or verified email sessions. No complex client passwords required.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0 h-12 w-12 flex items-center justify-center">
              <Icon icon={ShieldCheckIcon} className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-foreground">High-Integrity Reconciliations</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ghost Member claiming and historical social ledger merging require verified identity states. This deterministic match policy blocks unauthorized ledger claims completely.
              </p>
            </div>
          </div>

        </div>

        {/* Call to Action Module */}
        <Card className="p-8 sm:p-12 border border-border bg-muted/30 max-w-4xl mx-auto text-center space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_200px,#3b82f610,transparent)] pointer-events-none" />

          <div className="space-y-3 relative">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Ready to Clean Up Your Ledger Flow?
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
              Get started logging transactions, managing group splits, and organizing business receivables in one single dashboard.
            </p>
          </div>

          <div className="pt-2 relative">
            <Link href={user ? "/dashboard" : "/login"}>
              <Button size="lg" className="h-12 px-8 text-base font-semibold min-w-[220px]">
                {user ? "Open Dashboard" : "Access Workspace"}
              </Button>
            </Link>
          </div>
        </Card>

      </div>
    </section>
  );
}
