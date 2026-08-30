'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icon } from "@/components/ui/icon";
import { TrendingUpIcon, CreditCardIcon, TrendingDownIcon, LandmarkIcon, Wallet05Icon, ArrowDownLeft02Icon, ArrowUpRight03Icon } from "@hugeicons/core-free-icons";

export function PersonalDashboardPreview() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold tracking-tight text-foreground">
          Interactive Personal Mode Preview
        </h3>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Track accounts, visualize net balances, and filter ledger items with real-time updates directly on your dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Accounts Card */}
        <Card className="p-6 space-y-6 border border-border shadow-sm bg-card hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-foreground">Multi-Wallet05Icon Accounts</h4>
            <Badge variant="outline" className="text-[10px] font-semibold">Live</Badge>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-md">
                  <Icon icon={Wallet05Icon} className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-foreground">Cash Wallet05Icon</p>
                  <p className="text-[10px] text-muted-foreground">Primary Wallet05Icon</p>
                </div>
              </div>
              <p className="text-xs font-bold text-foreground">₹1,500.00</p>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 text-blue-600 rounded-md">
                  <Icon icon={LandmarkIcon} className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-foreground">Bank Account</p>
                  <p className="text-[10px] text-muted-foreground">Savings Account</p>
                </div>
              </div>
              <p className="text-xs font-bold text-foreground">₹45,000.00</p>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-500/10 text-rose-600 rounded-md">
                  <Icon icon={CreditCardIcon} className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-foreground">Credit Card</p>
                  <p className="text-[10px] text-muted-foreground">Monthly Bill</p>
                </div>
              </div>
              <p className="text-xs font-bold text-rose-600">-₹12,000.00</p>
            </div>
          </div>
        </Card>

        {/* Transactions Card */}
        <Card className="p-6 space-y-6 border border-border shadow-sm bg-card hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-foreground">Recent Expenses</h4>
            <Badge variant="outline" className="text-[10px] font-semibold">Filtered</Badge>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-rose-500/10 text-rose-600 rounded-md">
                  <Icon icon={ArrowDownLeft02Icon} className="h-3 w-3" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-foreground">Supermarket</p>
                  <p className="text-[10px] text-muted-foreground">Groceries</p>
                </div>
              </div>
              <p className="text-xs font-bold text-rose-600">-₹2,400.00</p>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-emerald-500/10 text-emerald-600 rounded-md">
                  <Icon icon={ArrowUpRight03Icon} className="h-3 w-3" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-foreground">Monthly Salary</p>
                  <p className="text-[10px] text-muted-foreground">Professional Income</p>
                </div>
              </div>
              <p className="text-xs font-bold text-emerald-600">+₹80,000.00</p>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-rose-500/10 text-rose-600 rounded-md">
                  <Icon icon={ArrowDownLeft02Icon} className="h-3 w-3" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-foreground">Internet Bill</p>
                  <p className="text-[10px] text-muted-foreground">Utility</p>
                </div>
              </div>
              <p className="text-xs font-bold text-rose-600">-₹999.00</p>
            </div>
          </div>
        </Card>

        {/* Aggregate Net Cash Flow Card */}
        <Card className="p-6 space-y-6 border border-border shadow-sm bg-card hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-foreground">Net Cash Flow</h4>
            <Badge variant="outline" className="text-[10px] font-semibold">Overview</Badge>
          </div>

          <div className="space-y-4">
            <div className="p-3 bg-muted/50 rounded-lg space-y-1 text-left">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground">Total Income</p>
              <div className="flex items-center gap-2 text-emerald-600">
                <Icon icon={TrendingUpIcon} className="h-4 w-4" />
                <span className="text-sm font-bold">₹80,000.00</span>
              </div>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg space-y-1 text-left">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground">Total Outflows</p>
              <div className="flex items-center gap-2 text-rose-600">
                <Icon icon={TrendingDownIcon} className="h-4 w-4" />
                <span className="text-sm font-bold">₹15,399.00</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-left">
              <div>
                <p className="text-xs font-semibold text-foreground">Net Position</p>
                <p className="text-[10px] text-muted-foreground">On-hand Liquidity</p>
              </div>
              <p className="text-sm font-extrabold text-primary">₹31,601.00</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
