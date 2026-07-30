import { relations } from "drizzle-orm";
import { user, session, account, profiles } from "./auth";
import {
  accounts,
  businesses,
  categories,
  transactions,
  transactionSplits,
  recurringTransactions,
} from "./financial";
import { contacts, friendships, groups, groupMembers, notifications } from "./social";
import { goals, goalContributions } from "./goals";
import { ledgers, personalLedgers, friendLedgers } from "./ledgers";
import { userSettings } from "./user-settings";

export const userRelations = relations(user, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [user.id],
    references: [profiles.id],
  }),
  sessions: many(session),
  accounts: many(account),
  financialAccounts: many(accounts),
  businesses: many(businesses),
  categories: many(categories),
  transactions: many(transactions),
  contacts: many(contacts),
  goals: many(goals),
  groupsCreated: many(groups),
  settings: one(userSettings, {
    fields: [user.id],
    references: [userSettings.userId],
  }),
}));

export const profileRelations = relations(profiles, ({ one }) => ({
  user: one(user, {
    fields: [profiles.id],
    references: [user.id],
  }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const financialAccountRelations = relations(accounts, ({ one, many }) => ({
  user: one(user, {
    fields: [accounts.userId],
    references: [user.id],
  }),
  transactions: many(transactions),
}));

export const businessRelations = relations(businesses, ({ one, many }) => ({
  user: one(user, {
    fields: [businesses.userId],
    references: [user.id],
  }),
  contacts: many(contacts),
  transactions: many(transactions),
}));

export const categoryRelations = relations(categories, ({ one, many }) => ({
  user: one(user, {
    fields: [categories.userId],
    references: [user.id],
  }),
  transactions: many(transactions),
}));

export const transactionRelations = relations(transactions, ({ one, many }) => ({
  user: one(user, {
    fields: [transactions.userId],
    references: [user.id],
  }),
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
  contact: one(contacts, {
    fields: [transactions.contactId],
    references: [contacts.id],
  }),
  business: one(businesses, {
    fields: [transactions.businessId],
    references: [businesses.id],
  }),
  group: one(groups, {
    fields: [transactions.groupId],
    references: [groups.id],
  }),
  payer: one(user, {
    fields: [transactions.payerId],
    references: [user.id],
  }),
  payerGroupMember: one(groupMembers, {
    fields: [transactions.payerGroupMemberId],
    references: [groupMembers.id],
  }),
  splits: many(transactionSplits),
}));

export const transactionSplitRelations = relations(transactionSplits, ({ one }) => ({
  transaction: one(transactions, {
    fields: [transactionSplits.transactionId],
    references: [transactions.id],
  }),
  user: one(user, {
    fields: [transactionSplits.userId],
    references: [user.id],
  }),
  groupMember: one(groupMembers, {
    fields: [transactionSplits.groupMemberId],
    references: [groupMembers.id],
  }),
}));

export const contactRelations = relations(contacts, ({ one, many }) => ({
  user: one(user, {
    fields: [contacts.userId],
    references: [user.id],
  }),
  linkedUser: one(user, {
    fields: [contacts.linkedUserId],
    references: [user.id],
  }),
  business: one(businesses, {
    fields: [contacts.businessId],
    references: [businesses.id],
  }),
  transactions: many(transactions),
}));

export const groupRelations = relations(groups, ({ one, many }) => ({
  creator: one(user, {
    fields: [groups.createdBy],
    references: [user.id],
  }),
  members: many(groupMembers),
  transactions: many(transactions),
}));

export const groupMemberRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, {
    fields: [groupMembers.groupId],
    references: [groups.id],
  }),
  user: one(user, {
    fields: [groupMembers.userId],
    references: [user.id],
  }),
}));

export const goalRelations = relations(goals, ({ one, many }) => ({
  user: one(user, {
    fields: [goals.userId],
    references: [user.id],
  }),
  contributions: many(goalContributions),
}));

export const goalContributionRelations = relations(goalContributions, ({ one }) => ({
  goal: one(goals, {
    fields: [goalContributions.goalId],
    references: [goals.id],
  }),
  user: one(user, {
    fields: [goalContributions.userId],
    references: [user.id],
  }),
}));

export const ledgerRelations = relations(ledgers, ({ one }) => ({
  user: one(user, {
    fields: [ledgers.userId],
    references: [user.id],
  }),
}));
