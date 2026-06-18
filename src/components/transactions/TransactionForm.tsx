"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createTransactionSchema } from "@/lib/validations";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreditCards } from "@/hooks/use-credit-cards";
import { CATEGORIES, CATEGORY_LABELS } from "@/constants";
import type { Transaction, CreateTransactionInput } from "@/types";

type Schema = z.infer<typeof createTransactionSchema>;

interface Props {
  initial?: Transaction;
  onSave:   (data: CreateTransactionInput) => void;
  onClose:  () => void;
  loading?: boolean;
}

export default function TransactionForm({ initial, onSave, onClose, loading }: Props) {
  const { data: cards = [] } = useCreditCards();
  const today = new Date().toISOString().split("T")[0];

  const form = useForm<Schema>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      date:         initial?.date ?? today,
      description:  initial?.description ?? "",
      category:     initial?.category ?? "OTHER",
      amount:       initial?.amount ?? undefined,
      type:         initial?.type ?? "EXPENSE",
      notes:        initial?.notes ?? "",
      creditCardId: initial?.creditCardId ?? undefined,
    },
  });

  const txType = form.watch("type");

  const onSubmit = (data: Schema) => {
    onSave({ ...data, amount: Number(data.amount) });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Type toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
          {(["INCOME", "EXPENSE"] as const).map((t) => (
            <button key={t} type="button" onClick={() => form.setValue("type", t)}
              className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                txType === t
                  ? t === "INCOME" ? "bg-emerald-500 text-white shadow-sm" : "bg-destructive text-destructive-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}>
              {t === "INCOME" ? "💰 Gelir" : "💸 Gider"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="date" render={({ field }) => (
            <FormItem>
              <FormLabel>Tarih</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="amount" render={({ field }) => (
            <FormItem>
              <FormLabel>Tutar (₺)</FormLabel>
              <FormControl><Input type="number" step="0.01" min="0" placeholder="0.00" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Açıklama</FormLabel>
            <FormControl><Input placeholder="İşlem açıklaması..." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="category" render={({ field }) => (
          <FormItem>
            <FormLabel>Kategori</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        {txType === "EXPENSE" && cards.length > 0 && (
          <FormField control={form.control} name="creditCardId" render={({ field }) => (
            <FormItem>
              <FormLabel>Kredi Kartı (opsiyonel)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value ?? ""}>
                <FormControl><SelectTrigger><SelectValue placeholder="Nakit ödeme" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="">Nakit</SelectItem>
                  {cards.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} •••• {c.lastFourDigits}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormItem>
          )} />
        )}

        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem>
            <FormLabel>Notlar (opsiyonel)</FormLabel>
            <FormControl><Input placeholder="Ek açıklama..." {...field} /></FormControl>
          </FormItem>
        )} />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">İptal</Button>
          <Button type="submit" loading={loading} className="flex-1">{initial ? "Güncelle" : "Kaydet"}</Button>
        </div>
      </form>
    </Form>
  );
}
