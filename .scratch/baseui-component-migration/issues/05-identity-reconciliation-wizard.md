# 05 — Identity Reconciliation & Ghost Member Claiming Wizard

**What to build:**
A guided multi-step Questionnaire wizard that assists users in reconciling Unregistered Contacts and claiming Ghost Member records within shared Group Ledgers.

**Blocked by:** 01 — Base UI Toast Engine Expansion & Root Layout Setup, 04 — Onboarding Questionnaire Wizard Integration

**Status: completed**

- [x] A `ContactReconciliationWizard` component is created using `Questionnaire` primitives.
- [x] The wizard guides users through selecting local Unregistered Contacts, matching by verified phone/email, and submitting a claim for group Ghost Member records.
- [x] Claim submissions trigger group creator/admin approval notifications and display feedback via Base UI `toast()`.
- [x] End-to-end integration tests in Vitest / Playwright verify wizard step navigation and claim submission handling.
