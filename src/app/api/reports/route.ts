import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, serverError } from "@/lib/api-helpers";
import { buildMonthlyData, buildCategoryBreakdown, buildBalanceTrend, buildForecast, startOfMonth, endOfMonth, daysUntil } from "@/lib/utils";
import type { Transaction, Payment } from "@/types";
import { Decimal } from "@prisma/client/runtime/library";

function txSerialize(t: { id: string; userId: string; date: Date; description: string; category: string; amount: Decimal; type: string; notes: string | null; creditCardId: string | null; createdAt: Date; updatedAt: Date }): Transaction {
  return { ...t, date: t.date.toISOString().split("T")[0], amount: Number(t.amount), type: t.type as Transaction["type"], category: t.category as Transaction["category"], createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() };
}

function pSerialize(p: { id: string; userId: string; name: string; description: string | null; amount: Decimal; dueDate: Date; startDate: Date; endDate: Date | null; category: string; status: string; completed: boolean; completedAt: Date | null; reminderSentAt: Date | null; notes: string | null; createdAt: Date; updatedAt: Date }): Payment {
  return { ...p, amount: Number(p.amount), dueDate: p.dueDate.toISOString().split("T")[0], startDate: p.startDate.toISOString().split("T")[0], endDate: p.endDate ? p.endDate.toISOString().split("T")[0] : null, completedAt: p.completedAt?.toISOString() ?? null, reminderSentAt: p.reminderSentAt?.toISOString() ?? null, status: p.status as Payment["status"], category: p.category as Payment["category"], createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString() };
}

export const GET = withAuth(async (userId, req) => {
  try {
    const { searchParams } = new URL(req.url);
    const type  = searchParams.get("type") ?? "dashboard";
    const year  = Number(searchParams.get("year")  || new Date().getFullYear());
    const month = Number(searchParams.get("month") ?? new Date().getMonth());

    const [rawTx, rawPayments] = await Promise.all([
      prisma.transaction.findMany({ where: { userId }, orderBy: { date: "asc" } }),
      prisma.payment.findMany({ where: { userId } }),
    ]);

    const transactions = rawTx.map(txSerialize);
    const payments     = rawPayments.map(pSerialize);

    if (type === "forecast") return ok(buildForecast(transactions, payments));
    if (type === "category") return ok({ income: buildCategoryBreakdown(transactions, "INCOME"), expense: buildCategoryBreakdown(transactions, "EXPENSE") });
    if (type === "savings")  return ok(buildMonthlyData(transactions, 12));

    // Dashboard summary
    const monthStart = startOfMonth(year, month);
    const monthEnd   = endOfMonth(year, month);
    const monthTx    = transactions.filter((t) => { const d = new Date(t.date); return d >= monthStart && d <= monthEnd; });

    const totalIncome   = transactions.filter((t) => t.type === "INCOME") .reduce((s, t) => s + t.amount, 0);
    const totalExpense  = transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
    const monthlyIncome  = monthTx.filter((t) => t.type === "INCOME") .reduce((s, t) => s + t.amount, 0);
    const monthlyExpense = monthTx.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);

    // Upcoming & overdue
    const now = new Date();
    const in7 = new Date(now); in7.setDate(in7.getDate() + 7);
    const upcomingPayments = payments.filter((p) => { const d = daysUntil(p.dueDate); return !p.completed && d >= 0 && d <= 7; });
    const overduePayments  = payments.filter((p) => !p.completed && daysUntil(p.dueDate) < 0);

    // Forecasted end-of-month balance
    const daysInMonth    = new Date(year, month + 1, 0).getDate();
    const dayOfMonth     = Math.min(now.getDate(), daysInMonth);
    const dailyRate      = monthlyIncome > 0 ? (monthlyIncome - monthlyExpense) / dayOfMonth : 0;
    const remainingDays  = daysInMonth - dayOfMonth;
    const forecastedBalance = (totalIncome - totalExpense) + dailyRate * remainingDays;

    return ok({
      totalIncome, totalExpense, balance: totalIncome - totalExpense,
      monthlyIncome, monthlyExpense, monthlySavings: monthlyIncome - monthlyExpense,
      monthlyData:       buildMonthlyData(transactions, 12),
      categoryBreakdown: buildCategoryBreakdown(monthTx, "EXPENSE"),
      balanceTrend:      buildBalanceTrend(transactions, 12),
      upcomingPayments,
      overduePayments,
      forecastedBalance: Math.round(forecastedBalance),
    });
  } catch (err) { return serverError(err); }
});
