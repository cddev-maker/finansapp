import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, badRequest, serverError } from "@/lib/api-helpers";

// GET /api/backup — export full account data as JSON
export const GET = withAuth(async (userId) => {
  const [transactions, payments, creditCards, budgets, settings] = await Promise.all([
    prisma.transaction.findMany({ where: { userId }, orderBy: { date: "desc" } }),
    prisma.payment.findMany({ where: { userId }, orderBy: { dueDate: "asc" } }),
    prisma.creditCard.findMany({ where: { userId } }),
    prisma.budget.findMany({ where: { userId } }),
    prisma.userSettings.findUnique({ where: { userId } }),
  ]);

  const backup = {
    exportedAt:   new Date().toISOString(),
    version:      "2.0",
    userId,
    settings,
    transactions: transactions.map((t) => ({ ...t, amount: Number(t.amount), date: t.date.toISOString().split("T")[0] })),
    payments:     payments.map((p) => ({ ...p, amount: Number(p.amount), dueDate: p.dueDate.toISOString().split("T")[0], startDate: p.startDate.toISOString().split("T")[0], endDate: p.endDate?.toISOString().split("T")[0] ?? null })),
    creditCards:  creditCards.map((c) => ({ ...c, creditLimit: Number(c.creditLimit), currentBalance: Number(c.currentBalance) })),
    budgets:      budgets.map((b) => ({ ...b, amount: Number(b.amount) })),
  };

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type":        "application/json",
      "Content-Disposition": `attachment; filename="finansapp-backup-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
});

// POST /api/backup — restore from backup JSON
export const POST = withAuth(async (userId, req) => {
  try {
    const body = await req.json();
    if (body.version !== "2.0") return badRequest("Desteklenmeyen yedek formatı");

    let txCount = 0, payCount = 0;

    if (Array.isArray(body.transactions)) {
      for (const tx of body.transactions) {
        await prisma.transaction.upsert({
          where: { id: tx.id },
          create: { ...tx, id: undefined, userId, date: new Date(tx.date), amount: tx.amount },
          update: { description: tx.description, amount: tx.amount, category: tx.category },
        }).catch(() => {}); // skip conflicts
        txCount++;
      }
    }

    if (Array.isArray(body.payments)) {
      for (const p of body.payments) {
        await prisma.payment.upsert({
          where: { id: p.id },
          create: { ...p, id: undefined, userId, dueDate: new Date(p.dueDate), startDate: new Date(p.startDate), endDate: p.endDate ? new Date(p.endDate) : null },
          update: { name: p.name, amount: p.amount, status: p.status },
        }).catch(() => {});
        payCount++;
      }
    }

    return ok({ message: `Yedek geri yüklendi: ${txCount} işlem, ${payCount} ödeme` });
  } catch (err) { return serverError(err); }
});
