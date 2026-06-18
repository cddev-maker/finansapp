/**
 * prisma/seed.ts
 * Run:  npm run db:seed
 *
 * Creates a demo user + 12 months of realistic Turkish financial data.
 */
import {
  PrismaClient,
  TransactionType,
  PaymentStatus,
  Category,
  CardNetwork,
  BudgetPeriod,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ─── helpers ─────────────────────────────────────────────────────────────────

const d = (year: number, month: number, day: number) =>
  new Date(year, month, day);

const rand = (min: number, max: number) =>
  Math.round(min + Math.random() * (max - min));

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱  Seeding FinansApp database…\n");

  // ── Wipe previous seed data ──────────────────────────────────────────────
  await prisma.auditLog.deleteMany();
  await prisma.cardStatement.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.creditCard.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // ── Demo user ────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("Demo1234!", 12);

  const user = await prisma.user.create({
    data: {
      email:    "demo@finansapp.dev",
      name:     "Ayşe Yılmaz",
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

  // ── Credit cards ─────────────────────────────────────────────────────────
  const cardGaranti = await prisma.creditCard.create({
    data: {
      userId:          user.id,
      name:            "Garanti Bonus",
      lastFourDigits:  "4532",
      network:         CardNetwork.VISA,
      creditLimit:     50000,
      currentBalance:  8350,
      statementDate:   15,
      dueDate:         3,
      color:           "#10b981",
    },
  });

  const cardAkbank = await prisma.creditCard.create({
    data: {
      userId:          user.id,
      name:            "Akbank Axess",
      lastFourDigits:  "7891",
      network:         CardNetwork.MASTERCARD,
      creditLimit:     30000,
      currentBalance:  3200,
      statementDate:   20,
      dueDate:         8,
      color:           "#ef4444",
    },
  });

  console.log(`   ✔  2 credit cards created`);

  // ── Transactions — last 12 months ─────────────────────────────────────────
  const now   = new Date();
  const txRows = [];

  for (let m = 11; m >= 0; m--) {
    const yr  = now.getMonth() - m < 0 ? now.getFullYear() - 1 : now.getFullYear();
    const mo  = ((now.getMonth() - m) + 12) % 12;

    txRows.push(
      // ── Income ────────────────────────────────────────────────────────────
      { userId: user.id, date: d(yr, mo, 1),  description: "Aylık Maaş",          category: Category.SALARY,        amount: 52000,         type: TransactionType.INCOME },
      { userId: user.id, date: d(yr, mo, 15), description: "Freelance Danışmanlık", category: Category.OTHER,         amount: rand(4000,9000),type: TransactionType.INCOME },
      { userId: user.id, date: d(yr, mo, 28), description: "Kira Geliri",           category: Category.RENT,          amount: 8500,           type: TransactionType.INCOME },

      // ── Housing ───────────────────────────────────────────────────────────
      { userId: user.id, date: d(yr, mo, 5),  description: "Kira Ödemesi",          category: Category.RENT,          amount: 14000,          type: TransactionType.EXPENSE },
      { userId: user.id, date: d(yr, mo, 10), description: "Elektrik Faturası",     category: Category.UTILITIES,     amount: rand(700,1500), type: TransactionType.EXPENSE },
      { userId: user.id, date: d(yr, mo, 11), description: "Doğalgaz",              category: Category.UTILITIES,     amount: rand(400,900),  type: TransactionType.EXPENSE },
      { userId: user.id, date: d(yr, mo, 12), description: "Su Faturası",           category: Category.UTILITIES,     amount: rand(200,450),  type: TransactionType.EXPENSE },
      { userId: user.id, date: d(yr, mo, 13), description: "İnternet",              category: Category.UTILITIES,     amount: 450,            type: TransactionType.EXPENSE },

      // ── Food & Transport ──────────────────────────────────────────────────
      { userId: user.id, date: d(yr, mo, 7),  description: "Market Alışverişi",     category: Category.GROCERIES,     amount: rand(2200,3500),type: TransactionType.EXPENSE },
      { userId: user.id, date: d(yr, mo, 18), description: "Market Alışverişi",     category: Category.GROCERIES,     amount: rand(1500,2500),type: TransactionType.EXPENSE },
      { userId: user.id, date: d(yr, mo, 22), description: "Restoran & Kafe",       category: Category.ENTERTAINMENT, amount: rand(500,1200), type: TransactionType.EXPENSE },
      { userId: user.id, date: d(yr, mo, 14), description: "Yakıt",                 category: Category.FUEL,          amount: rand(1800,3000),type: TransactionType.EXPENSE },

      // ── Health, Education, Entertainment ─────────────────────────────────
      { userId: user.id, date: d(yr, mo, 20), description: "Sağlık Sigortası",      category: Category.HEALTHCARE,    amount: 1800,           type: TransactionType.EXPENSE, creditCardId: cardGaranti.id },
      { userId: user.id, date: d(yr, mo, 15), description: "Netflix & Spotify",     category: Category.ENTERTAINMENT, amount: 350,            type: TransactionType.EXPENSE, creditCardId: cardGaranti.id },
      { userId: user.id, date: d(yr, mo, 3),  description: "Kredi Kartı Ödemesi (Garanti)", category: Category.CREDIT_CARD, amount: 8350,   type: TransactionType.EXPENSE },
      { userId: user.id, date: d(yr, mo, 8),  description: "Kredi Kartı Ödemesi (Akbank)",  category: Category.CREDIT_CARD, amount: 3200,   type: TransactionType.EXPENSE },
    );
  }

  await prisma.transaction.createMany({ data: txRows });
  console.log(`   ✔  ${txRows.length} transactions created`);

  // ── Card statements ───────────────────────────────────────────────────────
  for (let m = 2; m >= 0; m--) {
    const yr  = now.getMonth() - m < 0 ? now.getFullYear() - 1 : now.getFullYear();
    const mo  = ((now.getMonth() - m) + 12) % 12;

    await prisma.cardStatement.createMany({
      data: [
        {
          creditCardId:    cardGaranti.id,
          periodStart:     d(yr, mo - 1 < 0 ? mo + 11 : mo - 1, 16),
          periodEnd:       d(yr, mo, 15),
          statementAmount: rand(6000, 12000),
          minimumPayment:  rand(600, 1200),
          dueDate:         d(yr, mo < 11 ? mo + 1 : 0, 3),
          isPaid:          m > 0,
        },
        {
          creditCardId:    cardAkbank.id,
          periodStart:     d(yr, mo - 1 < 0 ? mo + 11 : mo - 1, 21),
          periodEnd:       d(yr, mo, 20),
          statementAmount: rand(2000, 6000),
          minimumPayment:  rand(200, 600),
          dueDate:         d(yr, mo < 11 ? mo + 1 : 0, 8),
          isPaid:          m > 0,
        },
      ],
    });
  }

  console.log(`   ✔  6 card statements created`);

  // ── Scheduled payments ────────────────────────────────────────────────────
  const y  = now.getFullYear();
  const mo = now.getMonth();

  await prisma.payment.createMany({
    data: [
      { userId: user.id, name: "Ev Kirası",           description: "Aylık kira",              amount: 14000, dueDate: d(y, mo, 5),  startDate: d(2024, 0, 5),  category: Category.RENT,          status: PaymentStatus.PENDING,   completed: false },
      { userId: user.id, name: "İnternet",            description: "Fiber 1 Gbps",            amount: 450,   dueDate: d(y, mo, 10), startDate: d(2024, 0, 10), category: Category.UTILITIES,     status: PaymentStatus.PAID,      completed: true, completedAt: new Date() },
      { userId: user.id, name: "Spor Salonu",         description: "Aylık üyelik",            amount: 900,   dueDate: d(y, mo, 1),  startDate: d(2024, 0, 1),  category: Category.HEALTHCARE,    status: PaymentStatus.OVERDUE,   completed: false },
      { userId: user.id, name: "Netflix",             description: "Premium plan",            amount: 189,   dueDate: d(y, mo, 15), startDate: d(2023, 5, 15), endDate: d(2026, 5, 15), category: Category.ENTERTAINMENT, status: PaymentStatus.PENDING, completed: false },
      { userId: user.id, name: "Araç Sigortası",      description: "Yıllık kasko + trafik",  amount: 12500, dueDate: d(y, mo, 20), startDate: d(2024, 2, 20), endDate: d(2025, 2, 20), category: Category.OTHER, status: PaymentStatus.PENDING, completed: false },
      { userId: user.id, name: "Garanti Kredi Kartı", description: "Minimum ödeme",          amount: 835,   dueDate: d(y, mo, 3),  startDate: d(2022, 0, 3),  category: Category.CREDIT_CARD,   status: PaymentStatus.PAID,      completed: true, completedAt: new Date() },
      { userId: user.id, name: "Akbank Axess",        description: "Minimum ödeme",          amount: 320,   dueDate: d(y, mo, 8),  startDate: d(2022, 0, 8),  category: Category.CREDIT_CARD,   status: PaymentStatus.PENDING,   completed: false },
      { userId: user.id, name: "BES (Emeklilik)",     description: "Bireysel emeklilik",     amount: 2500,  dueDate: d(y, mo, 2),  startDate: d(2021, 0, 2),  endDate: d(2045, 0, 2),  category: Category.INVESTMENT,    status: PaymentStatus.PAID,      completed: true, completedAt: new Date() },
      { userId: user.id, name: "Çocuk Okul Ücreti",  description: "Aylık taksit",           amount: 3500,  dueDate: d(y, mo, 25), startDate: d(2024, 8, 1),  endDate: d(2025, 5, 30), category: Category.EDUCATION,     status: PaymentStatus.PENDING,   completed: false },
    ],
  });

  console.log(`   ✔  9 scheduled payments created`);

  // ── Budgets ───────────────────────────────────────────────────────────────
  const budgetYear  = now.getFullYear();
  const budgetMonth = now.getMonth();

  await prisma.budget.createMany({
    data: [
      { userId: user.id, name: "Kira Bütçesi",    category: Category.RENT,          amount: 14000, period: BudgetPeriod.MONTHLY, year: budgetYear, month: budgetMonth, alertAt: 90, color: "#ef4444" },
      { userId: user.id, name: "Market",           category: Category.GROCERIES,     amount: 6000,  period: BudgetPeriod.MONTHLY, year: budgetYear, month: budgetMonth, alertAt: 80, color: "#f59e0b" },
      { userId: user.id, name: "Faturalar",        category: Category.UTILITIES,     amount: 2500,  period: BudgetPeriod.MONTHLY, year: budgetYear, month: budgetMonth, alertAt: 80, color: "#3b82f6" },
      { userId: user.id, name: "Yakıt",            category: Category.FUEL,          amount: 3000,  period: BudgetPeriod.MONTHLY, year: budgetYear, month: budgetMonth, alertAt: 80, color: "#f97316" },
      { userId: user.id, name: "Eğlence",          category: Category.ENTERTAINMENT, amount: 2000,  period: BudgetPeriod.MONTHLY, year: budgetYear, month: budgetMonth, alertAt: 75, color: "#8b5cf6" },
      { userId: user.id, name: "Sağlık",           category: Category.HEALTHCARE,    amount: 3000,  period: BudgetPeriod.MONTHLY, year: budgetYear, month: budgetMonth, alertAt: 85, color: "#10b981" },
      { userId: user.id, name: "Eğitim",           category: Category.EDUCATION,     amount: 4000,  period: BudgetPeriod.MONTHLY, year: budgetYear, month: budgetMonth, alertAt: 80, color: "#06b6d4" },
      { userId: user.id, name: "Yıllık Birikim",   category: Category.INVESTMENT,    amount: 60000, period: BudgetPeriod.YEARLY,  year: budgetYear, month: null, alertAt: 0, color: "#6366f1" },
    ],
  });

  console.log(`   ✔  8 budgets created`);

  // ── Audit log entries ─────────────────────────────────────────────────────
  await prisma.auditLog.createMany({
    data: [
      { userId: user.id, action: "USER_REGISTER",   entityType: "User",        entityId: user.id, metadata: { email: user.email } },
      { userId: user.id, action: "CREATE_CARD",     entityType: "CreditCard",  entityId: cardGaranti.id },
      { userId: user.id, action: "CREATE_CARD",     entityType: "CreditCard",  entityId: cardAkbank.id  },
    ],
  });

  console.log(`   ✔  Audit log entries created`);
  console.log(`\n✅  Seed complete!`);
  console.log(`\n   Login with: demo@finansapp.dev / Demo1234!`);
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
