# LedgerFlow

LedgerFlow is a dual-mode financial management application that helps you track both personal expenses and business finances in one place. You can easily switch between **Personal Mode** and **Business Mode** to keep your personal money and business cash flows completely organized.

---

## Features Overview

LedgerFlow offers two distinct modes tailored to your specific financial needs.

### 1. Personal Mode

Personal Mode helps you manage your day-to-day personal finances, track debts with friends, split group bills, and set savings goals.

- **Financial Dashboard & Analytics**: See your total income, total expenses, net balance, and spending charts at a glance.
- **Account & Wallet Tracking**: Track money across cash, bank accounts, digital wallets, and credit cards with exact rupee precision.
- **Expense & Income Management**: Easily add transactions with dates, categories, accounts, and notes.
- **Categories & Monthly Budgets**: Create custom spending categories with icons and set monthly budget limits to monitor your spending.
- **Savings Goals**: Set savings targets with deadlines and track progress as you contribute funds.
- **Subscriptions & Recurring Payments**: Automate repeating payments like rent, utilities, or subscriptions with options for daily, weekly, monthly, or yearly schedules.
- **Friends & Peer-to-Peer Debt**: Track who owes you money and who you owe money to. Connect with friends using phone numbers or invite links.
- **Group Ledgers & Expense Splitting**: Create groups for shared living or trips. Split bills equally, by exact amount, or by percentage, and record settlements.
- **Social Notifications**: Receive notifications for friend requests, group invites, and added shared expenses.
- **Profile & Privacy**: Customize your profile, claim a unique username, and control who can find you by phone or username.

---

### 2. Business Mode

Business Mode is designed for freelancers, small business owners, and merchants to manage customer receivables, supplier payables, and B2B transactions.

- **Multi-Business Entity Management**: Create and switch between multiple independent business entities under a single account.
- **Business Financial Dashboard**: Instantly view total receivables ("You Will Get") and total payables ("You Will Give").
- **Customer & Supplier CRM**: Organize contacts as Customers, Suppliers, or Others. Store contact details, upload photos, and link local contacts to registered user profiles.
- **Contact Ledger Pages**: View detailed transaction histories for individual customers or suppliers, with date filters and sorting options.
- **Business Transaction Engine**: Record incoming money ("You Got") and outgoing money ("You Gave") with exact amounts, descriptions, optional notes, and payment due dates.
- **Dual-Mode System & Visual Customization**: Switch between Personal and Business modes in one click. Customize light/dark themes and choose distinct accent colors for each mode.

---

## How to Run the Project Locally

Follow these step-by-step instructions to clone the repository and run LedgerFlow on Windows, macOS, or Linux using `pnpm`.

### Prerequisites

Make sure you have Git, Node.js, and pnpm installed on your computer.

