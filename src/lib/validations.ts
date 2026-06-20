import { z } from "zod";

const categoryEnum = z.enum([
  "SALARY","RENT","GROCERIES","UTILITIES","FUEL","CREDIT_CARD",
  "EDUCATION","HEALTHCARE","ENTERTAINMENT","INVESTMENT","TRANSFER",
  "VEHICLE_MAINTENANCE","BUILDING_DUES","DEBT","EXPENSE_PAYMENT","LOAN_PAYMENT","OTHER",
]);

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli tarih girin (YYYY-MM-DD)");

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  name:            z.string().min(2, "Ad en az 2 karakter olmalı").max(100),
  email:           z.string().email("Geçerli e-posta girin"),
  password:        z.string()
    .min(8, "Şifre en az 8 karakter olmalı")
    .regex(/[A-Z]/, "En az bir büyük harf içermeli")
    .regex(/[0-9]/, "En az bir rakam içermeli"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Şifreler eşleşmiyor",
  path:    ["confirmPassword"],
});

export const loginSchema = z.object({
  email:    z.string().email("Geçerli e-posta girin"),
  password: z.string().min(1, "Şifre gerekli"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Geçerli e-posta girin"),
});

export const resetPasswordSchema = z.object({
  password:        z.string().min(8, "Şifre en az 8 karakter olmalı").regex(/[A-Z]/).regex(/[0-9]/),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Şifreler eşleşmiyor",
  path:    ["confirmPassword"],
});

// ─── Transaction ──────────────────────────────────────────────────────────────

export const createTransactionSchema = z.object({
  date:         isoDate,
  description:  z.string().min(1, "Açıklama gerekli").max(200),
  category:     categoryEnum,
  amount:       z.number().positive("Tutar sıfırdan büyük olmalı"),
  type:         z.enum(["INCOME", "EXPENSE"]),
  notes:        z.string().max(500).optional(),
  creditCardId: z.string().optional().nullable(),
});

export const updateTransactionSchema = createTransactionSchema.partial().extend({
  id: z.string().cuid(),
});

export type CreateTransactionSchema = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionSchema = z.infer<typeof updateTransactionSchema>;

// ─── Payment ──────────────────────────────────────────────────────────────────

export const createPaymentSchema = z.object({
  name:        z.string().min(1, "Ad gerekli").max(100),
  description: z.string().max(300).optional(),
  amount:      z.number().positive("Tutar sıfırdan büyük olmalı"),
  dueDate:     isoDate,
  startDate:   isoDate,
 endDate: z.union([isoDate, z.literal(""), z.null()]).optional(),
  category:    categoryEnum,
  status:      z.enum(["PENDING","PAID","OVERDUE","CANCELLED"]).optional(),
  notes:       z.string().max(500).optional(),
});

export const updatePaymentSchema = createPaymentSchema.partial().extend({
  id:          z.string().cuid(),
  completed:   z.boolean().optional(),
  completedAt: z.string().optional().nullable(),
});

export type CreatePaymentSchema = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentSchema = z.infer<typeof updatePaymentSchema>;

// ─── Credit Card ──────────────────────────────────────────────────────────────

export const createCreditCardSchema = z.object({
  name:           z.string().min(1, "Kart adı gerekli").max(100),
  lastFourDigits: z.string().length(4, "4 hane girin").regex(/^\d{4}$/, "Sadece rakam"),
  network:        z.enum(["VISA","MASTERCARD","AMEX","TROY","OTHER"]),
  creditLimit:    z.number().positive("Limit sıfırdan büyük olmalı"),
  currentBalance: z.number().min(0),
  statementDate:  z.number().int().min(1).max(31),
  dueDate:        z.number().int().min(1).max(31),
  color:          z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#6366f1"),
});

export const updateCreditCardSchema = createCreditCardSchema.partial().extend({
  id: z.string().cuid(),
});

export type CreateCreditCardSchema = z.infer<typeof createCreditCardSchema>;
export type UpdateCreditCardSchema = z.infer<typeof updateCreditCardSchema>;

// ─── Budget ───────────────────────────────────────────────────────────────────

export const createBudgetSchema = z.object({
  name:     z.string().min(1, "Ad gerekli").max(100),
  category: categoryEnum,
  amount:   z.number().positive("Bütçe sıfırdan büyük olmalı"),
  period:   z.enum(["MONTHLY", "YEARLY"]),
  year:     z.number().int().min(2020).max(2100),
  month:    z.number().int().min(0).max(11).optional().nullable(),
  alertAt:  z.number().int().min(0).max(100).default(80),
  color:    z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#6366f1"),
});

export const updateBudgetSchema = createBudgetSchema.partial().extend({
  id: z.string().cuid(),
});

export type CreateBudgetSchema = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetSchema = z.infer<typeof updateBudgetSchema>;

// ─── User settings ────────────────────────────────────────────────────────────

export const updateSettingsSchema = z.object({
  name:               z.string().min(2).max(100).optional(),
  currency:           z.string().optional(),
  darkMode:           z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  reminderDaysBefore: z.number().int().min(0).max(30).optional(),
});

export type UpdateSettingsSchema = z.infer<typeof updateSettingsSchema>;
