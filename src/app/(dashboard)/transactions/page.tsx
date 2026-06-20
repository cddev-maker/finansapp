"use client";

import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Plus, Download, ArrowUpRight, ArrowDownRight, Edit2, Trash2 } from "lucide-react";
import { useTransactions, useCreateTransaction, useUpdateTransaction, useDeleteTransaction } from "@/hooks/use-transactions";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TransactionForm from "@/components/transactions/TransactionForm";
import { formatCurrency, formatDate, downloadFile, transactionsToCSV } from "@/lib/utils";
import { CATEGORY_LABELS, CATEGORIES, MONTH_NAMES } from "@/constants";
import { BankLogo } from "@/components/ui/bank-logo";
import type { BankName } from "@/constants/banks";
import type { Transaction, CreateTransactionInput, TransactionType } from "@/types";

export default function TransactionsPage() {
  const now = new Date();
  const [year,      setYear]      = useState(now.getFullYear());
  const [month,     setMonth]     = useState<number | undefined>(now.getMonth());
  const [typeFilter, setTypeFilter] = useState<TransactionType | "">("");
  const [catFilter,  setCatFilter]  = useState("");
  const [showForm,   setShowForm]   = useState(false);
  const [editTx,     setEditTx]     = useState<Transaction | null>(null);
  const [confirmId,  setConfirmId]  = useState<string | null>(null);
  const { toast } = useToast();

  const { data: result, isLoading } = useTransactions({
    year, month, type: typeFilter as TransactionType || undefined,
    category: catFilter as never || undefined, pageSize: 100,
  });

  const transactions = result?.data ?? [];
  const createTx = useCreateTransaction();
  const updateTx = useUpdateTransaction();
  const deleteTx = useDeleteTransaction();

  const handleSave = async (data: CreateTransactionInput) => {
    try {
      if (editTx) { await updateTx.mutateAsync({ id: editTx.id, ...data }); toast({ title: "İşlem güncellendi", variant: "success" } as never); }
      else        { await createTx.mutateAsync(data);                        toast({ title: "İşlem eklendi",    variant: "success" } as never); }
      setShowForm(false); setEditTx(null);
    } catch (e: unknown) {
      toast({ title: "Hata", description: e instanceof Error ? e.message : "Bir hata oluştu", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    await deleteTx.mutateAsync(id).catch(() => {});
    toast({ title: "Silindi" });
  };

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: "date",
      header: "Tarih",
      cell: ({ row }) => <span className="text-sm whitespace-nowrap">{formatDate(row.original.date)}</span>,
    },
 {
  accessorKey: "description",
  header: "Açıklama",
  cell: ({ row }) => (
    <div className="flex items-center gap-2">
      <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${row.original.type === "INCOME" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-500"}`}>
        {row.original.type === "INCOME" ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
      </span>
      <div className="flex flex-col">
        <span className="text-sm font-medium truncate max-w-[200px]">{row.original.description}</span>
        {(row.original as never as { bankName?: string }).bankName && (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <BankLogo bank={(row.original as never as { bankName: BankName }).bankName} size={12} showName />
          </span>
        )}
      </div>
    </div>
  ),
},
    {
      accessorKey: "category",
      header: "Kategori",
      cell: ({ row }) => <Badge variant="secondary" className="text-[10px]">{CATEGORY_LABELS[row.original.category]}</Badge>,
    },
    {
      accessorKey: "type",
      header: "Tür",
      cell: ({ row }) => (
        <Badge variant={row.original.type === "INCOME" ? "success" : "destructive"} className="text-[10px]">
          {row.original.type === "INCOME" ? "Gelir" : "Gider"}
        </Badge>
      ),
    },
    {
      accessorKey: "amount",
      header: "Tutar",
      cell: ({ row }) => (
        <span className={`font-bold text-sm ${row.original.type === "INCOME" ? "text-emerald-600" : "text-destructive"}`}>
          {row.original.type === "INCOME" ? "+" : "-"}{formatCurrency(row.original.amount)}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex gap-1 justify-end">
          <Button variant="ghost" size="icon-sm" onClick={() => { setEditTx(row.original); setShowForm(true); }}>
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setConfirmId(row.original.id)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">İşlemler</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Tüm gelir ve gider hareketleri</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { downloadFile(transactionsToCSV(transactions), `islemler-${year}-${(month ?? 0) + 1}.csv`); toast({ title: "CSV dışa aktarıldı" }); }}>
            <Download className="w-4 h-4" /> CSV
          </Button>
          <Button size="sm" onClick={() => { setEditTx(null); setShowForm(true); }}>
            <Plus className="w-4 h-4" /> Yeni İşlem
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>{[2022,2023,2024,2025,2026].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={month !== undefined ? String(month) : "all"} onValueChange={(v) => setMonth(v === "all" ? undefined : Number(v))}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Aylar</SelectItem>
            {MONTH_NAMES.map((n, i) => <SelectItem key={i} value={String(i)}>{n}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter || "all"} onValueChange={(v) => setTypeFilter(v === "all" ? "" : v as TransactionType)}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Gelir & Gider</SelectItem>
            <SelectItem value="INCOME">Sadece Gelir</SelectItem>
            <SelectItem value="EXPENSE">Sadece Gider</SelectItem>
          </SelectContent>
        </Select>
        <Select value={catFilter || "all"} onValueChange={(v) => setCatFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Kategoriler</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={transactions}
        loading={isLoading}
        searchKey="description"
        searchPlaceholder="Açıklamada ara..."
        emptyState={<EmptyState icon="📊" title="İşlem bulunamadı" description="Filtre değiştirin veya yeni işlem ekleyin" action={<Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> Ekle</Button>} />}
      />

      <Dialog open={showForm} onOpenChange={(v) => { if (!v) { setShowForm(false); setEditTx(null); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editTx ? "İşlem Düzenle" : "Yeni İşlem"}</DialogTitle></DialogHeader>
          <TransactionForm initial={editTx ?? undefined} onSave={handleSave} onClose={() => { setShowForm(false); setEditTx(null); }} loading={createTx.isPending || updateTx.isPending} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!confirmId} onClose={() => setConfirmId(null)} onConfirm={() => confirmId && handleDelete(confirmId)} />
    </div>
  );
}
