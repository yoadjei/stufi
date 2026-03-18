import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { sendOtpEmail, sendPasswordResetCode, sendDailyCapAlert, sendCriticalBalanceAlert } from "./email";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import {
  registerUserSchema,
  loginUserSchema,
  otpStartSchema,
  otpVerifySchema,
  resetStartSchema,
  resetFinishCodeSchema,
  changePasswordSchema,
  updateProfileSchema,
  completeProfileSchema,
  updateSettingsSchema,
  insertCycleSchema,
  insertCategorySchema,
  insertTransactionSchema,
  insertStorySchema,
  updateStorySchema,
} from "@shared/schema";
import rateLimit from "express-rate-limit";

// Rate limiter for auth endpoints (15 req per 15 min mostly, with some variance logic if desired, or just generic 15/15)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  message: { error: { code: "RATE_LIMITED", message: "Too many authentication attempts, please try again later." } },
  standardHeaders: true,
  legacyHeaders: false,
});

// jwt secret — picks up from env, falls back to a hardcoded one for local dev only
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET ||
  (process.env.NODE_ENV !== "production" ? "stufi-dev-secret" : (() => {
    throw new Error("JWT_SECRET or SESSION_SECRET must be set in production");
  })());
const OTP_TTL_MINUTES = parseInt(process.env.OTP_TTL_MINUTES || "10");
const OTP_RESEND_COOLDOWN_SECONDS = parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS || "60");
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || "5");
const RESET_TTL_MINUTES = parseInt(process.env.RESET_TTL_MINUTES || "30");

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateToken(): string {
  return Array.from({ length: 32 }, () =>
    Math.random().toString(36).charAt(2)
  ).join("");
}

interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "No token provided" } });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "User not found" } });
    }
    req.userId = decoded.userId;
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Invalid token" } });
  }
}

async function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: { code: "FORBIDDEN", message: "Admin access required" } });
  }
  next();
}

function signAccessToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

