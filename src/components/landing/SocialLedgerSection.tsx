import { SplitSimulator } from './SplitSimulator';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icon } from "@/components/ui/icon";
import { CheckmarkCircle04Icon, UsersIcon, SmartphoneIcon, UserMinus02Icon, LinkIcon, PlusIcon } from "@hugeicons/core-free-icons";

export function SocialLedgerSection() {
  return (
    <section id="social-ledger" className="py-20 lg:py-28 bg-background border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl space-y-16 @container">

        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <Badge variant="outline" className="px-3 py-1 font-semibold uppercase tracking-wider text-xs">
            Shared IOUs & Groups
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Social Ledgers, Ghost Members & Contact Merging
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Split costs, record interpersonal debts, and manage mutual balances cleanly. Invite unregistered participants as placeholder Ghost Members, and let LedgerFlow reconcile historical records automatically upon signup.
          </p>
        </div>

        {/* Feature grid with Split Simulator embedded */}
        <div className="grid grid-cols-1 @lg:grid-cols-12 gap-8 items-center">

          {/* Left: Explainer content */}
          <div className="@lg:col-span-6 space-y-8 text-left">

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-foreground">Fractional Split Calculations</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Divide transactions among multiple profiles by percentage, equal share, or exact custom amounts. Maintain full clarity over peer-to-peer statuses without external spreadsheets.
              </p>
            </div>

            <div className="space-y-6">

              {/* Feature Bullet 1 */}
              <div className="flex gap-4">
                <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg shrink-0 h-9 w-9 flex items-center justify-center font-bold text-sm">
                  ₹
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Factual Status Indicators</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                    View outstanding balances labeled with exact states: <span className="font-bold text-emerald-600">"You will get"</span>, <span className="font-bold text-rose-600">"You will give"</span>, or <span className="font-bold text-muted-foreground">"Settled up"</span>.
                  </p>
                </div>
              </div>

              {/* Feature Bullet 2 */}
              <div className="flex gap-4">
                <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0 h-9 w-9 flex items-center justify-center">
                  <Icon icon={UsersIcon} className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Ghost Member Participation</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                    Include unregistered individuals in group expense splittings using simple placeholder names. No email or password setup is forced on your friends to get started.
                  </p>
                </div>
              </div>

              {/* Feature Bullet 3 */}
              <div className="flex gap-4">
                <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0 h-9 w-9 flex items-center justify-center">
                  <Icon icon={LinkIcon} className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Automated Contact Merging</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                    When contacts register via verified phone search or an explicit invite link token, historical Ghost Member entries and outstanding balances link to their new profile automatically.
                  </p>
                </div>
              </div>

            </div>

            {/* Visual Mini Mock Card */}
            <Card className="p-4 border border-border bg-muted/30 text-left space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <span>Active 1:1 Social Ledger</span>
                <span>Mutual Sync</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-foreground">Siddharth Sharma</p>
                  <p className="text-[10px] text-muted-foreground">Verified Phone Match</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-extrabold text-emerald-600">+₹1,450.00</p>
                  <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-wide">You will get</p>
                </div>
              </div>
            </Card>

          </div>

          {/* Right: Split Simulator Embedding */}
          <div className="@lg:col-span-6 w-full">
            <SplitSimulator />
          </div>

        </div>

      </div>
    </section>
  );
}
