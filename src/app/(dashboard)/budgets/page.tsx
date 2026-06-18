"use client";

import { useState } from "react";
import { Plus, Target, AlertTriangle, TrendingUp, Edit2, Trash2 } from "lucide-react";
import { useBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget } from "@/hooks/use-budgets";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BudgetForm from "@/components/budgets/BudgetForm";
import { formatCurrency } from "@/lib/utils";
import { CATEGORY_LABELS, MONTH_NAMES } from "@/constants";
import type { Budget, CreateBudgetInput } from "@/types";

export default function BudgetsPage() {
  const now   = new Date();
  const [year,     setYear]     = useState(now.getFullYear());
  const [month,    setMonth]    = useState(now.getMonth());
  const [showForm, setShowForm] = useState(false);
  const [editB,    setEditB]    = useState<Budget | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: budgets = [], isLoading } = useBudgets(year, month);
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent  = budgets.reduce((s, b) => s + (b.spent ?? 0), 0);
  const alertCount  = budgets.filter((b) => b.isAlert || b.isOverBudget).length;

  const handleSave = async (data: CreateBudgetInput) => {
    try {
      if (editB) { await updateBudget.mutateAsync({ id: editB.id, ...data }); toast({ title: "Bütçe güncellendi", variant: "success" } as never); }
      else       { await createBudget.mutateAsync(data);                      toast({ title: "Bütçe oluşturuldu", variant: "success" } as never); }
      setShowForm(false); setEditB(null);
    } catch (e: unknown) { toast({ title: "Hata", description: e instanceof Error ? e.message : "Bir hata oluştu", variant: "destructive" }); }
  };

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Bütçe Yönetimi</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Kategori bazlı harcama hedefleriniz</p>
        </div>
        <div className="flex gap-2">
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>{MONTH_NAMES.map((n, i) => <SelectItem key={i} value={String(i)}>{n}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>{[2024,2025,2026].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
          <Button onClick={() => { setEditB(null); setShowForm(true); }}><Plus className="w-4 h-4" /> Bütçe Ekle</Button>
        </div>
      </div>

      {/* Summary */}
      {budgets.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Toplam Bütçe</p>
            <p className="text-xl font-extrabold text-primary">{formatCurrency(totalBudget)}</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Harcanan</p>
            <p className="text-xl font-extrabold text-destructive">{formatCurrency(totalSpent)}</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Kalan</p>
            <p className="text-xl font-extrabold text-emerald-600">{formatCurrency(Math.max(totalBudget - totalSpent, 0))}</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Uyarılar</p>
            <p className={`text-xl font-extrabold ${alertCount > 0 ? "text-amber-600" : "text-emerald-600"}`}>{alertCount}</p>
          </Card>
        </div>
      )}

      {/* Budget cards */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">{Array.from({length:6}).map((_,i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}</div>
      ) : budgets.length === 0 ? (
        <EmptyState icon="🎯" title="Bütçe bulunamadı" description={`${MONTH_NAMES[month]} ${year} için henüz bütçe oluşturulmamış`} action={<Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> Bütçe Oluştur</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {budgets.map((b) => {
            const pct = b.pct ?? 0;
            const isOver  = b.isOverBudget;
            const isAlert = b.isAlert && !isOver;
            return (
              <Card key={b.id} className={`p-5 group card-hover ${isOver ? "border-destructive/40" : isAlert ? "border-amber-300 dark:border-amber-700" : ""}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: b.color }} />
                    <div>
                      <p className="font-bold text-sm">{b.name}</p>
                      <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[b.category]}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditB(b); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setConfirmId(b.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Harcama</span>
                    <span className={`font-bold ${isOver ? "text-destructive" : ""}`}>{formatCurrency(b.spent ?? 0)}</span>
                  </div>
                  <Progress
                    value={Math.min(pct, 100)}
                    className="h-2.5"
                    indicatorClassName={isOver ? "bg-destructive" : isAlert ? "bg-amber-500" : ""}
                    style={{ "--progress-color": b.color } as React.CSSProperties}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Bütçe: {formatCurrency(b.amount)}</span>
                    <span className={`font-semibold ${isOver ? "text-destructive" : isAlert ? "text-amber-600" : ""}`}>%{pct}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Kalan: <strong className={isOver ? "text-destructive" : "text-emerald-600"}>{formatCurrency(Math.max(b.amount - (b.spent ?? 0), 0))}</strong></span>
                    {isOver  && <Badge variant="destructive" className="text-[10px] h-5">Aşıldı!</Badge>}
                    {isAlert && <Badge variant="warning"     className="text-[10px] h-5">Uyarı %{b.alertAt}</Badge>}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={(v) => { if (!v) { setShowForm(false); setEditB(null); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editB ? "Bütçeyi Düzenle" : "Yeni Bütçe"}</DialogTitle></DialogHeader>
          <BudgetForm initial={editB ?? undefined} defaultYear={year} defaultMonth={month} onSave={handleSave} onClose={() => { setShowForm(false); setEditB(null); }} loading={createBudget.isPending || updateBudget.isPending} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!confirmId} onClose={() => setConfirmId(null)} onConfirm={() => confirmId && deleteBudget.mutateAsync(confirmId).then(() => toast({ title: "Bütçe silindi" }))} />
    </div>
  );
}