async function generateAndStoreRefreshToken(userId: string): Promise<string> {
  const token = generateToken() + generateToken(); // 64 chars
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  await storage.createRefreshToken(userId, token, expiresAt);
  return token;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Health check
  app.get("/api/health", async (_req, res) => {
    try {
      const user = await storage.getUser("test");
      res.json({ status: "ok", db: "connected" });
    } catch {
      res.json({ status: "ok", db: "not connected" });
    }
  });

  // ──────── Onboarding Stories (public read, auth write) ────────

  app.get("/api/onboarding/stories", async (_req, res) => {
    try {
      const stories = await storage.getActiveStories();
      res.json(stories);
    } catch (err: any) {
      res.status(500).json({ error: { message: err.message } });
    }
  });

  app.post("/api/onboarding/stories", authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertStorySchema.parse(req.body);
      const story = await storage.createStory({
        order: data.order,
        headline: data.headline,
        body: data.body,
        mediaType: data.mediaType ?? "none",
        mediaUrl: data.mediaUrl ?? null,
        durationMs: data.durationMs ?? 4000,
        isActive: data.isActive ?? true,
      });
      res.status(201).json(story);
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: { message: err.errors } });
      res.status(500).json({ error: { message: err.message } });
    }
  });

  app.put("/api/onboarding/stories/:id", authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = updateStorySchema.parse(req.body);
      const story = await storage.updateStory(String(req.params.id), data as any);
      if (!story) return res.status(404).json({ error: { message: "Story not found" } });
      res.json(story);
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: { message: err.errors } });
      res.status(500).json({ error: { message: err.message } });
    }
  });

  app.delete("/api/onboarding/stories/:id", authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
    try {
      await storage.deleteStory(String(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: { message: err.message } });
    }
  });

  // Auth: Register Start — validate email, create shell user, send OTP
  app.post("/api/auth/register/start", authLimiter, async (req, res) => {
    try {
      const { email } = z.object({ email: z.string().email("Invalid email address") }).parse(req.body);

      const existing = await storage.getUserByEmail(email);
      if (existing && existing.passwordHash) {
        return res.status(400).json({ error: { code: "EMAIL_EXISTS", message: "Email already registered" } });
      }

      let user = existing;
      if (!user) {
        user = await storage.createUser({ email });
      }

      const existingOtp = await storage.getLatestOtp(user.id);
      if (existingOtp) {
        const lastSent = new Date(existingOtp.lastSentAt);
        const cooldownEnd = new Date(lastSent.getTime() + OTP_RESEND_COOLDOWN_SECONDS * 1000);
        if (new Date() < cooldownEnd) {
          return res.status(429).json({
            error: { code: "RATE_LIMITED", message: "Please wait before requesting a new code" }
          });
        }
      }

      const otp = generateOTP();
      const otpHash = await bcrypt.hash(otp, 10);
      const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

      await storage.deleteOtpsForUser(user.id);
      await storage.createOtp({
        userId: user.id,
        otpHash,
        expiresAt,
        lastSentAt: new Date(),
        attemptsCount: "0",
      });

      await sendOtpEmail(email, otp);
      res.json({ success: true, message: "Verification code sent to your email" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: error.errors[0].message } });
      }
      console.error("Register start error:", error);
      res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to send code" } });
    }
  });

  // Auth: Register — verify OTP, upgrade shell user to full account
  app.post("/api/auth/register", authLimiter, async (req, res) => {
    try {
      const data = registerUserSchema.parse(req.body);
      const otp = z.string().length(6, "OTP must be 6 digits").parse(req.body.otp);

      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(400).json({ error: { code: "NOT_FOUND", message: "Please start registration first" } });
      }
      if (user.passwordHash) {
        return res.status(400).json({ error: { code: "EMAIL_EXISTS", message: "Email already registered" } });
      }

      const otpRecord = await storage.getLatestOtp(user.id);
      if (!otpRecord) {
        return res.status(400).json({ error: { code: "INVALID_OTP", message: "Invalid or expired code" } });
      }
      if (new Date() > new Date(otpRecord.expiresAt)) {
        return res.status(400).json({ error: { code: "EXPIRED_OTP", message: "Code has expired" } });
      }

      const attempts = parseInt(otpRecord.attemptsCount) + 1;
      if (attempts > OTP_MAX_ATTEMPTS) {
        return res.status(400).json({ error: { code: "MAX_ATTEMPTS", message: "Too many attempts" } });
      }
      await storage.updateOtp(otpRecord.id, { attemptsCount: attempts.toString() });

      const valid = await bcrypt.compare(otp, otpRecord.otpHash);
      if (!valid) {
        return res.status(400).json({ error: { code: "INVALID_OTP", message: "Invalid code" } });
      }

      await storage.deleteOtpsForUser(user.id);

      const passwordHash = await bcrypt.hash(data.password, 10);
      await storage.updateUser(user.id, {
        passwordHash,
        name: data.name,
        phone: data.phone,
        department: data.department,
        level: data.level,
      });

      const existingSettings = await storage.getSettings(user.id);
      if (!existingSettings) {
        await storage.createSettings(user.id);
      }
      await storage.seedDefaultCategories(user.id);

      const token = signAccessToken(user.id);
      const refreshToken = await generateAndStoreRefreshToken(user.id);
      const updatedUser = await storage.getUser(user.id);
      const { passwordHash: _, ...safeUser } = updatedUser!;
      res.json({ user: safeUser, token, refreshToken });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: error.errors[0].message } });
      }
      console.error("Register error:", error);
      res.status(500).json({ error: { code: "SERVER_ERROR", message: "Registration failed" } });
    }
  });

  // onboarding — creates user + settings + categories + first cycle in one go
  app.post("/api/onboard", async (req: Request, res: Response) => {
    try {
      const { name, email, password, allowanceAmount, frequency, categories: cats } = req.body;

      // basic validation
      if (!name || !email || !password || !allowanceAmount) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        email,
        passwordHash,
        name,
      });

      // settings
      await storage.createSettings(user.id);

      // create user-selected categories from onboarding
      if (cats && Array.isArray(cats) && cats.length > 0) {
        for (const cat of cats) {
          await storage.createCategory({
            userId: user.id,
            name: cat.name,
            kind: "expense",
            isDefault: true,
            archivedAt: null,
          });
        }
      }

      // always add the default income categories
      const incomeDefaults = ["Allowance", "Gift", "Refund", "Other Income"];
      for (const incName of incomeDefaults) {
        await storage.createCategory({
          userId: user.id,
          name: incName,
          kind: "income",
          isDefault: true,
          archivedAt: null,
        });
      }

      // create first budget cycle based on frequency
      const now = new Date();
      let nextDate = new Date(now);
      if (frequency === "weekly") nextDate.setDate(now.getDate() + 7);
      else if (frequency === "biweekly") nextDate.setDate(now.getDate() + 14);
      else if (frequency === "semester") nextDate.setMonth(now.getMonth() + 4);
      else nextDate.setMonth(now.getMonth() + 1); // monthly default

      await storage.createCycle({
        userId: user.id,
        startDate: now.toISOString().split("T")[0],
        nextAllowanceDate: nextDate.toISOString().split("T")[0],
        startingBalance: allowanceAmount,
        expectedNextAmount: allowanceAmount,
        status: "active",
        closedAt: null,
      });

      const token = signAccessToken(user.id);
      const refreshToken = await generateAndStoreRefreshToken(user.id);
      const { passwordHash: _, ...safeUser } = user;
      res.json({ user: safeUser, token, refreshToken });
    } catch (error) {
      console.error("Onboard error:", error);
      res.status(500).json({ message: "Something went wrong during setup" });
    }
  });

  // Auth: Login
  app.post("/api/auth/login", authLimiter, async (req, res) => {
    try {
      const data = loginUserSchema.parse(req.body);

      const user = await storage.getUserByEmail(data.email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" } });
      }

      const valid = await bcrypt.compare(data.password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" } });
      }

      const token = signAccessToken(user.id);
      const refreshToken = await generateAndStoreRefreshToken(user.id);
      const { passwordHash: _, ...safeUser } = user;
      res.json({ user: safeUser, token, refreshToken });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: error.errors[0].message } });
      }
      console.error("Login error:", error);
      res.status(500).json({ error: { code: "SERVER_ERROR", message: "Login failed" } });
    }
  });

  // Auth: OTP Start
  app.post("/api/auth/otp/start", authLimiter, async (req, res) => {
    try {
      const data = otpStartSchema.parse(req.body);

      let user = await storage.getUserByEmail(data.email);
      if (!user) {
        user = await storage.createUser({ email: data.email });
        await storage.createSettings(user.id);
        await storage.seedDefaultCategories(user.id);
      }

      const existingOtp = await storage.getLatestOtp(user.id);
      if (existingOtp) {
        const lastSent = new Date(existingOtp.lastSentAt);
        const cooldownEnd = new Date(lastSent.getTime() + OTP_RESEND_COOLDOWN_SECONDS * 1000);
        if (new Date() < cooldownEnd) {
          return res.status(429).json({
            error: { code: "RATE_LIMITED", message: "Please wait before requesting a new code" }
          });
        }
      }

      const otp = generateOTP();
      const otpHash = await bcrypt.hash(otp, 10);
      const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

      await storage.deleteOtpsForUser(user.id);
      await storage.createOtp({
        userId: user.id,
        otpHash,
        expiresAt,
        lastSentAt: new Date(),
        attemptsCount: "0",
      });

      // Send OTP via email
      await sendOtpEmail(data.email, otp);
      res.json({ success: true, message: "Code sent to your email" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: error.errors[0].message } });
      }
      console.error("OTP start error:", error);
      res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to send code" } });
    }
  });

  // Auth: OTP Verify
  app.post("/api/auth/otp/verify", authLimiter, async (req, res) => {
    try {
      const data = otpVerifySchema.parse(req.body);

      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(400).json({ error: { code: "INVALID_OTP", message: "Invalid or expired code" } });
      }

      const otpRecord = await storage.getLatestOtp(user.id);
      if (!otpRecord) {
        return res.status(400).json({ error: { code: "INVALID_OTP", message: "Invalid or expired code" } });
      }

      if (new Date() > new Date(otpRecord.expiresAt)) {
        return res.status(400).json({ error: { code: "EXPIRED_OTP", message: "Code has expired" } });
      }

      const attempts = parseInt(otpRecord.attemptsCount) + 1;
      if (attempts > OTP_MAX_ATTEMPTS) {
        return res.status(400).json({ error: { code: "MAX_ATTEMPTS", message: "Too many attempts" } });
      }

      await storage.updateOtp(otpRecord.id, { attemptsCount: attempts.toString() });

      const valid = await bcrypt.compare(data.otp, otpRecord.otpHash);
      if (!valid) {
        return res.status(400).json({ error: { code: "INVALID_OTP", message: "Invalid code" } });
      }

      await storage.deleteOtpsForUser(user.id);

      const token = signAccessToken(user.id);
      const refreshToken = await generateAndStoreRefreshToken(user.id);
      const { passwordHash: _, ...safeUser } = user;
      res.json({
        user: safeUser,
        token,
        refreshToken,
        needsProfile: !user.name
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: error.errors[0].message } });
      }
      console.error("OTP verify error:", error);
      res.status(500).json({ error: { code: "SERVER_ERROR", message: "Verification failed" } });
    }
  });

  // Auth: Refresh Token
  app.post("/api/auth/refresh", async (req, res) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Refresh token required" } });
      }

      const rt = await storage.getRefreshToken(refreshToken);
      if (!rt || rt.revokedAt || new Date() > new Date(rt.expiresAt)) {
        return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Invalid or expired refresh token" } });
      }

      // Revoke the old token (rotation)
      await storage.revokeRefreshToken(refreshToken);

      const user = await storage.getUser(rt.userId);
      if (!user) {
        return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "User not found" } });
      }

      // Issue new tokens
      const newToken = signAccessToken(user.id);
      const newRefreshToken = await generateAndStoreRefreshToken(user.id);

      res.json({ token: newToken, refreshToken: newRefreshToken });
    } catch (error) {
      console.error("Refresh token error:", error);
      res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to refresh token" } });
    }
  });

  // Auth: Reset Start
  app.post("/api/auth/reset/start", authLimiter, async (req, res) => {
    try {
      const data = resetStartSchema.parse(req.body);

      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.json({ success: true, message: "If the email exists, a reset has been sent" });
      }

      const existingReset = await storage.getLatestPasswordReset(user.id);
      if (existingReset) {
        const lastSent = new Date(existingReset.lastSentAt);
        const cooldownEnd = new Date(lastSent.getTime() + OTP_RESEND_COOLDOWN_SECONDS * 1000);
        if (new Date() < cooldownEnd) {
          return res.json({ success: true, message: "If the email exists, a reset has been sent" });
        }
      }

      const expiresAt = new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000);
      const code = generateOTP();
      const codeHash = await bcrypt.hash(code, 10);

      await storage.deletePasswordResetsForUser(user.id);
      await storage.createPasswordReset({
        userId: user.id,
        method: "code",
        tokenHash: null,
        codeHash,
        expiresAt,
        lastSentAt: new Date(),
        attemptsCount: "0",
        usedAt: null,
      });

      await sendPasswordResetCode(data.email, code);
      res.json({ success: true, message: "If the email exists, a reset has been sent" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: error.errors[0].message } });
      }
      console.error("Reset start error:", error);
      res.status(500).json({ error: { code: "SERVER_ERROR", message: "Reset request failed" } });
    }
  });

  // Auth: Reset Finish
  app.post("/api/auth/reset/finish", authLimiter, async (req, res) => {
    try {
      const { email, code, newPassword } = req.body;

      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Password must be at least 8 characters" } });
      }
      if (!email || !code) {
        return res.status(400).json({ error: { code: "MISSING_DATA", message: "Missing required fields" } });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ error: { code: "INVALID_CODE", message: "Invalid or expired code" } });
      }

      const resetRecord = await storage.getLatestPasswordReset(user.id);
      if (!resetRecord || !resetRecord.codeHash) {
        return res.status(400).json({ error: { code: "INVALID_CODE", message: "Invalid or expired code" } });
      }

      if (new Date() > new Date(resetRecord.expiresAt)) {
        return res.status(400).json({ error: { code: "EXPIRED_CODE", message: "Code has expired" } });
      }

      const valid = await bcrypt.compare(code, resetRecord.codeHash);
      if (!valid) {
        await storage.updatePasswordReset(resetRecord.id, {
          attemptsCount: (parseInt(resetRecord.attemptsCount) + 1).toString()
        });
        return res.status(400).json({ error: { code: "INVALID_CODE", message: "Invalid code" } });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(user.id, { passwordHash });
      await storage.updatePasswordReset(resetRecord.id, { usedAt: new Date() });
      await storage.deletePasswordResetsForUser(user.id);

      res.json({ success: true, message: "Password has been reset" });
    } catch (error) {
      console.error("Reset finish error:", error);
      res.status(500).json({ error: { code: "SERVER_ERROR", message: "Reset failed" } });
    }
  });

  // Auth: Change Password
  app.post("/api/auth/change-password", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = changePasswordSchema.parse(req.body);

      const user = await storage.getUser(req.userId!);
      if (!user || !user.passwordHash) {
        return res.status(400).json({ error: { code: "NO_PASSWORD", message: "Cannot change password" } });
      }

      const valid = await bcrypt.compare(data.currentPassword, user.passwordHash);
      if (!valid) {
        return res.status(400).json({ error: { code: "WRONG_PASSWORD", message: "Current password is incorrect" } });
      }

      const passwordHash = await bcrypt.hash(data.newPassword, 10);
      await storage.updateUser(req.userId!, { passwordHash });

      res.json({ success: true, message: "Password changed" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: error.errors[0].message } });
      }
      console.error("Change password error:", error);
      res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to change password" } });
    }
  });

  // Get current user
  app.get("/api/me", authMiddleware, async (req: AuthRequest, res) => {
    const { passwordHash: _, ...safeUser } = req.user;
    const userSettings = await storage.getSettings(req.userId!);
    res.json({ user: { ...safeUser, settings: userSettings } });
  });

  // Update profile
  app.put("/api/profile", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = updateProfileSchema.parse(req.body);
      const updated = await storage.updateUser(req.userId!, data);
      if (!updated) {
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "User not found" } });
      }
      const { passwordHash: _, ...safeUser } = updated;
      res.json({ user: safeUser });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: error.errors[0].message } });
      }
      console.error("Profile update error:", error);
      res.status(500).json({ error: { code: "SERVER_ERROR", message: "Update failed" } });
    }
  });

  // Settings
  app.get("/api/settings", authMiddleware, async (req: AuthRequest, res) => {
    let userSettings = await storage.getSettings(req.userId!);
    if (!userSettings) {
      userSettings = await storage.createSettings(req.userId!);
    }
    res.json(userSettings);
  });

  app.put("/api/settings", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = updateSettingsSchema.parse(req.body);
      let userSettings = await storage.getSettings(req.userId!);
      if (!userSettings) {
        userSettings = await storage.createSettings(req.userId!);
      }
      const updated = await storage.updateSettings(req.userId!, data);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: error.errors[0].message } });
      }
      console.error("Settings update error:", error);
      res.status(500).json({ error: { code: "SERVER_ERROR", message: "Update failed" } });
    }
  });

  // Categories
  app.get("/api/categories", authMiddleware, async (req: AuthRequest, res) => {
    const cats = await storage.getCategories(req.userId!);
    res.json(cats);
  });

  app.post("/api/categories", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory({
        userId: req.userId!,
        name: data.name,
        kind: data.kind,
        isDefault: false,
        archivedAt: null,
      });
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: error.errors[0].message } });
      }
      console.error("Category create error:", error);
      res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to create category" } });
    }
  });

  app.delete("/api/categories/:id", authMiddleware, async (req: AuthRequest, res) => {
    const categoryId = String(req.params.id);
    const category = await storage.getCategory(categoryId);
    if (!category || category.userId !== req.userId) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Category not found" } });
    }
    if (category.isDefault) {
      return res.status(400).json({ error: { code: "CANNOT_DELETE", message: "Cannot delete default category" } });
    }
    await storage.archiveCategory(categoryId);
    res.json({ success: true });
  });

  // Cycles
  app.get("/api/cycles", authMiddleware, async (req: AuthRequest, res) => {
    const userCycles = await storage.getCycles(req.userId!);
    res.json(userCycles);
  });

  app.get("/api/cycles/current", authMiddleware, async (req: AuthRequest, res) => {
    const cycle = await storage.getActiveCycle(req.userId!);
    if (!cycle) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "No active cycle" } });
    }
    res.json(cycle);
  });

  app.get("/api/cycles/:id", authMiddleware, async (req: AuthRequest, res) => {
    const cycleId = String(req.params.id);
    const cycle = await storage.getCycle(cycleId);
    if (!cycle || cycle.userId !== req.userId) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Cycle not found" } });
    }
    res.json(cycle);
  });

  app.post("/api/cycles", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertCycleSchema.parse(req.body);

      // Close any active cycle
      const activeCycle = await storage.getActiveCycle(req.userId!);
      if (activeCycle) {
        await storage.closeCycle(activeCycle.id);
      }

      const cycle = await storage.createCycle({
        userId: req.userId!,
        startDate: data.startDate,
        nextAllowanceDate: data.nextAllowanceDate,
        startingBalance: data.startingBalance,
        expectedNextAmount: data.expectedNextAmount || null,
        status: "active",
        closedAt: null,
      });

      res.json(cycle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: error.errors[0].message } });
      }
      console.error("Cycle create error:", error);
      res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to create cycle" } });
    }
  });

  // Transactions
  app.get("/api/transactions", authMiddleware, async (req: AuthRequest, res) => {
    const cycleId = req.query.cycleId as string | undefined;
    const txs = await storage.getTransactions(req.userId!, cycleId);
    res.json(txs);
  });

  app.post("/api/transactions", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertTransactionSchema.parse(req.body);

      const activeCycle = await storage.getActiveCycle(req.userId!);
      if (!activeCycle) {
        return res.status(400).json({ error: { code: "NO_CYCLE", message: "No active cycle. Please create a cycle first." } });
      }

      const category = await storage.getCategory(data.categoryId);
      if (!category || category.userId !== req.userId) {
        return res.status(400).json({ error: { code: "INVALID_CATEGORY", message: "Invalid category" } });
      }

      const tx = await storage.createTransaction({
        userId: req.userId!,
        cycleId: activeCycle.id,
        type: data.type,
        categoryId: data.categoryId,
        amount: data.amount,
        note: data.note || null,
        occurredAt: data.occurredAt ? new Date(data.occurredAt) : new Date(),
      });

      // Check for daily cap and critical balance alerts (async, don't block response)
      if (data.type === "expense") {
        (async () => {
          try {
            const userSettings = await storage.getSettings(req.userId!);
            const user = await storage.getUser(req.userId!);
            if (!user || !userSettings) return;

            // Check daily cap
            if (userSettings.dailyCapEnabled && userSettings.dailyCapAmount) {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const allTxs = await storage.getTransactions(req.userId!, activeCycle.id);
              const todaySpend = allTxs
                .filter(t => {
                  const txDate = new Date(t.occurredAt);
                  txDate.setHours(0, 0, 0, 0);
                  return t.type === "expense" && txDate.getTime() === today.getTime();
                })
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);

              const cap = parseFloat(userSettings.dailyCapAmount);
              if (todaySpend > cap) {
                // Send notification
                await storage.createNotification({
                  userId: req.userId!,
                  kind: "cap_exceeded",
                  title: "Daily Cap Exceeded",
                  message: `You've spent GH₵${todaySpend.toLocaleString()} today, exceeding your GH₵${cap.toLocaleString()} daily cap.`,
                  readAt: null,
                });
                // Send email if enabled
                if (userSettings.emailAlertsEnabled) {
                  await sendDailyCapAlert(user.email, todaySpend, cap);
                }
              }
            }

            // Check critical balance
            const allTxs = await storage.getTransactions(req.userId!, activeCycle.id);
            const totalIncome = allTxs.filter(t => t.type === "income").reduce((sum, t) => sum + parseFloat(t.amount), 0);
            const totalExpenses = allTxs.filter(t => t.type === "expense").reduce((sum, t) => sum + parseFloat(t.amount), 0);
            const currentBalance = parseFloat(activeCycle.startingBalance) + totalIncome - totalExpenses;
            const startingBalance = parseFloat(activeCycle.startingBalance);

            if (currentBalance > 0 && currentBalance < startingBalance * 0.2) {
              const today = new Date();
              const endDate = new Date(activeCycle.nextAllowanceDate);
              const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

              // Send notification
              await storage.createNotification({
                userId: req.userId!,
                kind: "critical",
                title: "Critical Balance Alert",
                message: `Your balance is critically low (GH₵${currentBalance.toLocaleString()}) with ${daysLeft} days until your next allowance.`,
                readAt: null,
              });
              // Send email if enabled
              if (userSettings?.emailAlertsEnabled) {
                await sendCriticalBalanceAlert(user.email, currentBalance, daysLeft);
              }
            }
          } catch (err) {
            console.error("Alert check error:", err);
          }
        })();
      }

      res.json(tx);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: error.errors[0].message } });
      }
      console.error("Transaction create error:", error);
      res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to create transaction" } });
    }
  });

  app.delete("/api/transactions/:id", authMiddleware, async (req: AuthRequest, res) => {
    const txId = String(req.params.id);
    const tx = await storage.getTransaction(txId);
    if (!tx || tx.userId !== req.userId) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Transaction not found" } });
    }
    await storage.deleteTransaction(txId);
    res.json({ success: true });
  });

  // Analytics
  app.get("/api/analytics/summary", authMiddleware, async (req: AuthRequest, res) => {
    const activeCycle = await storage.getActiveCycle(req.userId!);
    if (!activeCycle) {
      return res.status(404).json({ error: { code: "NO_CYCLE", message: "No active cycle" } });
    }

    const txs = await storage.getTransactions(req.userId!, activeCycle.id);
    const categories = await storage.getCategories(req.userId!);

    const totalIncome = txs
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalExpenses = txs
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const currentBalance = parseFloat(activeCycle.startingBalance) + totalIncome - totalExpenses;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(activeCycle.nextAllowanceDate);
    endDate.setHours(0, 0, 0, 0);
    const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    const safePerDay = daysLeft > 0 ? currentBalance / daysLeft : 0;

    // Calculate weekday/weekend averages
    const last14Days = txs.filter((t) => {
      const d = new Date(t.occurredAt);
      const daysAgo = (today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 14 && t.type === "expense";
    });

    const weekdaySpends: number[] = [];
    const weekendSpends: number[] = [];
    const dayTotals: Record<string, { weekday: number; weekend: number }> = {};

    last14Days.forEach((t) => {
      const d = new Date(t.occurredAt);
      const dateKey = d.toISOString().split("T")[0];
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;

      if (!dayTotals[dateKey]) {
        dayTotals[dateKey] = { weekday: 0, weekend: 0 };
      }
      if (isWeekend) {
        dayTotals[dateKey].weekend += parseFloat(t.amount);
      } else {
        dayTotals[dateKey].weekday += parseFloat(t.amount);
      }
    });

    Object.values(dayTotals).forEach((d) => {
      if (d.weekday > 0) weekdaySpends.push(d.weekday);
      if (d.weekend > 0) weekendSpends.push(d.weekend);
    });

    const avgWeekdaySpend = weekdaySpends.length > 0
      ? weekdaySpends.reduce((a, b) => a + b, 0) / weekdaySpends.length
      : 0;
    const avgWeekendSpend = weekendSpends.length > 0
      ? weekendSpends.reduce((a, b) => a + b, 0) / weekendSpends.length
      : 0;

    // Predict remaining spend
    let predictedSpend = 0;
    let tempBalance = currentBalance;
    let runoutDate: string | null = null;
    const tempDate = new Date(today);

    for (let i = 0; i < daysLeft && tempBalance > 0; i++) {
      tempDate.setDate(tempDate.getDate() + 1);
      const isWeekend = tempDate.getDay() === 0 || tempDate.getDay() === 6;
      const dailySpend = isWeekend ? avgWeekendSpend : avgWeekdaySpend;
      predictedSpend += dailySpend;
      tempBalance -= dailySpend;
      if (tempBalance <= 0 && !runoutDate) {
        runoutDate = tempDate.toISOString().split("T")[0];
      }
    }

    // Calculate status
    let status: "safe" | "tight" | "critical" = "safe";
    const balanceRatio = currentBalance / parseFloat(activeCycle.startingBalance);
    const timeRatio = daysLeft / Math.max(1, Math.ceil(
      (new Date(activeCycle.nextAllowanceDate).getTime() - new Date(activeCycle.startDate).getTime()) / (1000 * 60 * 60 * 24)
    ));

    if (balanceRatio < 0.2 || (runoutDate && new Date(runoutDate) < endDate)) {
      status = "critical";
    } else if (balanceRatio < timeRatio * 0.8) {
      status = "tight";
    }

    // Category totals
    const categoryTotals = categories
      .filter((c) => c.kind === "expense" || c.kind === "both")
      .map((cat) => ({
        categoryId: cat.id,
        categoryName: cat.name,
        total: txs
          .filter((t) => t.categoryId === cat.id && t.type === "expense")
          .reduce((sum, t) => sum + parseFloat(t.amount), 0)
          .toFixed(2),
      }))
      .filter((c) => parseFloat(c.total) > 0)
      .sort((a, b) => parseFloat(b.total) - parseFloat(a.total));

    res.json({
      currentBalance: currentBalance.toFixed(2),
      daysLeft,
      safePerDay: safePerDay.toFixed(2),
      avgWeekdaySpend: avgWeekdaySpend.toFixed(2),
      avgWeekendSpend: avgWeekendSpend.toFixed(2),
      predictedRemainingSpend: predictedSpend.toFixed(2),
      predictedRunoutDate: runoutDate,
      status,
      categoryTotals,
    });
  });

  app.get("/api/analytics/timeseries", authMiddleware, async (req: AuthRequest, res) => {
    const activeCycle = await storage.getActiveCycle(req.userId!);
    if (!activeCycle) {
      return res.status(404).json({ error: { code: "NO_CYCLE", message: "No active cycle" } });
    }

    const txs = await storage.getTransactions(req.userId!, activeCycle.id);

    const startDate = new Date(activeCycle.startDate);
    const endDate = new Date(activeCycle.nextAllowanceDate);
    const today = new Date();
    const effectiveEnd = today < endDate ? today : endDate;

    const dailyData: Record<string, { income: number; expense: number }> = {};

    for (let d = new Date(startDate); d <= effectiveEnd; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split("T")[0];
      dailyData[key] = { income: 0, expense: 0 };
    }

    txs.forEach((tx) => {
      const key = new Date(tx.occurredAt).toISOString().split("T")[0];
      if (dailyData[key]) {
        if (tx.type === "income") {
          dailyData[key].income += parseFloat(tx.amount);
        } else {
          dailyData[key].expense += parseFloat(tx.amount);
        }
      }
    });

    let runningBalance = parseFloat(activeCycle.startingBalance);
    const timeseries = Object.entries(dailyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => {
        runningBalance += data.income - data.expense;
        return {
          date,
          incomeTotal: data.income.toFixed(2),
          expenseTotal: data.expense.toFixed(2),
          balanceEndOfDay: runningBalance.toFixed(2),
        };
      });

    res.json(timeseries);
  });

  // Notifications
  app.get("/api/notifications", authMiddleware, async (req: AuthRequest, res) => {
    const notifs = await storage.getNotifications(req.userId!);
    res.json(notifs);
  });

  app.put("/api/notifications/:id/read", authMiddleware, async (req: AuthRequest, res) => {
    const notifId = String(req.params.id);
    await storage.markNotificationRead(notifId);
    res.json({ success: true });
  });

  // Export
  app.get("/api/export/csv", authMiddleware, async (req: AuthRequest, res) => {
    const cycleId = req.query.cycleId as string;
    if (!cycleId) {
      return res.status(400).json({ error: { code: "MISSING_CYCLE", message: "Cycle ID required" } });
    }

    const cycle = await storage.getCycle(cycleId);
    if (!cycle || cycle.userId !== req.userId) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Cycle not found" } });
    }

    const txs = await storage.getTransactions(req.userId!, cycleId);

    const header = "Date,Type,Category,Amount,Note\n";
    const rows = txs.map((tx) =>
      `${new Date(tx.occurredAt).toISOString()},${tx.type},${tx.category?.name || ""},${tx.amount},"${tx.note || ""}"`
    ).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=transactions-${cycleId}.csv`);
    res.send(header + rows);
  });

  app.get("/api/export/json", authMiddleware, async (req: AuthRequest, res) => {
    const cycleId = req.query.cycleId as string;
    if (!cycleId) {
      return res.status(400).json({ error: { code: "MISSING_CYCLE", message: "Cycle ID required" } });
    }

    const cycle = await storage.getCycle(cycleId);
    if (!cycle || cycle.userId !== req.userId) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Cycle not found" } });
    }

    const txs = await storage.getTransactions(req.userId!, cycleId);

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename=transactions-${cycleId}.json`);
    res.json({ cycle, transactions: txs });
  });

  return httpServer;
}
