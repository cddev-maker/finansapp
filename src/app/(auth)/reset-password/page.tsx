"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound } from "lucide-react";
import { resetPasswordSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

type Schema = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router  = useRouter();
  const params  = useSearchParams();
  const token   = params.get("token");
  const { toast } = useToast();

  const form = useForm<Schema>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { password: "", confirmPassword: "" } });

  const onSubmit = async (data: Schema) => {
    if (!token) { toast({ title: "Geçersiz bağlantı", variant: "destructive" }); return; }
    const res = await fetch("/api/auth/reset-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password: data.password }),
    });
    const json = await res.json();
    if (!res.ok) { toast({ title: "Hata", description: json.error, variant: "destructive" }); return; }
    toast({ title: "Şifre güncellendi", description: "Yeni şifrenizle giriş yapabilirsiniz." });
    router.push("/login");
  };

  if (!token) {
    return (
      <Card className="shadow-xl border-0">
        <CardHeader><CardTitle>Geçersiz Bağlantı</CardTitle><CardDescription>Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.</CardDescription></CardHeader>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl border-0 bg-card/95 backdrop-blur">
      <CardHeader className="pb-6">
        <CardTitle className="text-2xl font-extrabold">Yeni Şifre Belirleyin</CardTitle>
        <CardDescription>Hesabınız için yeni bir şifre oluşturun</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormLabel>Yeni Şifre</FormLabel>
                <FormControl><Input type="password" placeholder="En az 8 karakter" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="confirmPassword" render={({ field }) => (
              <FormItem>
                <FormLabel>Şifre Tekrar</FormLabel>
                <FormControl><Input type="password" placeholder="Şifrenizi tekrar girin" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" className="w-full" size="lg" loading={form.formState.isSubmitting}>
              <KeyRound className="w-4 h-4" /> Şifreyi Güncelle
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
