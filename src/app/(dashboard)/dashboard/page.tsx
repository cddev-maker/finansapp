"use client";

import { useState, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank,
  ArrowUpRight, ArrowDownRight, Plus, Download, Upload,
  AlertTriangle, Clock, CheckCircle2, Target,
} from "lucide-react";
import { useDashboardSummary } from "@/hooks/use-reports";
import { useTransactions, useCreateTransaction, useUpdateTransaction, useDeleteTransaction } from "@/hooks/use-transactions";
import { useBudgets } from "@/hooks/use-budgets";
import { useToast } from "@/hooks/use-toast";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import TransactionForm from "@/components/transactions/TransactionForm";
import { formatCurrency, formatDate, formatCompact, daysUntil, downloadFile, transactionsToCSV } from "@/lib/utils";
import { MONTH_NAMES, MONTH_SHORT, CHART_COLORS, CATEGORY_LABELS } from "@/constants";
import type { Transaction, CreateTransactionInput } from "@/types";

// ─── Chart tooltip style ─────────────────────────────────────────────────────

const TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "10px",
  color: "hsl(var(--popover-foreground))",
  fontSize: 12,
};

export default function DashboardPage() {
  const now = new Date();
  const [viewYear,  setViewYear]  = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [showForm,  setShowForm]  = useState(false);
  const [editTx,    setEditTx]    = useState<Transaction | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: summary,      isLoading: summaryLoading } = useDashboardSummary(viewYear, viewMonth);
  const { data: txResult,     isLoading: txLoading }      = useTransactions({ year: viewYear, month: viewMonth, pageSize: 20 });
  const { data: budgets = [],  isLoading: budgetsLoading } = useBudgets(viewYear, viewMonth);

  const transactions = txResult?.data ?? [];

  const createTx = useCreateTransaction();
  const updateTx = useUpdateTransaction();
  const deleteTx = useDeleteTransaction();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };

  const handleSave = async (data: CreateTransactionInput) => {
    try {
      if (editTx) {
        await updateTx.mutateAsync({ id: editTx.id, ...data });
        toast({ title: "İşlem güncellendi", variant: "success" } as never);
      } else {
        await createTx.mutateAsync(data);
        toast({ title: "İşlem eklendi", variant: "success" } as never);
      }
      setShowForm(false); setEditTx(null);
    } catch (e: unknown) {
      toast({ title: "Hata", description: e instanceof Error ? e.message : "Bir hata oluştu", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    const backup = transactions.find((t) => t.id === id);
    try {
      await deleteTx.mutateAsync(id);
      toast({
        title: "İşlem silindi",
        action: (
          <Button variant="outline" size="sm" onClick={async () => {
            if (backup) await createTx.mutateAsync({ date: backup.date, description: backup.description, category: backup.category, amount: backup.amount, type: backup.type });
          }}>
            Geri Al
          </Button>
        ) as never,
      });
    } catch (e: unknown) {
      toast({ title: "Silinemedi", variant: "destructive" });
    }
  };

  const exportCSV = () => {
    downloadFile(transactionsToCSV(transactions), `islemler-${viewYear}-${viewMonth + 1}.csv`);
    toast({ title: "CSV dışa aktarıldı" });
  };

  const alertBudgets = budgets.filter((b) => b.isAlert || b.isOverBudget);

  return (
    <div className="page-container space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Toplam Gelir"    value={formatCompact(summary?.totalIncome ?? 0)}    color="green"  icon={<TrendingUp className="w-4 h-4" />}   loading={summaryLoading} />
        <StatCard label="Toplam Gider"    value={formatCompact(summary?.totalExpense ?? 0)}   color="red"    icon={<TrendingDown className="w-4 h-4" />}  loading={summaryLoading} />
        <StatCard label="Güncel Bakiye"   value={formatCompact(summary?.balance ?? 0)}        color="indigo" icon={<Wallet className="w-4 h-4" />}        loading={summaryLoading} sub={(summary?.balance ?? 0) >= 0 ? "Pozitif" : "Negatif"} />
        <StatCard label="Aylık Gelir"     value={formatCompact(summary?.monthlyIncome ?? 0)}  color="green"  icon={<ArrowUpRight className="w-4 h-4" />}  loading={summaryLoading} sub={MONTH_NAMES[viewMonth]} />
        <StatCard label="Aylık Gider"     value={formatCompact(summary?.monthlyExpense ?? 0)} color="red"    icon={<ArrowDownRight className="w-4 h-4" />} loading={summaryLoading} sub={MONTH_NAMES[viewMonth]} />
        <StatCard label="Ay Sonu Tahmini" value={formatCompact(summary?.forecastedBalance ?? 0)} color={(summary?.forecastedBalance ?? 0) >= 0 ? "blue" : "amber"} icon={<PiggyBank className="w-4 h-4" />} loading={summaryLoading} sub="Tahmini bakiye" />
      </div>

      {/* Budget alerts */}
      {alertBudgets.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {alertBudgets.map((b) => (
            <div key={b.id} className={`flex items-center gap-3 p-3 rounded-xl border text-sm ${b.isOverBudget ? "bg-destructive/10 border-destructive/30" : "bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800"}`}>
              <AlertTriangle className={`w-4 h-4 shrink-0 ${b.isOverBudget ? "text-destructive" : "text-amber-600"}`} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{b.name}</p>
                <p className="text-muted-foreground text-xs">{formatCurrency(b.spent ?? 0)} / {formatCurrency(b.amount)} (%{b.pct})</p>
              </div>
              {b.isOverBudget && <Badge variant="destructive" className="text-[10px] h-5">Aşıldı</Badge>}
            </div>
          ))}
        </div>
      )}

      {/* Upcoming & overdue quick-view */}
      {((summary?.upcomingPayments?.length ?? 0) > 0 || (summary?.overduePayments?.length ?? 0) > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {(summary?.overduePayments?.length ?? 0) > 0 && (
            <Card className="border-destructive/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-4 h-4" /> {summary!.overduePayments.length} Gecikmiş Ödeme
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {summary!.overduePayments.slice(0, 3).map((p) => (
                  <div key={p.id} className="flex justify-between text-sm">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-destructive font-bold">{formatCurrency(p.amount)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {(summary?.upcomingPayments?.length ?? 0) > 0 && (
            <Card className="border-amber-200 dark:border-amber-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <Clock className="w-4 h-4" /> {summary!.upcomingPayments.length} Yaklaşan Ödeme
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {summary!.upcomingPayments.slice(0, 3).map((p) => (
                  <div key={p.id} className="flex justify-between text-sm">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">{daysUntil(p.dueDate) === 0 ? "Bugün!" : `${daysUntil(p.dueDate)}g`} — {formatCurrency(p.amount)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Charts row */}
      <div className="grid xl:grid-cols-3 gap-4">
        {/* Monthly bar chart */}
        <Card className="xl:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Aylık Gelir vs Gider</CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? <Skeleton className="h-56" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={summary?.monthlyData ?? []} margin={{ left: -20, right: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="income"  name="Gelir" fill="#10b981" radius={[4,4,0,0]} />
                  <Bar dataKey="expense" name="Gider" fill="#ef4444" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pie */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              Kategori — {MONTH_NAMES[viewMonth]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? <Skeleton className="h-56" /> : (summary?.categoryBreakdown?.length ?? 0) > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={summary!.categoryBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="amount" nameKey="label">
                    {summary!.categoryBreakdown.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyState icon="📊" title="Bu ay veri yok" />}
          </CardContent>
        </Card>
      </div>

      {/* Balance trend */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Bakiye Trendi — 12 Ay</CardTitle>
        </CardHeader>
        <CardContent>
          {summaryLoading ? <Skeleton className="h-44" /> : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={summary?.balanceTrend ?? []} margin={{ left: -20, right: 0 }}>
                <defs>
                  <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="balance" name="Bakiye" stroke="hsl(var(--primary))" fill="url(#balGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Budget progress */}
      {budgets.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Target className="w-4 h-4" /> Bütçe Durumu — {MONTH_NAMES[viewMonth]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {budgetsLoading ? <Skeleton className="h-32" /> : (
              <div className="grid sm:grid-cols-2 gap-4">
                {budgets.slice(0, 6).map((b) => (
                  <div key={b.id}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium">{b.name}</span>
                      <span className={b.isOverBudget ? "text-destructive font-bold" : "text-muted-foreground"}>
                        {formatCurrency(b.spent ?? 0)} / {formatCurrency(b.amount)}
                      </span>
                    </div>
                    <Progress
                      value={Math.min(b.pct ?? 0, 100)}
                      className="h-2"
                      indicatorClassName={b.isOverBudget ? "bg-destructive" : b.isAlert ? "bg-amber-500" : ""}
                    />
                    <p className="text-xs text-muted-foreground mt-0.5">%{b.pct ?? 0} kullanıldı</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Transactions table */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <span className="font-bold text-sm min-w-[140px] text-center">{MONTH_NAMES[viewMonth]} {viewYear}</span>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-3.5 h-3.5" /> CSV</Button>
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Upload className="w-3.5 h-3.5" /> İçe Aktar</Button>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0]; if (!file) return;
                // CSV import logic
                const reader = new FileReader();
                reader.onload = async (ev) => {
                  const lines = (ev.target?.result as string).split("\n").slice(1).filter(Boolean);
                  let count = 0;
                  for (const line of lines) {
                    const [date, description, category, type, amount] = line.split(",").map((s) => s.replace(/^"|"$/g, "").trim());
                    if (!date || !amount) continue;
                    const catKey = Object.entries(CATEGORY_LABELS).find(([, v]) => v === category)?.[0] ?? "OTHER";
                    await createTx.mutateAsync({ date, description, category: catKey as never, amount: parseFloat(amount), type: type === "Gelir" ? "INCOME" : "EXPENSE" }).catch(() => {});
                    count++;
                  }
                  toast({ title: `${count} işlem içe aktarıldı` });
                };
                reader.readAsText(file);
                e.target.value = "";
              }} />
              <Button size="sm" onClick={() => { setEditTx(null); setShowForm(true); }}>
                <Plus className="w-3.5 h-3.5" /> İşlem Ekle
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 mt-4">
          {txLoading ? (
            <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : transactions.length === 0 ? (
            <EmptyState icon="💸" title="Bu dönem işlem yok" description="Yeni bir işlem ekleyin" action={<Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> Ekle</Button>} />
          ) : (
            <div>
              {transactions.map((tx, i) => (
                <div key={tx.id} className="flex items-center gap-3 px-5 py-3.5 border-t border-border/50 first:border-t-0 hover:bg-muted/30 transition-colors group">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tx.type === "INCOME" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" : "bg-red-100 text-red-500 dark:bg-red-900/30"}`}>
                    {tx.type === "INCOME" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{tx.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{formatDate(tx.date)}</span>
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{CATEGORY_LABELS[tx.category]}</Badge>
                    </div>
                  </div>
                  <p className={`font-bold text-sm whitespace-nowrap ${tx.type === "INCOME" ? "text-emerald-600" : "text-red-500"}`}>
                    {tx.type === "INCOME" ? "+" : "-"}{formatCurrency(tx.amount)}
                  </p>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => { setEditTx(tx); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onClick={() => setConfirmId(tx.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
                    </button>
                  </div>
                </div>
              ))}
              <div className="px-5 py-3 border-t border-border flex justify-between text-xs text-muted-foreground">
                <span>{txResult?.total ?? 0} işlem</span>
                <span>Net: <strong className={(summary?.monthlySavings ?? 0) >= 0 ? "text-emerald-600" : "text-destructive"}>{formatCurrency(summary?.monthlySavings ?? 0)}</strong></span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction form modal */}
      <Dialog open={showForm} onOpenChange={(v) => { if (!v) { setShowForm(false); setEditTx(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTx ? "İşlem Düzenle" : "Yeni İşlem"}</DialogTitle>
          </DialogHeader>
          <TransactionForm
            initial={editTx ?? undefined}
            onSave={handleSave}
            onClose={() => { setShowForm(false); setEditTx(null); }}
            loading={createTx.isPending || updateTx.isPending}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={() => confirmId && handleDelete(confirmId)}
        description="Bu işlemi silmek istediğinizden emin misiniz? Toast üzerinden geri alabilirsiniz."
      />
    </div>
  );
}
