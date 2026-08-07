import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface LandingHeroProps {
  user?: {
    id: string;
    name?: string | null;
  } | null;
}

export function LandingHero({ user }: LandingHeroProps) {
  return (
    <section className="relative overflow-hidden py-20 lg:py-32 bg-background border-b border-border">
      {/* Decorative grid pattern background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl text-center">
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide uppercase">
            Product Update: Integrated Personal & Business Ledgers
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
            Clear, Factual Financial Records for Personal and Business Mode
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Log manual transactions with integrated mathematical calculators, split group expenses with Ghost Members, and run client CRM ledgers. Maintain strict data boundaries between workspaces.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href={user ? "/dashboard" : "/login"}>
              <Button size="lg" className="h-12 px-8 text-base font-medium min-w-[200px]">
                {user ? "Go to Dashboard" : "Access Workspace"}
              </Button>
            </Link>
            {!user && (
              <Link href="/login?mode=signup">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base font-medium min-w-[200px]">
                  Create Free Account
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
