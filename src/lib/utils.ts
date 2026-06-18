import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  CURRENCY_SYMBOL, LOCALE, MONTH_SHORT, CATEGORY_LABELS, CHART_COLORS,
} from "@/constants";
import type { Category, Transaction, Payment, MonthlyData, CategoryBreakdown, ForecastMonth } from "@/types";

// ─── Tailwind ─────────────────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Currency ─────────────────────────────────────────────────────────────────

export function formatCurrency(value: number): string {
  return `${CURRENCY_SYMBOL}${Math.abs(value).toLocaleString(LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatCurrencySigned(value: number): string {
  return `${value >= 0 ? "+" : "-"}${formatCurrency(Math.abs(value))}`;
}

export function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${CURRENCY_SYMBOL}${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000)     return `${CURRENCY_SYMBOL}${(value / 1_000).toFixed(0)}B`;
  return formatCurrency(value);
}

// ─── Dates ────────────────────────────────────────────────────────────────────

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString(LOCALE);
}

export function formatDateShort(date: string | Date): string {
  const d = new Date(date);
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}

export function isoDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function addMonths(date: Date, n: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

export function daysUntil(dateStr: string): number {
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - now.getTime()) / 86_400_000);
}

export function startOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1);
}

export function endOfMonth(year: number, month: number): Date {
  return new Date(year, month + 1, 0, 23, 59, 59, 999);
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export function buildMonthlyData(transactions: Transaction[], monthCount = 12): MonthlyData[] {
  const now = new Date();
  return Array.from({ length: monthCount }, (_, i) => {
    const d     = addMonths(now, -(monthCount - 1 - i));
    const year  = d.getFullYear();
    const month = d.getMonth();

    const monthTx = transactions.filter((t) => {
      const td = new Date(t.date);
      return td.getFullYear() === year && td.getMonth() === month;
    });

    const income  = monthTx.filter((t) => t.type === "INCOME") .reduce((s, t) => s + t.amount, 0);
    const expense = monthTx.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);

    return { label: MONTH_SHORT[month], income, expense, savings: income - expense };
  });
}

export function buildCategoryBreakdown(
  transactions: Transaction[],
  type: TransactionType = "EXPENSE"
): CategoryBreakdown[] {
  const map: Partial<Record<Category, number>> = {};
  const filtered = transactions.filter((t) => t.type === type);
  const total    = filtered.reduce((s, t) => s + t.amount, 0);

  filtered.forEach((t) => { map[t.category] = (map[t.category] ?? 0) + t.amount; });

  return Object.entries(map)
    .map(([cat, amount], i) => ({
      category:   cat as Category,
      label:      CATEGORY_LABELS[cat as Category],
      amount:     amount as number,
      percentage: total > 0 ? Math.round(((amount as number) / total) * 100) : 0,
      color:      CHART_COLORS[i % CHART_COLORS.length],
    }))
    .sort((a, b) => b.amount - a.amount);
}

type TransactionType = "INCOME" | "EXPENSE";

export function buildBalanceTrend(transactions: Transaction[], monthCount = 12) {
  let running = 0;
  return buildMonthlyData(transactions, monthCount).map((m) => {
    running += m.savings;
    return { label: m.label, balance: running };
  });
}

export function buildForecast(
  transactions: Transaction[],
  payments: Payment[],
  monthCount = 12
): ForecastMonth[] {
  const recent      = buildMonthlyData(transactions, 6);
  const avgIncome   = recent.reduce((s, m) => s + m.income, 0)  / Math.max(recent.length, 1);
  const avgExpense  = recent.reduce((s, m) => s + m.expense, 0) / Math.max(recent.length, 1);
  const recurring   = payments
    .filter((p) => !p.completed && p.status !== "CANCELLED")
    .reduce((s, p) => s + p.amount, 0);

  const now = new Date();
  return Array.from({ length: monthCount }, (_, i) => {
    const d               = addMonths(now, i + 1);
    const projectedIncome  = Math.round(avgIncome);
    const projectedExpense = Math.round(avgExpense + recurring * 0.3);
    return {
      label:            `${MONTH_SHORT[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
      projectedIncome,
      projectedExpense,
      net:              projectedIncome - projectedExpense,
    };
  });
}

// ─── Payment helpers ──────────────────────────────────────────────────────────

export function resolvePaymentStatus(payment: Payment): Payment["status"] {
  if (payment.completed)               return "PAID";
  if (payment.status === "CANCELLED")  return "CANCELLED";
  if (daysUntil(payment.dueDate) < 0) return "OVERDUE";
  return "PENDING";
}

// ─── CSV ─────────────────────────────────────────────────────────────────────

export function toCSV(rows: string[][]): string {
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
}

export function downloadFile(content: string, filename: string, mime = "text/csv;charset=utf-8;") {
  const blob = new Blob(["\uFEFF" + content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function transactionsToCSV(txs: Transaction[]): string {
  return toCSV([
    ["Tarih", "Açıklama", "Kategori", "Tür", "Tutar", "Notlar"],
    ...txs.map((t) => [
      t.date, t.description, CATEGORY_LABELS[t.category],
      t.type === "INCOME" ? "Gelir" : "Gider",
      t.amount.toFixed(2), t.notes ?? "",
    ]),
  ]);
}

// ─── API helpers ──────────────────────────────────────────────────────────────

export function buildSearchParams(obj: Record<string, string | number | boolean | undefined | null>): URLSearchParams {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  });
  return p;
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
  return json;
}
