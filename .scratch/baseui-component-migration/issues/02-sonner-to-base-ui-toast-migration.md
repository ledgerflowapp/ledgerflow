# 02 — Codebase-Wide Sonner to Base UI Toast Migration

**What to build:**
Migration of all legacy `sonner` toast calls across Auth, Personal Transaction Drawer, Business Transaction Drawer, Split Expense Drawer, Settle Up Drawer, and Group Settings to the new `@base-ui/react/toast` engine.

**Blocked by:** 01 — Base UI Toast Engine Expansion & Root Layout Setup

**Status:** ready-for-agent

- [ ] All `import { toast } from "sonner"` statements in application code are replaced with `import { toast } from "@/components/ui/toast"`.
- [ ] Successful transaction creation, expense settlements, group additions, and profile updates trigger typed Base UI toast popups (`toast.success`).
- [ ] Form validation errors and API failure messages trigger error toasts (`toast.error`).
- [ ] Long-running operations display loading spinners inside toasts (`toast.loading`).
- [ ] `grep -rn 'from "sonner"' src/` returns zero results (or only intentional non-app references).
