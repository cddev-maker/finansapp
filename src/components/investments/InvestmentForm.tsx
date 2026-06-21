"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createInvestmentSchema } from "@/lib/validations";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  INVESTMENT_TYPES, INVESTMENT_TYPE_LABELS,
  GOLD_UNITS, CURRENCY_PAIRS, POPULAR_BIST_STOCKS, POPULAR_US_STOCKS,
} from "@/constants/investments";
import type { Investment, CreateInvestmentInput, InvestmentType } from "@/types";

type Schema = z.infer<typeof createInvestmentSchema>;

interface Props {
  initial?: Investment;
  onSave:   (d: CreateInvestmentInput) => void;
  onClose:  () => void;
  loading?: boolean;
}

export default function InvestmentForm({ initial, onSave, onClose, loading }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [useCustomSymbol, setUseCustomSymbol] = useState(false);

  const form = useForm<Schema>({
    resolver: zodResolver(createInvestmentSchema),
    defaultValues: {
      type:     initial?.type ?? "STOCK_TR",
      symbol:   initial?.symbol ?? "",
      name:     initial?.name ?? "",
      quantity: initial?.quantity ?? undefined,
      buyPrice: initial?.buyPrice ?? undefined,
      buyDate:  initial?.buyDate ?? today,
      notes:    initial?.notes ?? "",
    },
  });

  const type = form.watch("type");

  const presetList =
    type === "STOCK_TR" ? POPULAR_BIST_STOCKS :
    type === "STOCK_US" ? POPULAR_US_STOCKS :
    type === "CURRENCY" ? CURRENCY_PAIRS :
    type === "GOLD"     ? GOLD_UNITS :
    [];

  const handlePresetChange = (value: string) => {
    const preset = presetList.find((p) => p.value === value);
    form.setValue("symbol", value);
    if (preset) form.setValue("name", preset.label);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((d) => onSave({ ...d, quantity: Number(d.quantity), buyPrice: Number(d.buyPrice) }))} className="space-y-4">
        <FormField control={form.control} name="type" render={({ field }) => (
          <FormItem>
            <FormLabel>Yatırım Türü</FormLabel>
            <Select onValueChange={(v) => { field.onChange(v as InvestmentType); setUseCustomSymbol(false); }} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                {INVESTMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{INVESTMENT_TYPE_LABELS[t]}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormItem>
        )} />

        {type === "FUND" ? (
          <FormField control={form.control} name="symbol" render={({ field }) => (
            <FormItem>
              <FormLabel>TEFAS Fon Kodu</FormLabel>
              <FormControl><Input placeholder="Ör: TGE, AFA, IPJ" {...field} className="uppercase" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        ) : !useCustomSymbol ? (
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="symbol" render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>{type === "GOLD" ? "Altın Türü" : type === "CURRENCY" ? "Döviz" : "Hisse"}</FormLabel>
                <Select onValueChange={handlePresetChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Seçin..." /></SelectTrigger></FormControl>
                  <SelectContent>
                    {presetList.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <button type="button" onClick={() => setUseCustomSymbol(true)} className="text-xs text-primary hover:underline mt-1">
                  Listede yok, kendim yazmak istiyorum
                </button>
              </FormItem>
            )} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="symbol" render={({ field }) => (
              <FormItem>
                <FormLabel>Sembol</FormLabel>
                <FormControl><Input placeholder="Ör: NVDA" {...field} className="uppercase" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Görünen Ad</FormLabel>
                <FormControl><Input placeholder="Ör: NVIDIA" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        )}

        {type === "FUND" && (
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Fon Adı</FormLabel>
              <FormControl><Input placeholder="Ör: Garanti Hisse Fonu" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="quantity" render={({ field }) => (
            <FormItem>
              <FormLabel>
                {type === "GOLD" ? "Adet (Çeyrek/Gram sayısı)" : type === "CURRENCY" ? "Miktar" : type === "FUND" ? "Pay Adedi" : "Lot/Adet"}
              </FormLabel>
              <FormControl><Input type="number" step="0.000001" placeholder="0" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="buyPrice" render={({ field }) => (
            <FormItem>
              <FormLabel>Birim Alım Fiyatı (₺)</FormLabel>
              <FormControl><Input type="number" step="0.0001" placeholder="0.00" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value
