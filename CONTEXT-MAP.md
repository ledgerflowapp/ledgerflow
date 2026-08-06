# LedgerFlow Context Map

## Overview
LedgerFlow's domain architecture is organized into three distinct Bounded Contexts:

1. **Shared Core Context** ([CONTEXT.md](./CONTEXT.md))
   - **Scope**: User authentication & identity, Dual-Mode workspace switcher, appearance settings, and cross-context identity reconciliation via Contact Merging.
2. **Personal Finance Context** ([docs/contexts/personal/CONTEXT.md](./docs/contexts/personal/CONTEXT.md))
   - **Scope**: Personal monetary accounts, categories, budget caps, savings goals, recurring subscription schedules, and peer-to-peer social debt splitting (Friends & Group Ledgers).
3. **Business Finance Context** ([docs/contexts/business/CONTEXT.md](./docs/contexts/business/CONTEXT.md))
   - **Scope**: Multi-business entity isolation, Customer/Supplier CRM contacts, receivables ("You Will Get"), payables ("You Will Give"), and business transaction ledgers.

## Context Relationships & Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│                     Shared Core Context                     │
│  (Registered Profile, Workspace Mode, Contact Merging)      │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────────────┐┌──────────────────────────────┐
│   Personal Finance Context   ││   Business Finance Context   │
│  (Accounts, Budgets, Goals,  ││   (Entities, Customer/       │
│   Friends, Group Ledgers)    ││    Supplier CRM, Payables)   │
└──────────────────────────────┘└──────────────────────────────┘
```

- **Shared Core Context (Upstream Foundation)**: Provides global profile identity, social handles, and workspace mode preference state to all subdomains.
- **Personal Finance Context (Downstream Subdomain)**: Consumes profile identity from Shared Core to manage personal cashflows and P2P social debt. Operates completely independently from Business Finance.
- **Business Finance Context (Downstream Subdomain)**: Consumes profile identity from Shared Core to manage commercial entity ledgers and CRM contact relationships. Operates completely independently from Personal Finance.
- **Inter-Context Isolation**: Personal Finance and Business Finance enforce strict data isolation based on active Workspace Mode with zero data or state bleed.
