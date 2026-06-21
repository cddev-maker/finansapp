/**
 * prisma/seed.ts
 * Run:  npm run db:seed
 *
 * Creates/refreshes ONLY the demo user (demo@finansapp.dev).
 * This script never touches any other user's account or data.
 */
import {
  PrismaClient,
  TransactionType,
  PaymentStatus,
  Category,
  BudgetPeriod,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ─── helpers ─────────────────────────────────────────────────────────────────

const d = (year: number, month: number, day: number) =>
  new Date(year, month, day);

const rand = (min: number, max: number) =>
  Math.round(min + Math.random() * (max - min));

const DEMO_EMAIL = "demo@finansapp.dev";

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱  Seeding FinansApp demo account…\n");

  // ── Wipe previous DEMO data only (never touches other users) ────────────
  const existingDemo = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    select: { id: true },
  });

  if (existingDemo) {
    const demoUserId = existingDemo.id;
    await prisma.auditLog.deleteMany({ where: { userId: demoUserId } });
    await prisma.cardStatement.deleteMany({ where: { creditCard: { userId: demoUserId } } });
    await prisma.budget.deleteMany({ where: { userId: demoUserId } });
    await prisma.transaction.deleteMany({ where: { userId: demoUserId } });
    await prisma.payment.deleteMany({ where: { userId: demoUserId } });
    await prisma.creditCard.deleteMany({ where: { userId: demoUserId } });
    await prisma.userSettings.deleteMany({ where: { userId: demoUserId } });
    await prisma.session.deleteMany({ where: { userId: demoUserId } });
    await prisma.account.deleteMany({ where: { userId: demoUserId } });
    await prisma.user.delete({ where: { id: demoUserId } });
    console.log("   ↻  Önceki demo verisi temizlendi (diğer kullanıcılara dokunulmadı)");
  }

  // ── Demo user ────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("Demo1234!", 12);

  const user = await prisma.user.create({
    data: {
      email:    DEMO_EMAIL,
      name:     "Lara Demirel",
      password: passwordHash,
      role:     "USER",
      settings: {
        create: {
          currency:           "TRY",
          locale:             "tr-TR",
          darkMode:           false,
          emailNotifications: true,
          reminderDaysBefore: 3,
        },
      },
    },
  });

  console.log(`   ✔  User: ${user.email}  (password: Demo1234!)`);

  // ── Transactions — last 12 months ─────────────────────────────────────────
  const now    = new Date();
  const txRows = [];

  for (let m = 11; m >= 0; m--) {
    const yr = now.getMonth() - m < 0 ? now.getFullYear() - 1 : now.getFullYear();
    const mo = ((now.getMonth() - m) + 12) % 12;

    txRows.push(
      // ── Income ────────────────────────────────────────────────────────────
      { userId: user.id, date: d(yr, mo, 1),  description: "Aylık Maaş",           category: Category.SALARY,        amount: 52000,            type: TransactionType.INCOME },
      { userId: user.id, date: d(yr, mo, 15), description: "Freelance Danışmanlık", category: Category.OTHER,         amount: rand(4000, 9000), type: TransactionType.INCOME },
      { userId: user.id, date: d(yr, mo, 28), description: "Kira Geliri",           category: Category.RENT,          amount: 8500,             type: TransactionType.INCOME },

      // ── Housing ───────────────────────────────────────────────────────────
      { userId: user.id, date: d(yr, mo, 5),  description: "Ev Kirası",             category: Category.RENT,          amount: 14000,             type: TransactionType.EXPENSE },
      { userId: user.id, date: d(yr, mo, 10), description: "Elektrik Faturası",    category: Category.UTILITIES,     amount: rand(700, 1500),  type: TransactionType.EXPENSE },
      { userId: user.id, date: d(yr, mo, 11), description: "Doğalgaz",             category: Category.UTILITIES,     amount: rand(400, 900),   type: TransactionType.EXPENSE },
      { userId: user.id, date: d(yr, mo, 12), description: "Su Faturası",          category: Category.UTILITIES,     amount: rand(200, 450),   type: TransactionType.EXPENSE },
      { userId: user.id, date: d(yr, mo, 13), description: "İnternet",             category: Category.UTILITIES,     amount: 450,              type: TransactionType.EXPENSE },

      // ── Food & Transport ──────────────────────────────────────────────────
      { userId: user.id, date: d(yr, mo, 7),  description: "Market Alışverişi",    category: Category.GROCERIES,     amount: rand(2200, 3500), type: TransactionType.EXPENSE },
      { userId: user.id, date: d(yr, mo, 18), description: "Market Alışverişi",    category: Category.GROCERIES,     amount: rand(1500, 2500), type: TransactionType.EXPENSE },
      { userId: user.id, date: d(yr, mo, 22), description: "Restoran & Kafe",      category: Category.ENTERTAINMENT, amount: rand(500, 1200),  type: TransactionType.EXPENSE },
      { userId: user.id, date: d(yr, mo, 14), description: "Yakıt",                category: Category.FUEL,          amount: rand(1800, 3000), type: TransactionType.EXPENSE },

      // ── Health & Entertainment ────────────────────────────────────────────
      { userId: user.id, date: d(yr, mo, 20), description: "Sağlık Sigortası",     category: Category.HEALTHCARE,    amount: 1800,             type: TransactionType.EXPENSE },
      { userId: user.id, date: d(yr, mo, 15), description: "Netflix & Spotify",    category: Category.ENTERTAINMENT, amount: 350,              type: TransactionType.EXPENSE, bankName: "GARANTI" },

      // ── Credit card payments (bank info on transaction only) ─────────────
      { userId: user.id, date: d(yr, mo, 3),  description: "Kredi Kartı Ödemesi (Garanti Bonus)",   category: Category.CREDIT_CARD, amount: rand(2500, 8500), type: TransactionType.EXPENSE, bankName: "GARANTI" },
      { userId: user.id, date: d(yr, mo, 8),  description: "Kredi Kartı Ödemesi (Akbank Axess)",    category: Category.CREDIT_CARD, amount: rand(1000, 4500), type: TransactionType.EXPENSE, bankName: "AKBANK" },
      { userId: user.id, date: d(yr, mo, 28), description: "Kredi Kartı Ödemesi (Yapı Kredi World)", category: Category.CREDIT_CARD, amount: rand(1500, 5400), type: TransactionType.EXPENSE, bankName: "YAPI_KREDI" },
    );
  }

  await prisma.transaction.createMany({ data: txRows });
  console.log(`   ✔  ${txRows.length} transactions created`);

  // ── Scheduled payments — 12-month recurring series + one-off items ──────
  const y     = now.getFullYear();
  const mo0   = now.getMonth();
  const seriesRent    = `series_rent_${Date.now()}`;
  const seriesGaranti = `series_garanti_${Date.now()}`;
  const seriesAkbank  = `series_akbank_${Date.now()}`;
  const seriesYapi    = `series_yapikredi_${Date.now()}`;

  const paymentRows = [];

  for (let i = -2; i < 10; i++) {
    const payMonth = ((mo0 + i) % 12 + 12) % 12;
    const payYear  = y + Math.floor((mo0 + i) / 12) - (mo0 + i < 0 ? 1 : 0);
    const isPast   = i < 0;

    paymentRows.push(
      // Ev kirası — sabit tutar, sonsuz tekrarlayan seri
      {
        userId: user.id, name: "Ev Kirası", description: "Aylık kira ödemesi",
        amount: 14000, dueDate: d(payYear, payMonth, 5), startDate: d(payYear, payMonth, 5),
        category: Category.RENT,
        status: isPast ? PaymentStatus.PAID : PaymentStatus.PENDING,
        completed: isPast, completedAt: isPast ? d(payYear, payMonth, 5) : null,
        seriesId: seriesRent,
      },
      // Garanti Bonus kredi kartı — değişken tutar
      {
        userId: user.id, name: "Garanti Bonus Ödemesi", description: "Kredi kartı ekstre ödemesi",
        amount: rand(2500, 8500), dueDate: d(payYear, payMonth, 3), startDate: d(payYear, payMonth, 3),
        category: Category.CREDIT_CARD,
        status: isPast ? PaymentStatus.PAID : PaymentStatus.PENDING,
        completed: isPast, completedAt: isPast ? d(payYear, payMonth, 3) : null,
        seriesId: seriesGaranti, bankName: "GARANTI",
      },
      // Akbank Axess kredi kartı
      {
        userId: user.id, name: "Akbank Axess Ödemesi", description: "Kredi kartı ekstre ödemesi",
        amount: rand(1000, 4500), dueDate: d(payYear, payMonth, 8), startDate: d(payYear, payMonth, 8),
        category: Category.CREDIT_CARD,
        status: isPast ? PaymentStatus.PAID : PaymentStatus.PENDING,
        completed: isPast, completedAt: isPast ? d(payYear, payMonth, 8) : null,
        seriesId: seriesAkbank, bankName: "AKBANK",
      },
      // Yapı Kredi World kredi kartı
      {
        userId: user.id, name: "Yapı Kredi World Ödemesi", description: "Kredi kartı ekstre ödemesi",
        amount: rand(1500, 5400), dueDate: d(payYear, payMonth, 28), startDate: d(payYear, payMonth, 28),
        category: Category.CREDIT_CARD,
        status: isPast ? PaymentStatus.PAID : PaymentStatus.PENDING,
        completed: isPast, completedAt: isPast ? d(payYear, payMonth, 28) : null,
        seriesId: seriesYapi, bankName: "YAPI_KREDI",
      },
    );
  }

  // ── One-off / shorter payments ────────────────────────────────────────────
  paymentRows.push(
    { userId: user.id, name: "İnternet",          description: "Fiber 1 Gbps",          amount: 450,   dueDate: d(y, mo0, 10), startDate: d(2024, 0, 10), category: Category.UTILITIES,     status: PaymentStatus.PAID,    completed: true, completedAt: new Date() },
    { userId: user.id, name: "Spor Salonu",       description: "Aylık üyelik",          amount: 900,   dueDate: d(y, mo0, 1),  startDate: d(2024, 0, 1),  category: Category.HEALTHCARE,    status: PaymentStatus.OVERDUE, completed: false },
    { userId: user.id, name: "Netflix",           description: "Premium plan",          amount: 189,   dueDate: d(y, mo0, 15), startDate: d(2023, 5, 15), endDate: d(2026, 5, 15), category: Category.ENTERTAINMENT, status: PaymentStatus.PENDING, completed: false },
    { userId: user.id, name: "Araç Sigortası",    description: "Yıllık kasko + trafik", amount: 12500, dueDate: d(y, mo0, 20), startDate: d(2024, 2, 20), endDate: d(2025, 2, 20), category: Category.OTHER, status: PaymentStatus.PENDING, completed: false },
    { userId: user.id, name: "BES (Emeklilik)",   description: "Bireysel emeklilik",    amount: 2500,  dueDate: d(y, mo0, 2),  startDate: d(2021, 0, 2),  endDate: d(2045, 0, 2),  category: Category.INVESTMENT,    status: PaymentStatus.PAID,    completed: true, completedAt: new Date() },
    { userId: user.id, name: "Çocuk Okul Ücreti", description: "Aylık taksit",          amount: 3500,  dueDate: d(y, mo0, 25), startDate: d(2024, 8, 1),  endDate: d(2025, 5, 30), category: Category.EDUCATION,     status: PaymentStatus.PENDING, completed: false },
  );

  await prisma.payment.createMany({ data: paymentRows });
  console.log(`   ✔  ${paymentRows.length} scheduled payments created (incl. 4 recurring 12-month series)`);

  // ── Budgets ───────────────────────────────────────────────────────────────
  const budgetYear  = now.getFullYear();
  const budgetMonth = now.getMonth();

  await prisma.budget.createMany({
    data: [
      { userId: user.id, name: "Kira Bütçesi",       category: Category.RENT,          amount: 14000, period: BudgetPeriod.MONTHLY, year: budgetYear, month: budgetMonth, alertAt: 90, color: "#ef4444" },
      { userId: user.id, name: "Market",              category: Category.GROCERIES,     amount: 6000,  period: BudgetPeriod.MONTHLY, year: budgetYear, month: budgetMonth, alertAt: 80, color: "#f59e0b" },
      { userId: user.id, name: "Faturalar",           category: Category.UTILITIES,     amount: 2500,  period: BudgetPeriod.MONTHLY, year: budgetYear, month: budgetMonth, alertAt: 80, color: "#3b82f6" },
      { userId: user.id, name: "Yakıt",               category: Category.FUEL,          amount: 3000,  period: BudgetPeriod.MONTHLY, year: budgetYear, month: budgetMonth, alertAt: 80, color: "#f97316" },
      { userId: user.id, name: "Eğlence",             category: Category.ENTERTAINMENT, amount: 2000,  period: BudgetPeriod.MONTHLY, year: budgetYear, month: budgetMonth, alertAt: 75, color: "#8b5cf6" },
      { userId: user.id, name: "Sağlık",              category: Category.HEALTHCARE,    amount: 3000,  period: BudgetPeriod.MONTHLY, year: budgetYear, month: budgetMonth, alertAt: 85, color: "#10b981" },
      { userId: user.id, name: "Eğitim",              category: Category.EDUCATION,     amount: 4000,  period: BudgetPeriod.MONTHLY, year: budgetYear, month: budgetMonth, alertAt: 80, color: "#06b6d4" },
      { userId: user.id, name: "Kredi Kartı Bütçesi", category: Category.CREDIT_CARD,   amount: 15000, period: BudgetPeriod.MONTHLY, year: budgetYear, month: budgetMonth, alertAt: 85, color: "#ec4899" },
      { userId: user.id, name: "Yıllık Birikim",      category: Category.INVESTMENT,    amount: 60000, period: BudgetPeriod.YEARLY,  year: budgetYear, month: null, alertAt: 0, color: "#6366f1" },
    ],
  });

  console.log(`   ✔  9 budgets created`);

  // ── Audit log ──────────────────────────────────────────────────────────────
  await prisma.auditLog.create({
    data: { userId: user.id, action: "USER_REGISTER", entityType: "User", entityId: user.id, metadata: { email: user.email } },
  });

  console.log(`   ✔  Audit log entry created`);
  console.log(`\n✅  Seed complete!`);
  console.log(`\n   Login with: demo@finansapp.dev / Demo1234!`);
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
