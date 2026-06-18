import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createBudgetSchema } from "@/lib/validations";
import { withAuth, ok, created, badRequest, serverError, logAudit } from "@/lib/api-helpers";
import { Decimal } from "@prisma/client/runtime/library";
import { startOfMonth, endOfMonth } from "@/lib/utils";

function serialize(b: { id: string; userId: string; name: string; category: string; amount: Decimal; period: string; year: number; month: number | null; alertAt: number; color: string; createdAt: Date; updatedAt: Date }) {
  return { ...b, amount: Number(b.amount), createdAt: b.createdAt.toISOString(), updatedAt: b.updatedAt.toISOString() };
}

export const GET = withAuth(async (userId, req) => {
  const { searchParams } = new URL(req.url);
  const year  = searchParams.get("year")  ? Number(searchParams.get("year"))  : new Date().getFullYear();
  const month = searchParams.get("month") ? Number(searchParams.get("month")) : new Date().getMonth();

  const budgets = await prisma.budget.findMany({
    where: { userId, year, OR: [{ month }, { month: null }] },
    orderBy: { category: "asc" },
  });

  // Calculate spending for each budget
  const monthStart = startOfMonth(year, month);
  const monthEnd   = endOfMonth(year, month);

  const spendingByCategory = await prisma.transaction.groupBy({
    by:     ["category"],
    where:  { userId, type: "EXPENSE", date: { gte: monthStart, lte: monthEnd } },
    _sum:   { amount: true },
  });

  const spendMap: Record<string, number> = {};
  spendingByCategory.forEach((s) => { spendMap[s.category] = Number(s._sum.amount ?? 0); });

  const enriched = budgets.map((b) => {
    const spent     = spendMap[b.category] ?? 0;
    const amount    = Number(b.amount);
    const pct       = amount > 0 ? Math.round((spent / amount) * 100) : 0;
    return { ...serialize(b), spent, remaining: Math.max(amount - spent, 0), pct, isOverBudget: spent > amount, isAlert: pct >= b.alertAt };
  });

  return ok(enriched);
});

export const POST = withAuth(async (userId, req) => {
  try {
    const body   = await req.json();
    const parsed = createBudgetSchema.safeParse(body);
    if (!parsed.success) return badRequest("Geçersiz veri", parsed.error.flatten());

    // Enforce unique constraint gracefully
    const existing = await prisma.budget.findFirst({
      where: { userId, category: parsed.data.category, year: parsed.data.year, month: parsed.data.month ?? null },
    });
    if (existing) return badRequest("Bu dönem ve kategori için bütçe zaten mevcut");

    const budget = await prisma.budget.create({ data: { userId, ...parsed.data } });
    logAudit(userId, "CREATE_BUDGET", "Budget", budget.id);
    return created(serialize(budget));
  } catch (err) { return serverError(err); }
});
