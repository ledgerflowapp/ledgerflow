import { pgTable, text, timestamp, boolean, uuid, numeric, integer, index } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type"), // 'CASH' | 'BANK' | 'WALLET' | 'OTHER'
    balance: numeric("balance").default("0.00"),
    isDefault: boolean("is_default").default(false),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
  },
  (table) => [index("accounts_user_id_idx").on(table.userId)]
);

export const businesses = pgTable(
  "businesses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
  },
  (table) => [index("businesses_user_id_idx").on(table.userId)]
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    icon: text("icon"),
    type: text("type"), // 'INCOME' | 'EXPENSE'
    budgetLimit: numeric("budget_limit"),
    active: boolean("active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
  },
  (table) => [
    index("categories_user_id_idx").on(table.userId),
    index("categories_active_idx").on(table.active),
  ]
);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    amount: numeric("amount").notNull(),
    flow: text("flow"), // 'IN' | 'OUT'
    mode: text("mode"), // 'BUSINESS' | 'PERSONAL'
    contactId: uuid("contact_id"), // forward referenced
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    date: timestamp("date", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    attachmentUrl: text("attachment_url"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "date" }),
    accountId: uuid("account_id").references(() => accounts.id, { onDelete: "set null" }),
    dueDate: timestamp("due_date", { withTimezone: true, mode: "date" }),
    businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    note: text("note"),
    groupId: uuid("group_id"), // forward referenced
    payerId: text("payer_id").references(() => user.id),
    splitType: text("split_type").default("EQUALLY"), // 'EQUALLY' | 'BY_AMOUNT' | 'BY_PERCENTAGE'
    payerGroupMemberId: uuid("payer_group_member_id"), // forward referenced
  },
  (table) => [
    index("transactions_user_id_date_idx").on(table.userId, table.date),
    index("transactions_mode_idx").on(table.mode),
    index("transactions_analytics_idx").on(table.userId, table.mode, table.date),
    index("transactions_category_id_idx").on(table.categoryId),
    index("transactions_account_id_idx").on(table.accountId),
    index("transactions_business_id_idx").on(table.businessId),
    index("transactions_contact_id_idx").on(table.contactId),
    index("transactions_deleted_at_idx").on(table.deletedAt),
  ]
);

export const transactionSplits = pgTable("transaction_splits", {
  id: uuid("id").primaryKey().defaultRandom(),
  transactionId: uuid("transaction_id").references(() => transactions.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => user.id),
  groupMemberId: uuid("group_member_id"), // forward referenced
  amount: numeric("amount").notNull(),
  percentage: numeric("percentage"),
  isSettled: boolean("is_settled").default(false),
  memberNameSnapshot: text("member_name_snapshot"),
});

export const recurringTransactions = pgTable(
  "recurring_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    amount: numeric("amount").notNull(),
    flow: text("flow").default("OUT"),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    accountId: uuid("account_id").references(() => accounts.id, { onDelete: "set null" }),
    frequency: text("frequency").notNull(), // 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
    scheduleMode: text("schedule_mode").default("CALENDAR").notNull(), // 'CALENDAR' | 'FIXED_INTERVAL'
    startDate: timestamp("start_date", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    nextRunDate: timestamp("next_run_date", { withTimezone: true, mode: "date" }).notNull(),
    lastRunDate: timestamp("last_run_date", { withTimezone: true, mode: "date" }),
    active: boolean("active").default(true),
    failureCount: integer("failure_count").default(0).notNull(),
    lastFailureReason: text("last_failure_reason"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
    name: text("name").notNull(),
    note: text("note"),
  },
  (table) => [
    index("recurring_transactions_user_id_idx").on(table.userId),
    index("recurring_transactions_category_id_idx").on(table.categoryId),
    index("recurring_transactions_account_id_idx").on(table.accountId),
  ]
);

export const currencyConversions = pgTable("currency_conversions", {
  id: uuid("id").primaryKey().defaultRandom(),
  fromCurrency: text("from_currency").notNull(),
  toCurrency: text("to_currency").notNull(),
  rate: numeric("rate").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow(),
});

export const recurring_transactions = recurringTransactions;
export const currency_conversions = currencyConversions;
export const transaction_splits = transactionSplits;

