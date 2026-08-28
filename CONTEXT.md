# Shared Core Context Glossary

This glossary defines the ubiquitous language for the **Shared Core Context** of LedgerFlow, which governs user identity, workspace state, preferences, and identity reconciliation across Personal and Business modes.

---

## 1. Workspace & Preference Management

### Workspace Mode
The top-level operational scope of LedgerFlow, operating as either **Personal Mode** or **Business Mode**. Switching mode alters the active UI navigation shell, styling themes, accessible features, and transaction data boundaries.

### Theme & Accent Preference
Mode-specific visual appearance settings:
- **Theme**: Light or Dark mode setting, configured independently per Workspace Mode.
- **Accent Color**: Selection of 6 curated accent color palettes (Blue, Green, Violet, Orange, Rose, Slate) configured per Workspace Mode.
- **Theme Sync**: Optional setting allowing users to mirror Light/Dark appearance across modes while maintaining mode-specific accent styling.

---

## 2. Identity & Social Entities

### Registered Profile
An authenticated user in LedgerFlow possessing a verified identity, user settings, profile picture avatar, phone number, and optional claimed `@username` handle.

### Unregistered Contact
A local contact entry created by a Registered Profile (User A) to record 1:1 transactions, IOUs, or balances with an external individual (User B) who does not yet have an active LedgerFlow account. An Unregistered Contact is scoped locally to the user who created it.

### Ghost Member
A non-registered participant in a shared Group Ledger represented by a placeholder name. 

> **Relationship between Unregistered Contact & Ghost Member:**
> When User A adds an Unregistered Contact (User B) to a shared Group Ledger (e.g. with members C, D), that Unregistered Contact becomes a **Ghost Member** within the context of that specific Group Ledger. An Unregistered Contact appearing in a Group Ledger functions as a Ghost Member for group expense splitting.

---

## 3. Identity Reconciliation

### Contact Merging
The process of linking one or more `Unregistered Contact` entries (1:1 context) and/or `Ghost Member` records (group context) to a newly registered or existing `Registered Profile` upon phone/email verification or invite link acceptance.

- **Verification Guard**: Auto-matching by phone or email requires verified identity status on the target profile to prevent spoofing.
- **Deterministic Matching**: Performed strictly via verified phone/email matches or explicit unique invite link tokens (excluding ambiguous fuzzy name matching).
- **1:1 Contact Linking**: Automatically links matching Unregistered Contact entries to the target Registered Profile.
- **Group Ghost Member Claiming**:
  - *Direct Token Claim*: Claiming via an explicit group invite token immediately converts the Ghost Member to a linked Registered Profile in the group.
  - *Phone/Email Match*: Matching via phone/email notifies the group creator/admin for approval before re-assigning historical group transaction splits.
- **Friendship Auto-Creation**: Merging automatically establishes a mutual `Friend` relationship between the inviter and the newly linked Registered Profile.

## 4. Domain Services

### Onboarding Service
Centralizes the multi-domain initialization of a newly registered user, decoupling the `auth` lifecycle from the provisioning of default profiles, preferences, businesses, accounts, and budget categories.

### Notification Service
Centralizes the composition and fan-out of activity notifications (e.g., deleted transactions) to relevant contacts and group members, keeping transaction actions focused solely on state changes.
