"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { z } from "zod";
import { registerSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

type RegisterSchema = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router    = useRouter();
  const { toast } = useToast();
  const [showPw, setShowPw] = useState(false);

  const form = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: RegisterSchema) => {
    const res = await fetch("/api/auth/register", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      toast({ title: "Kayıt başarısız", description: err.error ?? "Bir hata oluştu", variant: "destructive" });
      return;
    }

    // Auto-login after registration
    await signIn("credentials", { email: data.email, password: data.password, redirect: false });
    router.push("/dashboard");
  };

  return (
    <Card className="shadow-xl border-0 bg-card/95 backdrop-blur">
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-2xl font-extrabold">Hesap Oluşturun</CardTitle>
        <CardDescription>Ücretsiz kayıt olun ve finanslarınızı yönetin</CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Ad Soyad</FormLabel>
                <FormControl><Input placeholder="Ayşe Yılmaz" autoComplete="name" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>E-posta</FormLabel>
                <FormControl><Input type="email" placeholder="ornek@email.com" autoComplete="email" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormLabel>Şifre</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input type={showPw ? "text" : "password"} placeholder="En az 8 karakter" autoComplete="new-password" {...field} />
                    <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="confirmPassword" render={({ field }) => (
              <FormItem>
                <FormLabel>Şifre Tekrar</FormLabel>
                <FormControl><Input type="password" placeholder="Şifrenizi tekrar girin" autoComplete="new-password" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <Button type="submit" className="w-full" size="lg" loading={form.formState.isSubmitting}>
              <UserPlus className="w-4 h-4" /> Hesap Oluştur
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="pt-0 justify-center">
        <p className="text-sm text-muted-foreground">
          Zaten hesabınız var mı?{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">Giriş yapın</Link>
        </p>
      </CardFooter>
    </Card>
  );
}
