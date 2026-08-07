import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Layers, ArrowRight, ClipboardList, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export function BusinessModeSection() {
  return (
    <section id="business-mode" className="py-20 lg:py-28 bg-muted/20 border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl space-y-16">

        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <Badge variant="outline" className="px-3 py-1 font-semibold uppercase tracking-wider text-xs text-blue-600 bg-blue-500/5 border-blue-500/10">
            Business Mode
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Multi-Business Entity CRM & Ledger Systems
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Switch from Personal Mode to a dedicated Blue-themed Business layout. Run distinct receivables and payables ledgers for each client, supplier, or business entity under your profile.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">

          <Card className="p-6 space-y-4 border border-border bg-card shadow-sm">
            <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-lg w-10 h-10 flex items-center justify-center">
              <Briefcase className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-foreground">Multi-Entity Switching</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Create and manage multiple isolated business entities. Each operates with its own custom accounts, business settings, and independent reports.
            </p>
          </Card>

          <Card className="p-6 space-y-4 border border-border bg-card shadow-sm">
            <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-lg w-10 h-10 flex items-center justify-center">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-foreground">Customer & Supplier CRM</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Classify your local contacts as Customers or Vendors. Keep structured profiles containing phone entries, custom tax records, and purchase history.
            </p>
          </Card>

          <Card className="p-6 space-y-4 border border-border bg-card shadow-sm">
            <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-lg w-10 h-10 flex items-center justify-center">
              <ClipboardList className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-foreground">Receivables & Payables</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Track net payables and receivables across contacts. Automate outstanding invoice reminders and log settlement confirmations in Rupees.
            </p>
          </Card>

        </div>

        {/* Business Mode UI Mock Preview */}
        <Card className="p-6 border border-border bg-card shadow-md max-w-3xl mx-auto text-left space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Active Workspace</span>
              <h4 className="text-lg font-bold text-foreground">Raj & Co. Trading (Business Mode)</h4>
            </div>
            <Badge className="text-xs bg-blue-600 hover:bg-blue-600 text-white font-medium self-start sm:self-auto">
              Professional Ledger Active
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10 space-y-1">
              <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Net Receivables (To Receive)</span>
              <p className="text-xl font-black text-emerald-600">₹1,43,900.00</p>
              <p className="text-[10px] text-muted-foreground">From 14 active business customers</p>
            </div>

            <div className="p-4 rounded-lg bg-rose-500/5 border border-rose-500/10 space-y-1">
              <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">Net Payables (To Pay)</span>
              <p className="text-xl font-black text-rose-600">₹45,200.00</p>
              <p className="text-[10px] text-muted-foreground">Owed to 3 wholesale suppliers</p>
            </div>
          </div>
        </Card>

      </div>
    </section>
  );
}