#### Installing Git
- **Windows**: Download and install Git from [git-scm.com](https://git-scm.com/download/win) or run Command Prompt as Administrator:
  ```cmd
  winget install --id Git.Git -e --source winget
  ```
- **macOS**: Open Terminal and install Git using Homebrew:
  ```bash
  brew install git
  ```
  Or install Xcode Command Line Tools by running:
  ```bash
  xcode-select --install
  ```
- **Linux (Debian / Ubuntu)**: Open Terminal and run:
  ```bash
  sudo apt update && sudo apt install git -y
  ```
- **Linux (Fedora)**: Open Terminal and run:
  ```bash
  sudo dnf install git -y
  ```

#### Installing Node.js and pnpm
1. **Node.js (v18 or higher)**: You can download an installer from [nodejs.org](https://nodejs.org/) or install via your distribution package manager:
   - **Debian / Ubuntu**:
     ```bash
     sudo apt update && sudo apt install nodejs npm -y
     ```
   - **Fedora**:
     ```bash
     sudo dnf install nodejs npm -y
     ```
   - Verify installation by running:
     ```bash
     node -v
     ```
2. **pnpm**: Install pnpm globally using npm:
   ```bash
   npm install -g pnpm
   ```
   Verify installation by running:
   ```bash
   pnpm -v
   ```

---

### Step 1: Clone the Repository

Clone the project from GitHub to your computer and enter the project folder.

- **Windows (Command Prompt / PowerShell / Git Bash)**:
  ```cmd
  git clone https://github.com/your-username/ledgerflow.git
  cd ledgerflow
  ```
- **macOS & Linux (Terminal)**:
  ```bash
  git clone https://github.com/your-username/ledgerflow.git
  cd ledgerflow
  ```

---

### Step 2: Configure Environment Variables

Environment variables store configuration secrets like database credentials and authentication keys.

LedgerFlow uses **Zod** to strictly validate all environment variables at application startup via `@/env` (`src/env.ts`). If any vital environment variable is missing or formatted incorrectly, the app will log a detailed error message and halt startup immediately to prevent runtime errors.

Copy the provided `.env.example` file to create your `.env.local` configuration file:

- **Windows (Command Prompt / PowerShell)**:
  ```cmd
  copy .env.example .env.local
  ```
- **macOS & Linux (Terminal)**:
  ```bash
  cp .env.example .env.local
  ```

Open `.env.local` in a text editor (such as VS Code) and populate the values:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ledgerflow"
BETTER_AUTH_SECRET="a_random_32_character_secret_key_here"
BETTER_AUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

#### Environment Variables Reference

1. **`DATABASE_URL`** *(Required)*
   - **Why it is needed**: Specifies how LedgerFlow connects to your PostgreSQL database (e.g. Neon, or local Postgres).
   - **Validation**: Must be a non-empty Postgres connection URL. The app will fail to start if this is missing.

2. **`BETTER_AUTH_SECRET`** *(Required)*
   - **Why it is needed**: Secret key used by Better Auth to sign session cookies and tokens.
   - **Where to obtain it**: Generate a secure 32+ character random key:
     ```bash
     openssl rand -hex 32
     ```
   - **Validation**: Must be a non-empty string. The app will fail to start if this is missing.

3. **`BETTER_AUTH_URL`** *(Required)*
   - **Why it is needed**: Base Web URL of your application required for auth callbacks.
   - **Validation**: Must be a valid URL. The app will fail to start if this is missing.

4. **`CRON_SECRET`** *(Optional)*
   - **Why it is needed**: Secret Bearer token to authorize automated recurring transaction cron endpoints (`/api/cron/recurring`).

5. **`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`** *(Optional for Google Sign-In)*
   - **Why it is needed**: Enables Google OAuth 2.0 social sign-in.
   - **Where to obtain it**: Google Cloud Console > APIs & Services > Credentials.

6. **`NEXT_PUBLIC_SITE_URL`** *(Optional)*
   - **Why it is needed**: Canonical website URL exposed to the frontend for metadata and absolute links.

#### Test Environment (`.env.test`)

When running automated tests (e.g., `pnpm test`), LedgerFlow requires a `.env.test` file to provide necessary variables such as `DATABASE_URL` (for a test database), `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL`. No hardcoded fallbacks are provided to ensure tests run against explicit configurations.

---

### Step 3: Install Dependencies

Download and install all project dependencies using `pnpm`:

```bash
pnpm install
```

---

### Step 4: Start the Development Server

Start the local development server:

```bash
pnpm dev
```

---

### Step 5: Open the Application in Your Browser

Open your browser and navigate to:

```text
http://localhost:3000
```

The app will update automatically when you save changes to the project files.

---

## Additional Commands

Here are other helpful commands you can run with `pnpm`:

- **Build for Production**:
  ```bash
  pnpm build
  ```
- **Start Production Server**:
  ```bash
  pnpm start
  ```
- **Run Unit Tests**:
  ```bash
  pnpm test
  ```
- **Run End-to-End Tests**:
  ```bash
  pnpm test:e2e
  ```
- **Run Code Linter**:
  ```bash
  pnpm lint
  ```
