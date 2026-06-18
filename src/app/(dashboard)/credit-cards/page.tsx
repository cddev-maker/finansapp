"use client";

import { useState } from "react";
import { Plus, CreditCard, Edit2, Trash2, TrendingUp } from "lucide-react";
import { useCreditCards, useCreateCreditCard, useUpdateCreditCard, useDeleteCreditCard } from "@/hooks/use-credit-cards";
import { useTransactions } from "@/hooks/use-transactions";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import CreditCardForm from "@/components/credit-cards/CreditCardForm";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CARD_NETWORK_LABELS } from "@/constants";
import type { CreditCard, CreateCreditCardInput } from "@/types";

export default function CreditCardsPage() {
  const [showForm,  setShowForm]  = useState(false);
  const [editCard,  setEditCard]  = useState<CreditCard | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: cards = [],  isLoading } = useCreditCards();
  const createCard = useCreateCreditCard();
  const updateCard = useUpdateCreditCard();
  const deleteCard = useDeleteCreditCard();

  const totalLimit   = cards.reduce((s, c) => s + c.creditLimit, 0);
  const totalBalance = cards.reduce((s, c) => s + c.currentBalance, 0);

  const handleSave = async (data: CreateCreditCardInput) => {
    try {
      if (editCard) { await updateCard.mutateAsync({ id: editCard.id, ...data }); toast({ title: "Kart güncellendi", variant: "success" } as never); }
      else          { await createCard.mutateAsync(data);                          toast({ title: "Kart eklendi",    variant: "success" } as never); }
      setShowForm(false); setEditCard(null);
    } catch (e: unknown) { toast({ title: "Hata", description: e instanceof Error ? e.message : "Bir hata oluştu", variant: "destructive" }); }
  };

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Kredi Kartları</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Kart limitlari ve harcama takibi</p>
        </div>
        <Button onClick={() => { setEditCard(null); setShowForm(true); }}><Plus className="w-4 h-4" /> Kart Ekle</Button>
      </div>

      {/* Summary */}
      {cards.length > 0 && (
        <div className="grid sm:grid-cols-3 gap-4">
          <Card className="p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Toplam Limit</p>
            <p className="text-2xl font-extrabold text-primary">{formatCurrency(totalLimit)}</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Toplam Borç</p>
            <p className="text-2xl font-extrabold text-destructive">{formatCurrency(totalBalance)}</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Kullanılabilir</p>
            <p className="text-2xl font-extrabold text-emerald-600">{formatCurrency(totalLimit - totalBalance)}</p>
          </Card>
        </div>
      )}

      {/* Card grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}</div>
      ) : cards.length === 0 ? (
        <EmptyState icon="💳" title="Kart bulunamadı" description="İlk kredi kartınızı ekleyin" action={<Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> Kart Ekle</Button>} />
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {cards.map((card) => (
            <div key={card.id} className="relative group rounded-2xl overflow-hidden shadow-lg" style={{ background: `linear-gradient(135deg, ${card.color}, ${card.color}99)` }}>
              {/* Card face */}
              <div className="p-6 text-white">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-xs font-semibold opacity-80 uppercase tracking-wider">{CARD_NETWORK_LABELS[card.network]}</p>
                    <p className="font-bold text-lg mt-0.5">{card.name}</p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditCard(card); setShowForm(true); }} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setConfirmId(card.id)} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>

                <p className="font-mono text-lg tracking-[0.2em] opacity-80">•••• •••• •••• {card.lastFourDigits}</p>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="opacity-80">Kullanılan</span>
                    <span className="font-bold">{formatCurrency(card.currentBalance)}</span>
                  </div>
                  <Progress value={card.utilizationPct ?? 0} className="h-1.5 bg-white/30" indicatorClassName="bg-white" />
                  <div className="flex justify-between text-xs opacity-70">
                    <span>%{card.utilizationPct ?? 0} kullanıldı</span>
                    <span>Limit: {formatCurrency(card.creditLimit)}</span>
                  </div>
                </div>

                <div className="flex justify-between mt-4 text-xs opacity-70">
                  <span>Ekstre: {card.statementDate}. gün</span>
                  <span>Son ödeme: {card.dueDate}. gün</span>
                </div>
              </div>

              {/* Availability bar */}
              <div className="bg-black/20 px-6 py-3 flex justify-between text-white text-sm">
                <span className="opacity-80">Kullanılabilir</span>
                <span className="font-bold">{formatCurrency(card.availableLimit ?? 0)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={(v) => { if (!v) { setShowForm(false); setEditCard(null); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editCard ? "Kartı Düzenle" : "Yeni Kredi Kartı"}</DialogTitle></DialogHeader>
          <CreditCardForm initial={editCard ?? undefined} onSave={handleSave} onClose={() => { setShowForm(false); setEditCard(null); }} loading={createCard.isPending || updateCard.isPending} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmId} onClose={() => setConfirmId(null)}
        onConfirm={() => confirmId && deleteCard.mutateAsync(confirmId).then(() => { toast({ title: "Kart devre dışı bırakıldı" }); setConfirmId(null); })}
        title="Kartı Kaldır" description="Bu kartı devre dışı bırakmak istediğinizden emin misiniz? Bağlı işlemler korunacaktır."
        confirmLabel="Devre Dışı Bırak"
      />
    </div>
  );
}
