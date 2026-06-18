"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createCreditCardSchema } from "@/lib/validations";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CARD_COLORS, CARD_NETWORK_LABELS } from "@/constants";
import type { CreditCard, CreateCreditCardInput, CardNetwork } from "@/types";

type Schema = z.infer<typeof createCreditCardSchema>;
interface Props { initial?: CreditCard; onSave: (d: CreateCreditCardInput) => void; onClose: () => void; loading?: boolean; }

export default function CreditCardForm({ initial, onSave, onClose, loading }: Props) {
  const form = useForm<Schema>({
    resolver: zodResolver(createCreditCardSchema),
    defaultValues: {
      name: initial?.name ?? "", lastFourDigits: initial?.lastFourDigits ?? "",
      network: initial?.network ?? "VISA", creditLimit: initial?.creditLimit ?? undefined,
      currentBalance: initial?.currentBalance ?? 0, statementDate: initial?.statementDate ?? 15,
      dueDate: initial?.dueDate ?? 3, color: initial?.color ?? "#6366f1",
    },
  });

  const networks: CardNetwork[] = ["VISA", "MASTERCARD", "AMEX", "TROY", "OTHER"];
  const selectedColor = form.watch("color");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((d) => onSave({ ...d, creditLimit: Number(d.creditLimit), currentBalance: Number(d.currentBalance) }))} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel>Kart Adı</FormLabel>
              <FormControl><Input placeholder="Garanti Bonus" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="lastFourDigits" render={({ field }) => (
            <FormItem>
              <FormLabel>Son 4 Hane</FormLabel>
              <FormControl><Input placeholder="1234" maxLength={4} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="network" render={({ field }) => (
            <FormItem>
              <FormLabel>Ağ</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>{networks.map((n) => <SelectItem key={n} value={n}>{CARD_NETWORK_LABELS[n]}</SelectItem>)}</SelectContent>
              </Select>
            </FormItem>
          )} />
          <FormField control={form.control} name="creditLimit" render={({ field }) => (
            <FormItem>
              <FormLabel>Kart Limiti (₺)</FormLabel>
              <FormControl><Input type="number" placeholder="50000" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="currentBalance" render={({ field }) => (
            <FormItem>
              <FormLabel>Mevcut Borç (₺)</FormLabel>
              <FormControl><Input type="number" placeholder="0" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} /></FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="statementDate" render={({ field }) => (
            <FormItem>
              <FormLabel>Ekstre Günü</FormLabel>
              <FormControl><Input type="number" min={1} max={31} placeholder="15" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="dueDate" render={({ field }) => (
            <FormItem>
              <FormLabel>Son Ödeme Günü</FormLabel>
              <FormControl><Input type="number" min={1} max={31} placeholder="3" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="color" render={({ field }) => (
          <FormItem>
            <FormLabel>Kart Rengi</FormLabel>
            <div className="flex gap-2 flex-wrap">
              {CARD_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => field.onChange(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${field.value === c ? "border-foreground scale-110" : "border-transparent"}`}
                  style={{ background: c }} />
              ))}
              <input type="color" value={field.value} onChange={(e) => field.onChange(e.target.value)} className="w-8 h-8 rounded-full cursor-pointer border-0 p-0" />
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
