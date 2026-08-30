import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Icon } from "@/components/ui/icon";
import { RefreshCwIcon, Calendar05Icon, ShieldCheckIcon, Target03Icon, Wallet05Icon, BellIcon } from "@hugeicons/core-free-icons";

export function PersonalFeaturesSection() {
  return (
    <section id="personal-features" className="py-20 lg:py-28 bg-muted/30 border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl space-y-16">

        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <Badge variant="outline" className="px-3 py-1 font-semibold uppercase tracking-wider text-xs">
            Personal Mode
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Complete Personal Cash Flow & Multi-Wallet05Icon Logs
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Maintain high-integrity manual ledger logs. Track liquid cash alongside bank holdings, set customizable categories with budget thresholds, and manage subscription commitments without data leakage.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

          {/* Left Column: Descriptions */}
          <div className="space-y-8 text-left">

            <div className="flex gap-4">
              <div className="mt-1 p-3 bg-primary/10 text-primary rounded-xl shrink-0 h-12 w-12 flex items-center justify-center">
                <Icon icon={Wallet05Icon} className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-foreground">Multi-Wallet05Icon Asset Tracking</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Log transactions across designated wallets (Cash Wallets, Bank Accounts, Cards, and Digital Wallets) to keep on-hand liquidity accurate.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="mt-1 p-3 bg-primary/10 text-primary rounded-xl shrink-0 h-12 w-12 flex items-center justify-center">
                <Icon icon={BellIcon} className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-foreground">Custom Category Budget Limits</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Set precise monthly limits per expense category. Visual progress indicators warn you as outflows approach your defined budget boundaries.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="mt-1 p-3 bg-primary/10 text-primary rounded-xl shrink-0 h-12 w-12 flex items-center justify-center">
                <Icon icon={Target03Icon} className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-foreground">Target03Icon-Based Savings Goals</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Log milestones with exact targets and future deadlines. The ledger recalculates progress based on cumulative contributions automatically.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="mt-1 p-3 bg-primary/10 text-primary rounded-xl shrink-0 h-12 w-12 flex items-center justify-center">
                <Icon icon={Calendar05Icon} className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-foreground">Automated Recurring Bill Schedules</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Track recurring bills, subscriptions, and utilities on Fixed-Interval or Calendar05Icon schedules. Failed auto-runs are safeguarded with auto-pause resilience.
                </p>
              </div>
            </div>

          </div>

          {/* Right Column: Visual Demos */}
          <div className="space-y-6">

            {/* Demo Card 1: Budget Limit Progress */}
            <Card className="p-5 border border-border bg-card space-y-4 shadow-sm text-left">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Monthly Budget</h4>
                  <p className="text-sm font-bold text-foreground">Dining & Restaurants</p>
                </div>
                <Badge variant="outline" className="text-rose-500 bg-rose-500/5 font-semibold text-[10px]">83% Utilized</Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-muted-foreground">Spent: ₹12,500.00</span>
                  <span className="text-foreground font-bold">Limit: ₹15,000.00</span>
                </div>
                <Progress value={83} className="h-2 bg-muted [&>div]:bg-rose-500" />
              </div>
            </Card>

            {/* Demo Card 2: Savings Goal Progress */}
            <Card className="p-5 border border-border bg-card space-y-4 shadow-sm text-left">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Financial Goal Progress</h4>
                  <p className="text-sm font-bold text-foreground">Emergency Fund</p>
                </div>
                <Badge variant="outline" className="text-emerald-500 bg-emerald-500/5 font-semibold text-[10px]">60% Achieved</Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-muted-foreground">Saved: ₹1,50,000.00</span>
                  <span className="text-foreground font-bold">Target03Icon: ₹2,50,000.00</span>
                </div>
                <Progress value={60} className="h-2 bg-muted [&>div]:bg-emerald-500" />
                <p className="text-[10px] text-muted-foreground text-right mt-1 font-semibold">
                  Deadline: December 31, 2026
                </p>
              </div>
            </Card>

            {/* Demo Card 3: Recurring Transaction Log */}
            <Card className="p-5 border border-border bg-card space-y-3 shadow-sm text-left">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Automated Schedules</h4>
                <Badge variant="outline" className="text-primary font-semibold text-[10px]">Auto-Generated</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-blue-500/10 text-blue-600 rounded-md">
                    <Icon icon={RefreshCwIcon} className="h-3.5 w-3.5 animate-spin-slow" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Cloud Storage Subscription</p>
                    <p className="text-[9px] text-muted-foreground">Fixed-Interval • Every 30 Days</p>
                  </div>
                </div>
                <p className="text-xs font-bold text-rose-600">-₹199.00</p>
              </div>
            </Card>

          </div>

        </div>

      </div>
    </section>
  );
}
