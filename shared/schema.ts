import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, numeric, date, uniqueIndex, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// onboarding stories — displayed to new visitors before auth
export const onboardingStories = pgTable("onboarding_stories", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  order: integer("order").notNull(),
  headline: text("headline").notNull(),
  body: text("body").notNull(),
  mediaType: text("media_type").default("none").notNull(), // 'image' | 'lottie' | 'none'
  mediaUrl: text("media_url"),
  durationMs: integer("duration_ms").default(4000).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  name: text("name"),
  phone: text("phone"),
  department: text("department"),
  level: text("level"),
  role: text("role").$type<"user" | "admin">().default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  settings: one(settings),
  cycles: many(cycles),
  categories: many(categories),
  transactions: many(transactions),
  notifications: many(notifications),
  authOtps: many(authOtps),
  passwordResets: many(passwordResets),
  refreshTokens: many(refreshTokens),
}));

export const authOtps = pgTable("auth_otps", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).references(() => users.id, { onDelete: "cascade" }).notNull(),
  otpHash: text("otp_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  lastSentAt: timestamp("last_sent_at").notNull(),
  attemptsCount: numeric("attempts_count").default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const authOtpsRelations = relations(authOtps, ({ one }) => ({
  user: one(users, { fields: [authOtps.userId], references: [users.id] }),
}));

export const passwordResets = pgTable("password_resets", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).references(() => users.id, { onDelete: "cascade" }).notNull(),
  method: text("method").notNull(), // 'link' | 'code'
  tokenHash: text("token_hash"),
  codeHash: text("code_hash"),
  expiresAt: timestamp("expires_at").notNull(),
  lastSentAt: timestamp("last_sent_at").notNull(),
  attemptsCount: numeric("attempts_count").default("0").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const passwordResetsRelations = relations(passwordResets, ({ one }) => ({
  user: one(users, { fields: [passwordResets.userId], references: [users.id] }),
}));

export const settings = pgTable("settings", {
  userId: varchar("user_id", { length: 36 }).primaryKey().references(() => users.id, { onDelete: "cascade" }),
  dailyCapEnabled: boolean("daily_cap_enabled").default(false).notNull(),
  dailyCapAmount: numeric("daily_cap_amount", { precision: 12, scale: 2 }),
  hideBalanceDefault: boolean("hide_balance_default").default(false).notNull(),
  emailAlertsEnabled: boolean("email_alerts_enabled").default(true).notNull(),
});

export const settingsRelations = relations(settings, ({ one }) => ({
  user: one(users, { fields: [settings.userId], references: [users.id] }),
}));

export const cycles = pgTable("cycles", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).references(() => users.id, { onDelete: "cascade" }).notNull(),
  startDate: date("start_date").notNull(),
  nextAllowanceDate: date("next_allowance_date").notNull(),
  startingBalance: numeric("starting_balance", { precision: 12, scale: 2 }).notNull(),
  expectedNextAmount: numeric("expected_next_amount", { precision: 12, scale: 2 }),
  status: text("status").default("active").notNull(), // 'active' | 'closed'
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("one_active_cycle_per_user").on(table.userId).where(sql`status = 'active'`),
]);

export const cyclesRelations = relations(cycles, ({ one, many }) => ({
  user: one(users, { fields: [cycles.userId], references: [users.id] }),
  transactions: many(transactions),
}));

export const categories = pgTable("categories", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  kind: text("kind").notNull(), // 'expense' | 'income' | 'both'
  isDefault: boolean("is_default").default(false).notNull(),
  archivedAt: timestamp("archived_at"),
}, (table) => [
  uniqueIndex("unique_category_name_per_user").on(table.userId, sql`lower(${table.name})`),
]);

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, { fields: [categories.userId], references: [users.id] }),
  transactions: many(transactions),
}));

export const transactions = pgTable("transactions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).references(() => users.id, { onDelete: "cascade" }).notNull(),
  cycleId: varchar("cycle_id", { length: 36 }).references(() => cycles.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(), // 'expense' | 'income'
  categoryId: varchar("category_id", { length: 36 }).references(() => categories.id).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  note: text("note"),
  occurredAt: timestamp("occurred_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
  cycle: one(cycles, { fields: [transactions.cycleId], references: [cycles.id] }),
  category: one(categories, { fields: [transactions.categoryId], references: [categories.id] }),
}));

export const notifications = pgTable("notifications", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).references(() => users.id, { onDelete: "cascade" }).notNull(),
  kind: text("kind").notNull(), // 'tight' | 'critical' | 'cap_exceeded' | 'info'
  title: text("title").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  readAt: timestamp("read_at"),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const refreshTokens = pgTable("refresh_tokens", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  revokedAt: timestamp("revoked_at"),
});

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, { fields: [refreshTokens.userId], references: [users.id] }),
}));

export type RefreshToken = typeof refreshTokens.$inferSelect;

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const registerUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  department: z.string().optional(),
  level: z.string().optional(),
});

export const loginUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const otpStartSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const otpVerifySchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export const resetStartSchema = z.object({
  email: z.string().email("Invalid email address"),
  method: z.enum(["link", "code"]),
});

export const resetFinishLinkSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export const resetFinishCodeSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().length(6, "Code must be 6 digits"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  department: z.string().optional(),
  level: z.string().optional(),
});

export const completeProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  userId: true,
});

export const updateSettingsSchema = z.object({
  dailyCapEnabled: z.boolean().optional(),
  dailyCapAmount: z.string().optional(),
  hideBalanceDefault: z.boolean().optional(),
  emailAlertsEnabled: z.boolean().optional(),
});

export const insertCycleSchema = z.object({
  startDate: z.string(),
  nextAllowanceDate: z.string(),
  startingBalance: z.string().refine((val) => parseFloat(val) >= 0, "Starting balance must be non-negative"),
  expectedNextAmount: z.string().optional(),
});

export const insertCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  kind: z.enum(["expense", "income", "both"]),
});

export const insertTransactionSchema = z.object({
  type: z.enum(["expense", "income"]),
  categoryId: z.string().min(1, "Category is required"),
  amount: z.string().refine((val) => parseFloat(val) > 0, "Amount must be positive"),
  note: z.string().optional(),
  occurredAt: z.string().optional(),
});

export const insertStorySchema = z.object({
  order: z.number().int().min(0),
  headline: z.string().min(1),
  body: z.string().min(1),
  mediaType: z.enum(["image", "lottie", "none"]).default("none"),
  mediaUrl: z.string().nullable().optional(),
  durationMs: z.number().int().min(500).default(4000),
  isActive: z.boolean().default(true),
});

export const updateStorySchema = insertStorySchema.partial();

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type AuthOtp = typeof authOtps.$inferSelect;
export type PasswordReset = typeof passwordResets.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type Cycle = typeof cycles.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type OnboardingStory = typeof onboardingStories.$inferSelect;

// API Response types
export type AnalyticsSummary = {
  currentBalance: string;
  daysLeft: number;
  safePerDay: string;
  avgWeekdaySpend: string;
  avgWeekendSpend: string;
  predictedRemainingSpend: string;
  predictedRunoutDate: string | null;
  status: "safe" | "tight" | "critical";
  categoryTotals: { categoryId: string; categoryName: string; total: string }[];
};

export type TimeseriesData = {
  date: string;
  incomeTotal: string;
  expenseTotal: string;
  balanceEndOfDay: string;
}[];
