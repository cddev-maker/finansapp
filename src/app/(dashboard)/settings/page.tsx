"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Bell, Palette, Globe } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/utils";
import { updateSettingsSchema } from "@/lib/validations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/hooks/use-store";

type Schema = z.infer<typeof updateSettingsSchema>;

interface UserSettings {
  currency: string; darkMode: boolean; emailNotifications: boolean; reminderDaysBefore: number;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const { darkMode, toggleDark } = useStore();
  const qc = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn:  () => apiFetch<{ data: UserSettings }>("/api/settings").then((r) => r.data),
  });

  const updateSettings = useMutation({
    mutationFn: (data: Schema) => apiFetch("/api/settings", { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings"] }); toast({ title: "Ayarlar kaydedildi", variant: "success" } as never); },
    onError:   () => toast({ title: "Kaydedilemedi", variant: "destructive" }),
  });

  const form = useForm<Schema>({
    resolver: zodResolver(updateSettingsSchema),
    values: {
      name:               session?.user?.name ?? "",
      emailNotifications: settings?.emailNotifications ?? true,
      reminderDaysBefore: settings?.reminderDaysBefore ?? 3,
    },
  });

  return (
    <div className="page-container space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-extrabold">Ayarlar</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Hesap ve uygulama tercihleriniz</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profil Bilgileri</CardTitle>
          <CardDescription>Hesap bilgilerinizi görüntüleyin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Ad Soyad</p>
              <p className="text-sm font-medium">{session?.user?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">E-posta</p>
              <p className="text-sm font-medium">{session?.user?.email ?? "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Palette className="w-4 h-4" /> Görünüm</CardTitle>
          <CardDescription>Uygulama temasını özelleştirin</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Karanlık Mod</p>
              <p className="text-xs text-muted-foreground">Gece kullanımı için göz dostu tema</p>
            </div>
            <button onClick={toggleDark} className={`relative w-11 h-6 rounded-full transition-colors ${darkMode ? "bg-primary" : "bg-muted"}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${darkMode ? "translate-x-5" : ""}`} />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Bell className="w-4 h-4" /> Bildirimler</CardTitle>
          <CardDescription>Ödeme hatırlatıcı tercihleriniz</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => updateSettings.mutate(d))} className="space-y-4">
              <FormField control={form.control} name="emailNotifications" render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">E-posta Bildirimleri</p>
                      <p className="text-xs text-muted-foreground">Yaklaşan ve gecikmiş ödemeler için e-posta alın</p>
                    </div>
                    <button type="button" onClick={() => field.onChange(!field.value)} className={`relative w-11 h-6 rounded-full transition-colors ${field.value ? "bg-primary" : "bg-muted"}`}>
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${field.value ? "translate-x-5" : ""}`} />
                    </button>
                  </div>
                </FormItem>
              )} />

              <FormField control={form.control} name="reminderDaysBefore" render={({ field }) => (
                <FormItem>
                  <FormLabel>Hatırlatma Süresi (gün önce)</FormLabel>
                  <FormControl><Input type="number" min={0} max={30} {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} className="w-32" /></FormControl>
                  <FormDescription>Vade tarihinden kaç gün önce hatırlatma almak istersiniz</FormDescription>
                </FormItem>
              )} />

              <Button type="submit" loading={updateSettings.isPending}>
                <Save className="w-4 h-4" /> Kaydet
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Currency */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Globe className="w-4 h-4" /> Bölge & Para Birimi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Para Birimi</span>
            <span className="font-bold">₺ Türk Lirası (TRY)</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-muted-foreground">Dil & Bölge</span>
            <span className="font-bold">Türkçe (tr-TR)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
