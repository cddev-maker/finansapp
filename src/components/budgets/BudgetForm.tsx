"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createBudgetSchema } from "@/lib/validations";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, CATEGORY_LABELS, MONTH_NAMES, CARD_COLORS } from "@/constants";
import type { Budget, CreateBudgetInput } from "@/types";

type Schema = z.infer<typeof createBudgetSchema>;
interface Props { initial?: Budget; defaultYear: number; defaultMonth: number; onSave: (d: CreateBudgetInput) => void; onClose: () => void; loading?: boolean; }

export default function BudgetForm({ initial, defaultYear, defaultMonth, onSave, onClose, loading }: Props) {
  const form = useForm<Schema>({
    resolver: zodResolver(createBudgetSchema),
    defaultValues: {
      name: initial?.name ?? "", category: initial?.category ?? "GROCERIES",
      amount: initial?.amount ?? undefined, period: initial?.period ?? "MONTHLY",
      year: initial?.year ?? defaultYear, month: initial?.month ?? defaultMonth,
      alertAt: initial?.alertAt ?? 80, color: initial?.color ?? "#6366f1",
    },
  });

  const period = form.watch("period");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((d) => onSave({ ...d, amount: Number(d.amount), month: d.period === "YEARLY" ? null : d.month }))} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Bütçe Adı</FormLabel>
            <FormControl><Input placeholder="Ör: Aylık Market" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem>
              <FormLabel>Kategori</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>)}</SelectContent>
              </Select>
            </FormItem>
          )} />
          <FormField control={form.control} name="amount" render={({ field }) => (
            <FormItem>
              <FormLabel>Bütçe Tutarı (₺)</FormLabel>
              <FormControl><Input type="number" placeholder="0.00" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="period" render={({ field }) => (
            <FormItem>
              <FormLabel>Periyot</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="MONTHLY">Aylık</SelectItem>
                  <SelectItem value="YEARLY">Yıllık</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )} />
          {period === "MONTHLY" && (
            <FormField control={form.control} name="month" render={({ field }) => (
              <FormItem>
                <FormLabel>Ay</FormLabel>
                <Select onValueChange={(v) => field.onChange(Number(v))} defaultValue={String(field.value)}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>{MONTH_NAMES.map((n, i) => <SelectItem key={i} value={String(i)}>{n}</SelectItem>)}</SelectContent>
                </Select>
              </FormItem>
            )} />
          )}
          <FormField control={form.control} name="alertAt" render={({ field }) => (
            <FormItem>
              <FormLabel>Uyarı Eşiği (%)</FormLabel>
              <FormControl><Input type="number" min={0} max={100} placeholder="80" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} /></FormControl>
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="color" render={({ field }) => (
          <FormItem>
            <FormLabel>Renk</FormLabel>
            <div className="flex gap-2 flex-wrap">
              {CARD_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => field.onChange(c)} className={`w-7 h-7 rounded-full border-2 transition-all ${field.value === c ? "border-foreground scale-110" : "border-transparent"}`} style={{ background: c }} />
              ))}
            </div>
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
