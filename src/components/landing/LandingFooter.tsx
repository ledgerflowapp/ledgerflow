import Link from 'next/link';

export function LandingFooter() {
  return (
    <footer className="bg-muted/40 border-t border-border py-12 w-full shrink-0">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="font-bold text-xl tracking-tight text-primary">
              LedgerFlow
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Direct and secure personal financial logs, group expense reconciliations, and professional multi-business ledger tools.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#personal-features" className="text-muted-foreground hover:text-foreground transition-colors">
                  Personal Wallets
                </Link>
              </li>
              <li>
                <Link href="#social-ledger" className="text-muted-foreground hover:text-foreground transition-colors">
                  Group Expense Splitting
                </Link>
              </li>
              <li>
                <Link href="#business-mode" className="text-muted-foreground hover:text-foreground transition-colors">
                  Business Mode CRM
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Architecture</h4>
            <p className="text-sm text-muted-foreground">
              Built using Next.js 15, Better Auth, and fully isolated workspace models for maximum data integrity.
            </p>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} LedgerFlow. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            India-first localizations with international currency conversion layers.
          </p>
        </div>
      </div>
    </footer>
  );
}
