import { pgTable, text, timestamp, boolean, uuid, numeric, integer, jsonb, index } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { businesses } from "./financial";

export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phone: text("phone"),
    type: text("type"), // 'CUSTOMER' | 'SUPPLIER' | 'OTHER'
    netBalance: numeric("net_balance").default("0.00"),
    lastTransactionAt: timestamp("last_transaction_at", { withTimezone: true, mode: "date" }).defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
    businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }),
    imageUrl: text("image_url"),
    transactionCount: integer("transaction_count").default(0),
    inviteToken: uuid("invite_token").defaultRandom().unique(),
    linkedUserId: text("linked_user_id").references(() => user.id),
  },
  (table) => [
    index("contacts_user_id_idx").on(table.userId),
    index("contacts_type_idx").on(table.type),
  ]
);

export const friendships = pgTable("friendships", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId1: text("user_id_1").references(() => user.id),
  userId2: text("user_id_2").references(() => user.id),
  status: text("status"), // 'PENDING' | 'ACCEPTED'
  initiatorId: text("initiator_id").references(() => user.id),
});

export const groups = pgTable("groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdBy: text("created_by").references(() => user.id),
  avatarUrl: text("avatar_url"),
  type: text("type").default("GENERAL"),
  inviteCode: uuid("invite_code").defaultRandom().unique(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
});

export const groupMembers = pgTable("group_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").references(() => groups.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => user.id),
  ghostName: text("ghost_name"),
  avatarUrl: text("avatar_url"),
  joinedAt: timestamp("joined_at", { withTimezone: true, mode: "date" }).defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => user.id),
  type: text("type"), // 'FRIEND_REQ' | 'GROUP_INVITE' | 'EXPENSE_ADDED'
  title: text("title"),
  message: text("message"),
  data: jsonb("data"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
});

export const group_members = groupMembers;

