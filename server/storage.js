import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, "db.json");

function readDb() {
  if (!fs.existsSync(DB_PATH)) {
    return { users: [], authOtps: [], passwordResets: [], refreshTokens: [], settings: [], cycles: [], categories: [], transactions: [], notifications: [], onboardingStories: [] };
  }
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

class JsonStorage {
  // Users
  async getUser(id) {
    const db = readDb();
    return db.users.find(u => u.id === id);
  }
  async getUserByEmail(email) {
    const db = readDb();
    return db.users.find(u => u.email === email.toLowerCase());
  }
  async createUser(user) {
    const db = readDb();
    const now = new Date().toISOString();
    const newUser = { id: uuidv4(), ...user, email: user.email.toLowerCase(), role: user.role || "user", createdAt: now, updatedAt: now };
    db.users.push(newUser);
    writeDb(db);
    return newUser;
  }
  async updateUser(id, updates) {
    const db = readDb();
    const idx = db.users.findIndex(u => u.id === id);
    if (idx === -1) return undefined;
    db.users[idx] = { ...db.users[idx], ...updates, updatedAt: new Date().toISOString() };
    writeDb(db);
    return db.users[idx];
  }

  // Auth OTPs
  async getLatestOtp(userId) {
    const db = readDb();
    return db.authOtps.filter(o => o.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  }
  async createOtp(otp) {
    const db = readDb();
    const created = { id: uuidv4(), ...otp, createdAt: new Date().toISOString() };
    db.authOtps.push(created);
    writeDb(db);
    return created;
  }
  async updateOtp(id, updates) {
    const db = readDb();
    const idx = db.authOtps.findIndex(o => o.id === id);
    if (idx !== -1) { db.authOtps[idx] = { ...db.authOtps[idx], ...updates }; writeDb(db); }
  }
  async deleteOtpsForUser(userId) {
    const db = readDb();
    db.authOtps = db.authOtps.filter(o => o.userId !== userId);
    writeDb(db);
  }

  // Password Resets
  async getLatestPasswordReset(userId) {
    const db = readDb();
    return db.passwordResets.filter(r => r.userId === userId && !r.usedAt).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  }
  async createPasswordReset(reset) {
    const db = readDb();
    const created = { id: uuidv4(), ...reset, createdAt: new Date().toISOString() };
    db.passwordResets.push(created);
    writeDb(db);
    return created;
  }
  async updatePasswordReset(id, updates) {
    const db = readDb();
    const idx = db.passwordResets.findIndex(r => r.id === id);
    if (idx !== -1) { db.passwordResets[idx] = { ...db.passwordResets[idx], ...updates }; writeDb(db); }
  }
  async deletePasswordResetsForUser(userId) {
    const db = readDb();
    db.passwordResets = db.passwordResets.filter(r => r.userId !== userId);
    writeDb(db);
  }

  // Refresh Tokens
  async createRefreshToken(userId, token, expiresAt) {
    const db = readDb();
    const created = { id: uuidv4(), userId, token, expiresAt: expiresAt.toISOString(), createdAt: new Date().toISOString(), revokedAt: null };
    db.refreshTokens.push(created);
    writeDb(db);
    return created;
  }
  async getRefreshToken(token) {
    const db = readDb();
    return db.refreshTokens.find(t => t.token === token);
  }
  async revokeRefreshToken(token) {
    const db = readDb();
    const idx = db.refreshTokens.findIndex(t => t.token === token);
    if (idx !== -1) { db.refreshTokens[idx].revokedAt = new Date().toISOString(); writeDb(db); }
  }
  async deleteExpiredRefreshTokens() {
    const db = readDb();
    const now = new Date();
    db.refreshTokens = db.refreshTokens.filter(t => new Date(t.expiresAt) > now);
    writeDb(db);
  }

  // Settings
  async getSettings(userId) {
    const db = readDb();
    return db.settings.find(s => s.userId === userId);
  }
  async createSettings(userId) {
    const db = readDb();
    const created = { userId, dailyCapEnabled: false, dailyCapAmount: null, hideBalanceDefault: false, emailAlertsEnabled: true };
    db.settings.push(created);
    writeDb(db);
    return created;
  }
  async updateSettings(userId, updates) {
    const db = readDb();
    const idx = db.settings.findIndex(s => s.userId === userId);
    if (idx === -1) return undefined;
    db.settings[idx] = { ...db.settings[idx], ...updates };
    writeDb(db);
    return db.settings[idx];
  }

  // Cycles
  async getCycle(id) {
    const db = readDb();
    return db.cycles.find(c => c.id === id);
  }
  async getActiveCycle(userId) {
    const db = readDb();
    return db.cycles.find(c => c.userId === userId && c.status === "active");
  }
  async getCycles(userId) {
    const db = readDb();
    return db.cycles.filter(c => c.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  async createCycle(cycle) {
    const db = readDb();
    const created = { id: uuidv4(), ...cycle, createdAt: new Date().toISOString() };
    db.cycles.push(created);
    writeDb(db);
    return created;
  }
  async closeCycle(id) {
    const db = readDb();
    const idx = db.cycles.findIndex(c => c.id === id);
    if (idx !== -1) { db.cycles[idx].status = "closed"; db.cycles[idx].closedAt = new Date().toISOString(); writeDb(db); }
  }

  // Categories
  async getCategories(userId) {
    const db = readDb();
    return db.categories.filter(c => c.userId === userId && !c.archivedAt);
  }
  async getCategory(id) {
    const db = readDb();
    return db.categories.find(c => c.id === id);
  }
  async createCategory(category) {
    const db = readDb();
    const created = { id: uuidv4(), ...category };
    db.categories.push(created);
    writeDb(db);
    return created;
  }
  async archiveCategory(id) {
    const db = readDb();
    const idx = db.categories.findIndex(c => c.id === id);
    if (idx !== -1) { db.categories[idx].archivedAt = new Date().toISOString(); writeDb(db); }
  }
  async seedDefaultCategories(userId) {
    const expenseNames = ["Food", "Transport", "Printing", "Data/Airtime", "Hostel/Utilities", "Academic", "Emergency", "Other Expense"];
    const incomeNames = ["Allowance", "Gift", "Refund", "Other Income"];
    const db = readDb();
    for (const name of expenseNames) {
      db.categories.push({ id: uuidv4(), userId, name, kind: "expense", isDefault: true, archivedAt: null });
    }
    for (const name of incomeNames) {
      db.categories.push({ id: uuidv4(), userId, name, kind: "income", isDefault: true, archivedAt: null });
    }
    writeDb(db);
  }

  // Transactions
  async getTransactions(userId, cycleId) {
    const db = readDb();
    let txs = db.transactions.filter(t => t.userId === userId);
    if (cycleId) txs = txs.filter(t => t.cycleId === cycleId);
    txs = txs.sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt));
    return txs.map(t => ({
      ...t,
      category: db.categories.find(c => c.id === t.categoryId) || null,
    }));
  }
  async getTransaction(id) {
    const db = readDb();
    return db.transactions.find(t => t.id === id);
  }
  async createTransaction(tx) {
    const db = readDb();
    const created = { id: uuidv4(), ...tx, createdAt: new Date().toISOString() };
    db.transactions.push(created);
    writeDb(db);
    return created;
  }
  async deleteTransaction(id) {
    const db = readDb();
    db.transactions = db.transactions.filter(t => t.id !== id);
    writeDb(db);
  }

  // Notifications
  async getNotifications(userId) {
    const db = readDb();
    return db.notifications.filter(n => n.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 50);
  }
  async createNotification(notification) {
    const db = readDb();
    const created = { id: uuidv4(), ...notification, createdAt: new Date().toISOString() };
    db.notifications.push(created);
    writeDb(db);
    return created;
  }
  async markNotificationRead(id) {
    const db = readDb();
    const idx = db.notifications.findIndex(n => n.id === id);
    if (idx !== -1) { db.notifications[idx].readAt = new Date().toISOString(); writeDb(db); }
  }

  // Onboarding Stories
  async getActiveStories() {
    const db = readDb();
    return db.onboardingStories.filter(s => s.isActive).sort((a, b) => a.order - b.order);
  }
  async createStory(story) {
    const db = readDb();
    const now = new Date().toISOString();
    const created = { id: uuidv4(), ...story, createdAt: now, updatedAt: now };
    db.onboardingStories.push(created);
    writeDb(db);
    return created;
  }
  async updateStory(id, updates) {
    const db = readDb();
    const idx = db.onboardingStories.findIndex(s => s.id === id);
    if (idx === -1) return undefined;
    db.onboardingStories[idx] = { ...db.onboardingStories[idx], ...updates, updatedAt: new Date().toISOString() };
    writeDb(db);
    return db.onboardingStories[idx];
  }
  async deleteStory(id) {
    const db = readDb();
    db.onboardingStories = db.onboardingStories.filter(s => s.id !== id);
    writeDb(db);
  }
}

export const storage = new JsonStorage();
