"use client";

import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Plus, Bell, AlertTriangle, Edit2, Trash2, CheckCircle2, Clock } from "lucide-react";
import { usePayments, useCreatePayment, useUpdatePayment, useDeletePayment } from "@/hooks/use-payments";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import PaymentForm from "@/components/payments/PaymentForm";
import { formatCurrency, formatDate, daysUntil, resolvePaymentStatus } from "@/lib/utils";
import { CATEGORY_LABELS, PAYMENT_STATUS_LABELS } from "@/constants";
import type { Payment, CreatePaymentInput, PaymentFilters } from "@/types";

const STATUS_BADGE: Record<string, "success" | "destructive" | "warning" | "secondary"> = {
  PAID: "success", OVERDUE: "destructive", PENDING: "warning", CANCELLED: "secondary",
};

type FilterKey = "all" | "upcoming" | "overdue" | "this_month" | "completed";

export default function PaymentsPage() {
  const [filter,    setFilter]    = useState<FilterKey>("all");
  const [showForm,  setShowForm]  = useState(false);
  const [editP,     setEditP]     = useState<Payment | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: payments = [], isLoading } = usePayments({ filter: filter === "all" ? undefined : filter });
  const enriched = payments.map((p) => ({ ...p, status: resolvePaymentStatus(p) }));

  const createPay = useCreatePayment();
  const updatePay = useUpdatePayment();
  const deletePay = useDeletePayment();

  const totalPending  = enriched.filter((p) => !p.completed && p.status !== "CANCELLED").reduce((s, p) => s + p.amount, 0);
  const totalPaid     = enriched.filter((p) => p.completed).reduce((s, p) => s + p.amount, 0);
  const overdueCount  = enriched.filter((p) => p.status === "OVERDUE").length;

  const reminders = payments.filter((p) => { const d = daysUntil(p.dueDate); return !p.completed && d >= 0 && d <= 7; });

  const handleToggle = async (p: Payment) => {
    try {
      await updatePay.mutateAsync({ id: p.id, completed: !p.completed, completedAt: !p.completed ? new Date().toISOString() : null, status: !p.completed ? "PAID" : "PENDING" });
      toast({ title: !p.completed ? `${p.name} ödendi` : `${p.name} beklemede`, variant: "success" } as never);
    } catch { toast({ title: "Güncellenemedi", variant: "destructive" }); }
  };

  const handleSave = async (data: CreatePaymentInput) => {
    try {
      if (editP) { await updatePay.mutateAsync({ id: editP.id, ...data }); toast({ title: "Ödeme güncellendi", variant: "success" } as never); }
      else       { await createPay.mutateAsync(data);                      toast({ title: "Ödeme eklendi",    variant: "success" } as never); }
      setShowForm(false); setEditP(null);
    } catch (e: unknown) { toast({ title: "Hata", description: e instanceof Error ? e.message : "Bir hata oluştu", variant: "destructive" }); }
  };

  const columns: ColumnDef<Payment & { status: Payment["status"] }>[] = [
    {
      id: "check",
      cell: ({ row }) => (
        <input type="checkbox" checked={row.original.completed} onChange={() => handleToggle(row.original)}
          className="w-4 h-4 rounded accent-primary cursor-pointer" />
      ),
    },
    {
      accessorKey: "name",
      header: "Ödeme",
      cell: ({ row }) => {
        const days = daysUntil(row.original.dueDate);
        return (
          <div>
            <p className={`font-semibold text-sm ${row.original.completed ? "line-through text-muted-foreground" : ""}`}>{row.original.name}</p>
            {row.original.description && <p className="text-xs text-muted-foreground truncate max-w-[180px]">{row.original.description}</p>}
          </div>
        );
      },
    },
    {
      accessorKey: "dueDate",
      header: "Vade",
      cell: ({ row }) => {
        const days = daysUntil(row.original.dueDate);
        return (
          <div>
            <p className="text-sm">{formatDate(row.original.dueDate)}</p>
            {!row.original.completed && (
              <p className={`text-xs font-medium ${days < 0 ? "text-destructive" : days <= 3 ? "text-amber-600" : "text-muted-foreground"}`}>
                {days === 0 ? "Bugün!" : days < 0 ? `${Math.abs(days)}g gecikmiş` : `${days}g kaldı`}
              </p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "category",
      header: "Kategori",
      cell: ({ row }) => <Badge variant="secondary" className="text-[10px]">{CATEGORY_LABELS[row.original.category]}</Badge>,
    },
    {
      accessorKey: "status",
      header: "Durum",
      cell: ({ row }) => <Badge variant={STATUS_BADGE[row.original.status]}>{PAYMENT_STATUS_LABELS[row.original.status]}</Badge>,
    },
    {
      accessorKey: "amount",
      header: "Tutar",
      cell: ({ row }) => <span className={`font-bold text-sm ${row.original.completed ? "text-emerald-600" : ""}`}>{formatCurrency(row.original.amount)}</span>,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex gap-1 justify-end">
          <Button variant="ghost" size="icon-sm" onClick={() => { setEditP(row.original); setShowForm(true); }}><Edit2 className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setConfirmId(row.original.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Ödeme Takibi</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Düzenli ve zamanlanmış ödemeleriniz</p>
        </div>
        <Button onClick={() => { setEditP(null); setShowForm(true); }}><Plus className="w-4 h-4" /> Ödeme Ekle</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Bekleyen"      value={formatCurrency(totalPending)} color="red"   icon={<Clock className="w-4 h-4" />} />
        <StatCard label="Ödenen"        value={formatCurrency(totalPaid)}    color="green" icon={<CheckCircle2 className="w-4 h-4" />} />
        <StatCard label="Toplam Kayıt"  value={String(enriched.length)}      color="blue"  icon={<Bell className="w-4 h-4" />} />
        <StatCard label="Gecikmiş"      value={String(overdueCount)}         color={overdueCount > 0 ? "red" : "green"} icon={<AlertTriangle className="w-4 h-4" />} />
      </div>

      {/* Reminders */}
      {reminders.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <Bell className="w-4 h-4" /> {reminders.length} ödeme yaklaşıyor (7 gün içinde)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {reminders.map((p) => {
              const d = daysUntil(p.dueDate);
              return (
                <div key={p.id} className="flex justify-between text-sm">
                  <span className="font-medium">{p.name}</span>
                  <span className={`font-bold ${d === 0 ? "text-destructive" : d <= 3 ? "text-orange-600" : "text-amber-600"}`}>
                    {d === 0 ? "Bugün!" : d === 1 ? "Yarın" : `${d} gün`} — {formatCurrency(p.amount)}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["all","upcoming","overdue","this_month","completed"] as FilterKey[]).map((f) => {
          const labels = { all: "Tümü", upcoming: "⚡ Yaklaşan", overdue: "🔴 Gecikmiş", this_month: "📅 Bu Ay", completed: "✅ Tamamlanan" };
          return (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${filter === f ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:border-primary/50"}`}>
              {labels[f]}
            </button>
          );
        })}
      </div>

      <DataTable
        columns={columns}
        data={enriched as (Payment & { status: Payment["status"] })[]}
        loading={isLoading}
        searchKey="name"
        searchPlaceholder="Ödeme adında ara..."
        emptyState={<EmptyState icon="💳" title="Ödeme bulunamadı" action={<Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> Ödeme Ekle</Button>} />}
      />

      <Dialog open={showForm} onOpenChange={(v) => { if (!v) { setShowForm(false); setEditP(null); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editP ? "Ödeme Düzenle" : "Yeni Ödeme"}</DialogTitle></DialogHeader>
          <PaymentForm initial={editP ?? undefined} onSave={handleSave} onClose={() => { setShowForm(false); setEditP(null); }} loading={createPay.isPending || updatePay.isPending} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!confirmId} onClose={() => setConfirmId(null)} onConfirm={() => confirmId && deletePay.mutateAsync(confirmId).then(() => toast({ title: "Silindi" }))} />
    </div>
  );
}
