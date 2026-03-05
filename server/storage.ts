import {
  users,
  authOtps,
  passwordResets,
  settings,
  cycles,
  categories,
  transactions,
  notifications,
  onboardingStories,
  refreshTokens,
  type User,
  type InsertUser,
  type AuthOtp,
  type PasswordReset,
  type Settings,
  type Cycle,
  type Category,
  type Transaction,
  type Notification,
  type OnboardingStory,
  type RefreshToken,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql, isNull } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Partial<InsertUser> & { email: string }): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Auth OTPs
  getLatestOtp(userId: string): Promise<AuthOtp | undefined>;
  createOtp(otp: Omit<AuthOtp, "id" | "createdAt">): Promise<AuthOtp>;
  updateOtp(id: string, updates: Partial<AuthOtp>): Promise<void>;
  deleteOtpsForUser(userId: string): Promise<void>;

  // Password Resets
  getLatestPasswordReset(userId: string): Promise<PasswordReset | undefined>;
  createPasswordReset(reset: Omit<PasswordReset, "id" | "createdAt">): Promise<PasswordReset>;
  updatePasswordReset(id: string, updates: Partial<PasswordReset>): Promise<void>;
  deletePasswordResetsForUser(userId: string): Promise<void>;

  // Refresh Tokens
  createRefreshToken(userId: string, token: string, expiresAt: Date): Promise<RefreshToken>;
  getRefreshToken(token: string): Promise<RefreshToken | undefined>;
  revokeRefreshToken(token: string): Promise<void>;
  deleteExpiredRefreshTokens(): Promise<void>;

  // Settings
  getSettings(userId: string): Promise<Settings | undefined>;
  createSettings(userId: string): Promise<Settings>;
  updateSettings(userId: string, updates: Partial<Settings>): Promise<Settings | undefined>;

  // Cycles
  getCycle(id: string): Promise<Cycle | undefined>;
  getActiveCycle(userId: string): Promise<Cycle | undefined>;
  getCycles(userId: string): Promise<Cycle[]>;
  createCycle(cycle: Omit<Cycle, "id" | "createdAt">): Promise<Cycle>;
  closeCycle(id: string): Promise<void>;

  // Categories
  getCategories(userId: string): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: Omit<Category, "id">): Promise<Category>;
  archiveCategory(id: string): Promise<void>;
  seedDefaultCategories(userId: string): Promise<void>;

  // Transactions
  getTransactions(userId: string, cycleId?: string): Promise<(Transaction & { category: Category })[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  createTransaction(tx: Omit<Transaction, "id" | "createdAt">): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;

  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: Omit<Notification, "id" | "createdAt">): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;

  // Onboarding Stories
  getActiveStories(): Promise<OnboardingStory[]>;
  createStory(story: Omit<OnboardingStory, "id" | "createdAt" | "updatedAt">): Promise<OnboardingStory>;
  updateStory(id: string, updates: Partial<OnboardingStory>): Promise<OnboardingStory | undefined>;
  deleteStory(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user || undefined;
  }

  async createUser(user: Partial<InsertUser> & { email: string }): Promise<User> {
    const [created] = await db.insert(users).values({
      ...user,
      email: user.email.toLowerCase(),
    }).returning();
    return created;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated || undefined;
  }

  // Auth OTPs
  async getLatestOtp(userId: string): Promise<AuthOtp | undefined> {
    const [otp] = await db.select().from(authOtps)
      .where(eq(authOtps.userId, userId))
      .orderBy(desc(authOtps.createdAt))
      .limit(1);
    return otp || undefined;
  }

  async createOtp(otp: Omit<AuthOtp, "id" | "createdAt">): Promise<AuthOtp> {
    const [created] = await db.insert(authOtps).values(otp).returning();
    return created;
  }

  async updateOtp(id: string, updates: Partial<AuthOtp>): Promise<void> {
    await db.update(authOtps).set(updates).where(eq(authOtps.id, id));
  }

  async deleteOtpsForUser(userId: string): Promise<void> {
    await db.delete(authOtps).where(eq(authOtps.userId, userId));
  }

  // Password Resets
  async getLatestPasswordReset(userId: string): Promise<PasswordReset | undefined> {
    const [reset] = await db.select().from(passwordResets)
      .where(and(eq(passwordResets.userId, userId), isNull(passwordResets.usedAt)))
      .orderBy(desc(passwordResets.createdAt))
      .limit(1);
    return reset || undefined;
  }

  async createPasswordReset(reset: Omit<PasswordReset, "id" | "createdAt">): Promise<PasswordReset> {
    const [created] = await db.insert(passwordResets).values(reset).returning();
    return created;
  }

  async updatePasswordReset(id: string, updates: Partial<PasswordReset>): Promise<void> {
    await db.update(passwordResets).set(updates).where(eq(passwordResets.id, id));
  }

  async deletePasswordResetsForUser(userId: string): Promise<void> {
    await db.delete(passwordResets).where(eq(passwordResets.userId, userId));
  }

  // Refresh Tokens
  async createRefreshToken(userId: string, token: string, expiresAt: Date): Promise<RefreshToken> {
    const [created] = await db.insert(refreshTokens).values({ userId, token, expiresAt }).returning();
    return created;
  }

  async getRefreshToken(token: string): Promise<RefreshToken | undefined> {
    const [rt] = await db.select().from(refreshTokens).where(eq(refreshTokens.token, token));
    return rt || undefined;
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.token, token));
  }

  async deleteExpiredRefreshTokens(): Promise<void> {
    await db.delete(refreshTokens).where(sql`${refreshTokens.expiresAt} < NOW()`);
  }

  // Settings
  async getSettings(userId: string): Promise<Settings | undefined> {
    const [s] = await db.select().from(settings).where(eq(settings.userId, userId));
    return s || undefined;
  }

  async createSettings(userId: string): Promise<Settings> {
    const [created] = await db.insert(settings).values({ userId }).returning();
    return created;
  }

  async updateSettings(userId: string, updates: Partial<Settings>): Promise<Settings | undefined> {
    const [updated] = await db.update(settings)
      .set(updates)
      .where(eq(settings.userId, userId))
      .returning();
    return updated || undefined;
  }

  // Cycles
  async getCycle(id: string): Promise<Cycle | undefined> {
    const [cycle] = await db.select().from(cycles).where(eq(cycles.id, id));
    return cycle || undefined;
  }

  async getActiveCycle(userId: string): Promise<Cycle | undefined> {
    const [cycle] = await db.select().from(cycles)
      .where(and(eq(cycles.userId, userId), eq(cycles.status, "active")));
    return cycle || undefined;
  }

  async getCycles(userId: string): Promise<Cycle[]> {
    return db.select().from(cycles)
      .where(eq(cycles.userId, userId))
      .orderBy(desc(cycles.createdAt));
  }

  async createCycle(cycle: Omit<Cycle, "id" | "createdAt">): Promise<Cycle> {
    const [created] = await db.insert(cycles).values(cycle).returning();
    return created;
  }

  async closeCycle(id: string): Promise<void> {
    await db.update(cycles)
      .set({ status: "closed", closedAt: new Date() })
      .where(eq(cycles.id, id));
  }

  // Categories
  async getCategories(userId: string): Promise<Category[]> {
    return db.select().from(categories)
      .where(and(eq(categories.userId, userId), isNull(categories.archivedAt)));
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [cat] = await db.select().from(categories).where(eq(categories.id, id));
    return cat || undefined;
  }

  async createCategory(category: Omit<Category, "id">): Promise<Category> {
    const [created] = await db.insert(categories).values(category).returning();
    return created;
  }

  async archiveCategory(id: string): Promise<void> {
    await db.update(categories)
      .set({ archivedAt: new Date() })
      .where(eq(categories.id, id));
  }

  async seedDefaultCategories(userId: string): Promise<void> {
    const expenseCategories = ["Food", "Transport", "Printing", "Data/Airtime", "Hostel/Utilities", "Academic", "Emergency", "Other Expense"];
    const incomeCategories = ["Allowance", "Gift", "Refund", "Other Income"];

    const expenseInserts = expenseCategories.map(name => ({
      userId,
      name,
      kind: "expense" as const,
      isDefault: true,
    }));

    const incomeInserts = incomeCategories.map(name => ({
      userId,
      name,
      kind: "income" as const,
      isDefault: true,
    }));

    await db.insert(categories).values([...expenseInserts, ...incomeInserts]);
  }

  // Transactions
  async getTransactions(userId: string, cycleId?: string): Promise<(Transaction & { category: Category })[]> {
    const condition = cycleId
      ? and(eq(transactions.userId, userId), eq(transactions.cycleId, cycleId))
      : eq(transactions.userId, userId);

    const result = await db.select({
      id: transactions.id,
      userId: transactions.userId,
      cycleId: transactions.cycleId,
      type: transactions.type,
      categoryId: transactions.categoryId,
      amount: transactions.amount,
      note: transactions.note,
      occurredAt: transactions.occurredAt,
      createdAt: transactions.createdAt,
      category: categories,
    })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(condition)
      .orderBy(desc(transactions.occurredAt));

    return result.map((r: any) => ({
      ...r,
      category: r.category!,
    }));
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [tx] = await db.select().from(transactions).where(eq(transactions.id, id));
    return tx || undefined;
  }

  async createTransaction(tx: Omit<Transaction, "id" | "createdAt">): Promise<Transaction> {
    const [created] = await db.insert(transactions).values(tx).returning();
    return created;
  }

  async deleteTransaction(id: string): Promise<void> {
    await db.delete(transactions).where(eq(transactions.id, id));
  }

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    return db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async createNotification(notification: Omit<Notification, "id" | "createdAt">): Promise<Notification> {
    const [created] = await db.insert(notifications).values(notification).returning();
    return created;
  }

  async markNotificationRead(id: string): Promise<void> {
    await db.update(notifications)
      .set({ readAt: new Date() })
      .where(eq(notifications.id, id));
  }

  // Onboarding Stories
  async getActiveStories(): Promise<OnboardingStory[]> {
    return db.select().from(onboardingStories)
      .where(eq(onboardingStories.isActive, true))
      .orderBy(asc(onboardingStories.order));
  }

  async createStory(story: Omit<OnboardingStory, "id" | "createdAt" | "updatedAt">): Promise<OnboardingStory> {
    const [created] = await db.insert(onboardingStories).values(story).returning();
    return created;
  }

  async updateStory(id: string, updates: Partial<OnboardingStory>): Promise<OnboardingStory | undefined> {
    const [updated] = await db.update(onboardingStories)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(onboardingStories.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteStory(id: string): Promise<void> {
    await db.delete(onboardingStories).where(eq(onboardingStories.id, id));
  }
}

export const storage = new DatabaseStorage();
