import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const userSettings = pgTable("user_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  businessTheme: text("business_theme").default("light"),
  personalTheme: text("personal_theme").default("dark"),
  businessAccent: text("business_accent").default("blue"),
  personalAccent: text("personal_accent").default("green"),
  syncThemes: boolean("sync_themes").default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow(),
});
