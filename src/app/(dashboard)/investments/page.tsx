"use client";

import { useState } from "react";
import { Plus, RefreshCw, TrendingUp, TrendingDown, Edit2, Trash2, X } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  useInvestments, useCreateInvestment, useUpdateInvestment,
  useDeleteInvestment, useRefreshPrices, usePriceHistory,
} from "@/hooks/use-investments";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import InvestmentForm from "@/components/investments/InvestmentForm";
import { formatCurrency } from "@/lib/utils";
import { INVESTMENT_TYPE_LABELS, INVESTMENT_TYPE_ICONS, TIME_RANGE_LABELS } from "@/constants/investments";
import type { Investment, CreateInvestmentInput } from "@/types";

const TS = {
  backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))",
  borderRadius: "10px", color: "hsl(var(--popover-foreground))", fontSize: 12,
};

type Range = "1day" | "1week" | "1month" | "1year";

function InvestmentDetailModal({ investment, onClose }: { investment: Investment; onClose: () => void }) {
  const [range, setRange] = useState<Range>("1month");
  const { data: history = [], isLoading } = usePriceHistory(investment.type, investment.symbol, range, true);

  const isProfit = (investment.profitLoss ?? 0) >= 0;

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{INVESTMENT_TYPE_ICONS[investment.type]}</span> {investment.name}
            <Badge variant="secondary" className="text-xs">{investment.symbol}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Alım Fiyatı</p>
            <p className="font-bold text-sm">{formatCurrency(investment.buyPrice)}</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Güncel Fiyat</p>
            <p className="font-bold text-sm">{investment.currentPrice ? formatCurrency(investment.currentPrice) : "—"}</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Kar/Zarar</p>
            <p className={`font-bold text-sm ${isProfit ? "text-emerald-600" : "text-destructive"}`}>
              {investment.profitLoss !== null && investment.profitLoss !== undefined
                ? `${isProfit ? "+" : ""}${formatCurrency(investment.profitLoss)} (%${investment.profitLossPct?.toFixed(1)})`
                : "—"}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {(["1day", "1week", "1month", "1year"] as Range[]).map((r) => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${range === r ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:border-primary/50"}`}>
              {TIME_RANGE_LABELS[r]}
            </button>
          ))}
        </div>

        {isLoading ? (
          <Skeleton className="h-64" />
        ) : history.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={history} margin={{ left: -10, right: 10 }}>
              <defs>
                <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isProfit ? "#10b981" : "#ef4444"} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={isProfit ? "#10b981" : "#ef4444"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => new Date(v).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" })} />
              <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={TS}
                formatter={(v) => formatCurrency(Number(v))}
                labelFormatter={(v) => new Date(v).toLocaleDateString("tr-TR")}
              />
              <Area type="monotone" dataKey="price" stroke={isProfit ? "#10b981" : "#ef4444"} fill="url(#invGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-sm text-muted-foreground">Bu dönem için veri bulunamadı</div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function InvestmentsPage() {
  const [showForm,  setShowForm]  = useState(false);
  const [editInv,   setEditInv]   = useState<Investment | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [detailInv, setDetailInv] = useState<Investment | null>(null);
  const { toast } = useToast();

  const { data: investments = [], isLoading } = useInvestments();
  const createInv  = useCreateInvestment();
  const updateInv  = useUpdateInvestment();
  const deleteInv  = useDeleteInvestment();
  const refreshAll = useRefreshPrices();

  const totalCost    = investments.reduce((s, i) => s + (i.totalCost ?? 0), 0);
  const totalValue   = investments.reduce((s, i) => s + (i.currentValue ?? i.totalCost ?? 0), 0);
  const totalPL       = totalValue - totalCost;
  const totalPLPct    = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;

  const handleSave = async (data: CreateInvestmentInput) => {
    try {
      if (editInv) { await updateInv.mutateAsync({ id: editInv.id, ...data }); toast({ title: "Yatırım güncellendi", variant: "success" } as never); }
      else         { await createInv.mutateAsync(data);                        toast({ title: "Yatırım eklendi",    variant: "success" } as never); }
      setShowForm(false); setEditInv(null);
    } catch (e: unknown) {
      toast({ title: "Hata", description: e instanceof Error ? e.message : "Bir hata oluştu", variant: "destructive" });
    }
  };

  const handleRefresh = async () => {
    try {
      const result = await refreshAll.mutateAsync();
      toast({ title: `${result.updated} fiyat güncellendi`, description: result.failed > 0 ? `${result.failed} fiyat alınamadı` : undefined, variant: "success" } as never);
    } catch {
      toast({ title: "Fiyatlar güncellenemedi", variant: "destructive" });
    }
  };

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Yatırımlarım</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Hisse, altın, döviz ve fon portföyünüz</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} loading={refreshAll.isPending}>
            <RefreshCw className="w-4 h-4" /> Fiyatları Yenile
          </Button>
          <Button onClick={() => { setEditInv(null); setShowForm(true); }}>
            <Plus className="w-4 h-4" /> Yatırım Ekle
          </Button>
        </div>
      </div>

      {/* Summary */}
      {investments.length > 0 && (
        <div className="grid sm:grid-cols-3 gap-4">
          <Card className="p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Toplam Maliyet</p>
            <p className="text-2xl font-extrabold text-primary">{formatCurrency(totalCost)}</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Güncel Değer</p>
            <p className="text-2xl font-extrabold">{formatCurrency(totalValue)}</p>
          </Card>
          <Card className={`p-5 ${totalPL >= 0 ? "border-emerald-200" : "border-destructive/30"}`}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Toplam Kar/Zarar</p>
            <p className={`text-2xl font-extrabold flex items-center gap-1 ${totalPL >= 0 ? "text-emerald-600" : "text-destructive"}`}>
              {totalPL >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              {totalPL >= 0 ? "+" : ""}{formatCurrency(totalPL)}
              <span className="text-sm font-semibold ml-1">(%{totalPLPct.toFixed(1)})</span>
            </p>
          </Card>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}</div>
      ) : investments.length === 0 ? (
        <EmptyState icon="📊" title="Henüz yatırım eklenmedi" description="İlk yatırımınızı ekleyin" action={<Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> Yatırım Ekle</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {investments.map((inv) => {
            const isProfit = (inv.profitLoss ?? 0) >= 0;
            return (
              <Card key={inv.id} className="p-5 cursor-pointer hover:shadow-md transition-shadow group" onClick={() => setDetailInv(inv)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{INVESTMENT_TYPE_ICONS[inv.type]}</span>
                    <div>
                      <p className="font-bold text-sm">{inv.name}</p>
                      <p className="text-xs text-muted-foreground">{inv.symbol} • {INVESTMENT_TYPE_LABELS[inv.type]}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => { setEditInv(inv); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setConfirmId(inv.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Miktar</span>
                    <span className="font-medium">{inv.quantity}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Maliyet</span>
                    <span className="font-medium">{formatCurrency(inv.totalCost ?? 0)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Güncel Değer</span>
                    <span className="font-medium">{inv.currentValue !== null && inv.currentValue !== undefined ? formatCurrency(inv.currentValue) : "—"}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Kar/Zarar</span>
                  {inv.profitLoss !== null && inv.profitLoss !== undefined ? (
                    <span className={`font-bold text-sm flex items-center gap-1 ${isProfit ? "text-emerald-600" : "text-destructive"}`}>
                      {isProfit ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {isProfit ? "+" : ""}{formatCurrency(inv.profitLoss)} (%{inv.profitLossPct?.toFixed(1)})
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Fiyat bekleniyor</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={(v) => { if (!v) { setShowForm(false); setEditInv(null); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editInv ? "Yatırımı Düzenle" : "Yeni Yatırım"}</DialogTitle></DialogHeader>
          <InvestmentForm initial={editInv ?? undefined} onSave={handleSave} onClose={() => { setShowForm(false); setEditInv(null); }} loading={createInv.isPending || updateInv.isPending} />
        </DialogContent>
      </Dialog>

      {detailInv && <InvestmentDetailModal investment={detailInv} onClose={() => setDetailInv(null)} />}

      <ConfirmDialog open={!!confirmId} onClose={() => setConfirmId(null)} onConfirm={() => confirmId && deleteInv.mutateAsync(confirmId).then(() => toast({ title: "Silindi" }))} />
    </div>
  );
}
