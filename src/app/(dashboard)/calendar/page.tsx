"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { usePayments, useCreatePayment, useUpdatePayment } from "@/hooks/use-payments";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import PaymentForm from "@/components/payments/PaymentForm";
import { formatCurrency, daysUntil, cn } from "@/lib/utils";
import { CATEGORY_LABELS, MONTH_NAMES } from "@/constants";
import type { Payment, CreatePaymentInput } from "@/types";

const WEEKDAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function getMonthGrid(year: number, month: number) {
  const firstOfMonth = new Date(year, month, 1);
  const jsDay = firstOfMonth.getDay();
  const leadingOffset = jsDay === 0 ? 6 : jsDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: { date: Date; inMonth: boolean }[] = [];

  for (let i = leadingOffset - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, daysInPrevMonth - i), inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), inMonth: true });
  }
  while (cells.length < 42) {
    const last = cells[cells.length - 1].date;
    const next = new Date(last);
    next.setDate(next.getDate() + 1);
    cells.push({ date: next, inMonth: false });
  }
  return cells;
}

function isoDay(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function CalendarPage() {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const { data: payments = [], isLoading } = usePayments();
  const createPay = useCreatePayment();
  const updatePay = useUpdatePayment();

  const grid = useMemo(() => getMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const paymentsByDay = useMemo(() => {
    const map: Record<string, Payment[]> = {};
    payments.forEach((p) => {
      const key = p.dueDate;
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    return map;
  }, [payments]);

  const monthTotal = useMemo(() => {
    return payments
      .filter((p) => {
        const d = new Date(p.dueDate);
        return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
      })
      .reduce((s, p) => s + p.amount, 0);
  }, [payments, viewYear, viewMonth]);

  const prevMonth = () => { if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); } else setViewMonth((m) => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); } else setViewMonth((m) => m + 1); };
  const goToday = () => { setViewYear(now.getFullYear()); setViewMonth(now.getMonth()); };

  const selectedPayments = selectedDay ? (paymentsByDay[selectedDay] ?? []) : [];

  const statusColor = (p: Payment) => {
    if (p.completed) return { dot: "bg-emerald-500", text: "text-emerald-600" };
    const d = daysUntil(p.dueDate);
    if (d < 0) return { dot: "bg-red-500", text: "text-red-600" };
    if (d <= 3) return { dot: "bg-amber-500", text: "text-amber-600" };
    return { dot: "bg-primary", text: "text-primary" };
  };

  const handleToggle = async (p: Payment) => {
    try {
      await updatePay.mutateAsync({
        id: p.id,
        completed: !p.completed,
        completedAt: !p.completed ? new Date().toISOString() : null,
        status: !p.completed ? "PAID" : "PENDING",
      });
      toast({ title: !p.completed ? `${p.name} ödendi` : `${p.name} beklemede`, variant: "success" } as never);
    } catch {
      toast({ title: "Güncellenemedi", variant: "destructive" });
    }
  };

  const handleCreate = async (data: CreatePaymentInput) => {
    try {
      await createPay.mutateAsync(selectedDay ? { ...data, dueDate: selectedDay } : data);
      toast({ title: "Ödeme eklendi", variant: "success" } as never);
      setShowForm(false);
    } catch (e: unknown) {
      toast({ title: "Hata", description: e instanceof Error ? e.message : "Bir hata oluştu", variant: "destructive" });
    }
  };

  const todayKey = isoDay(now);

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Ödeme Takvimi</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Tüm ödemelerinizi aylık takvim üzerinde görüntüleyin</p>
        </div>
        <Button onClick={() => { setSelectedDay(isoDay(now)); setShowForm(true); }}>
          <Plus className="w-4 h-4" /> Ödeme Ekle
        </Button>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
          <span className="font-bold text-lg min-w-[180px] text-center">{MONTH_NAMES[viewMonth]} {viewYear}</span>
          <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" onClick={goToday}>Bugün</Button>
        </div>
        <Badge variant="secondary" className="text-sm h-7 px-3">
          Bu ay toplam: <strong className="ml-1">{formatCurrency(monthTotal)}</strong>
        </Badge>
      </div>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border bg-muted/30">
          {WEEKDAY_LABELS.map((d) => (
            <div key={d} className="text-center text-xs font-bold text-muted-foreground uppercase tracking-wider py-2.5">{d}</div>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-7 gap-1 p-2">
            {Array.from({ length: 35 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {grid.map(({ date, inMonth }, i) => {
              const key = isoDay(date);
              const dayPayments = paymentsByDay[key] ?? [];
              const isToday = key === todayKey;
              const dayTotal = dayPayments.reduce((s, p) => s + p.amount, 0);

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(key)}
                  className={cn(
                    "min-h-[96px] p-2 border-b border-r border-border/60 text-left transition-colors flex flex-col gap-1 hover:bg-muted/40",
                    !inMonth && "bg-muted/20 text-muted-foreground/50",
                    i % 7 === 6 && "border-r-0"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full",
                      isToday && "bg-primary text-primary-foreground"
                    )}>
                      {date.getDate()}
                    </span>
                    {dayPayments.length > 0 && (
                      <span className="text-[10px] font-bold text-muted-foreground">{dayPayments.length}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    {dayPayments.slice(0, 2).map((p) => {
                      const sc = statusColor(p);
                      return (
                        <div key={p.id} className="flex items-center gap-1 text-[11px] truncate">
                          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", sc.dot)} />
                          <span className="truncate font-medium">{p.name}</span>
                        </div>
                      );
                    })}
                    {dayPayments.length > 2 && (
                      <span className="text-[10px] text-muted-foreground font-medium">+{dayPayments.length - 2} daha</span>
                    )}
                  </div>

                  {dayPayments.length > 0 && (
                    <span className="text-[10px] font-bold text-muted-foreground mt-auto">{formatCurrency(dayTotal)}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </Card>

      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Ödendi</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> Gecikmiş</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Yaklaşıyor (≤3 gün)</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" /> Beklemede</span>
      </div>

      <Dialog open={!!selectedDay && !showForm} onOpenChange={(v) => !v && setSelectedDay(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDay && new Date(selectedDay).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long" })}
            </DialogTitle>
          </DialogHeader>

          {selectedPayments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-4">Bu tarihte planlanmış ödeme yok</p>
              <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> Bu Tarihe Ödeme Ekle</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedPayments.map((p) => {
                const sc = statusColor(p);
                const d = daysUntil(p.dueDate);
                return (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-border">
                    <input
                      type="checkbox"
                      checked={p.completed}
                      onChange={() => handleToggle(p)}
                      className="w-4 h-4 accent-primary cursor-pointer shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn("font-semibold text-sm", p.completed && "line-through text-muted-foreground")}>{p.name}</span>
                        <Badge variant="secondary" className="text-[10px] h-5">{CATEGORY_LABELS[p.category]}</Badge>
                      </div>
                      {!p.completed && (
                        <p className={cn("text-xs mt-0.5", sc.text)}>
                          {d === 0 ? "Bugün vadesi doluyor" : d < 0 ? `${Math.abs(d)} gün gecikti` : `${d} gün kaldı`}
                        </p>
                      )}
                    </div>
                    <span className="font-bold text-sm whitespace-nowrap">{formatCurrency(p.amount)}</span>
                  </div>
                );
              })}
              <Button variant="outline" className="w-full" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4" /> Bu Tarihe Yeni Ödeme Ekle
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showForm} onOpenChange={(v) => !v && setShowForm(false)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Yeni Ödeme {selectedDay && `— ${new Date(selectedDay).toLocaleDateString("tr-TR")}`}</DialogTitle>
          </DialogHeader>
          <PaymentForm
            initial={selectedDay ? ({ dueDate: selectedDay, startDate: selectedDay } as never) : undefined}
            onSave={handleCreate}
            onClose={() => setShowForm(false)}
            loading={createPay.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
