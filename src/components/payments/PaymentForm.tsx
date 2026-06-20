"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createPaymentSchema } from "@/lib/validations";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, CATEGORY_LABELS, PAYMENT_STATUS_LABELS } from "@/constants";
import type { Payment, CreatePaymentInput, PaymentStatus } from "@/types";

type Schema = z.infer<typeof createPaymentSchema>;

interface Props {
  initial?: Payment;
  onSave: (d: CreatePaymentInput & { recurMonths?: number }) => void;
  onClose: () => void;
  loading?: boolean;
}

export default function PaymentForm({ initial, onSave, onClose, loading }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [recurring, setRecurring] = useState(false);
  const [recurMonths, setRecurMonths] = useState(12);

  const form = useForm<Schema>({
    resolver: zodResolver(createPaymentSchema),
    defaultValues: {
      name: initial?.name ?? "", description: initial?.description ?? "",
      amount: initial?.amount ?? undefined, dueDate: initial?.dueDate ?? today,
      startDate: initial?.startDate ?? today, endDate: initial?.endDate ?? "",
      category: initial?.category ?? "OTHER", status: initial?.status ?? "PENDING",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((d) => onSave({ ...d, amount: Number(d.amount), endDate: d.endDate || undefined, recurMonths: recurring ? recurMonths : undefined }))} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel>Ödeme Adı</FormLabel>
              <FormControl><Input placeholder="Ör: Ev Kirası" {...field} /></FormControl>
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
          <FormField control={form.control} name="dueDate" render={({ field }) => (
            <FormItem>
              <FormLabel>Vade Tarihi</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="startDate" render={({ field }) => (
            <FormItem>
              <FormLabel>Başlangıç</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="endDate" render={({ field }) => (
            <FormItem>
              <FormLabel>Bitiş (opsiyonel)</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem>
              <FormLabel>Kategori</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>)}</SelectContent>
              </Select>
            </FormItem>
          )} />
          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem>
              <FormLabel>Durum</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>{(Object.keys(PAYMENT_STATUS_LABELS) as PaymentStatus[]).map((s) => <SelectItem key={s} value={s}>{PAYMENT_STATUS_LABELS[s]}</SelectItem>)}</SelectContent>
              </Select>
            </FormItem>
          )} />
          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel>Açıklama (opsiyonel)</FormLabel>
              <FormControl><Input placeholder="Kısa açıklama..." {...field} /></FormControl>
            </FormItem>
          )} />
        </div>

        {!initial && (
          <div className="rounded-lg border border-border p-3 space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} className="w-4 h-4 accent-primary" />
              Bu ödeme her ay tekrarlasın
            </label>
            {recurring && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Kaç ay ileriye kadar oluşturulsun:</span>
                <Input type="number" min={2} max={60} value={recurMonths} onChange={(e) => setRecurMonths(parseInt(e.target.value) || 12)} className="w-20" />
                <span className="text-muted-foreground">ay</span>
              </div>
            )}
            {recurring && (
              <p className="text-xs text-muted-foreground">
                Aynı tutarla {recurMonths} ay için ayrı kayıtlar oluşturulacak. Her ayı sonradan ayrı ayrı düzenleyebilirsiniz.
              </p>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">İptal</Button>
          <Button type="submit" loading={loading} className="flex-1">{initial ? "Güncelle" : "Kaydet"}</Button>
        </div>
      </form>
    </Form>
  );
}
