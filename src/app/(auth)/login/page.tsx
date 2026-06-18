"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { loginSchema, type LoginSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

// Re-export schema type needed here
import { z } from "zod";
type LoginSchema = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router     = useRouter();
  const { toast }  = useToast();
  const [showPw, setShowPw] = useState(false);

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginSchema) => {
    const result = await signIn("credentials", {
      email:    data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      toast({ title: "Giriş başarısız", description: "E-posta veya şifre hatalı.", variant: "destructive" });
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <Card className="shadow-xl border-0 bg-card/95 backdrop-blur">
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-2xl font-extrabold">Hoş Geldiniz</CardTitle>
        <CardDescription>Hesabınıza giriş yapın</CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-posta</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="ornek@email.com" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Şifre</FormLabel>
                    <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                      Şifremi unuttum
                    </Link>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPw ? "text" : "password"}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={form.formState.isSubmitting}
            >
              <LogIn className="w-4 h-4" />
              Giriş Yap
            </Button>
          </form>
        </Form>

        
      </CardContent>

      <CardFooter className="flex-col gap-2 pt-0">
        <p className="text-sm text-muted-foreground">
          Hesabınız yok mu?{" "}
          <Link href="/register" className="text-primary font-semibold hover:underline">
            Kayıt olun
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
