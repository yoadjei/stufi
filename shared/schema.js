import { z } from "zod";

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
