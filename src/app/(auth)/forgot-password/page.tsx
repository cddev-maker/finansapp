"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Mail } from "lucide-react";
import { forgotPasswordSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

type Schema = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const form = useForm<Schema>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } });

  const onSubmit = async (data: Schema) => {
    const res = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const json = await res.json();
    toast({ title: "E-posta gönderildi", description: json.message, variant: res.ok ? "default" : "destructive" });
    if (res.ok) form.reset();
  };

  return (
    <Card className="shadow-xl border-0 bg-card/95 backdrop-blur">
      <CardHeader className="pb-6">
        <CardTitle className="text-2xl font-extrabold">Şifremi Unuttum</CardTitle>
        <CardDescription>E-posta adresinizi girin, sıfırlama bağlantısı gönderelim.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>E-posta</FormLabel>
                <FormControl><Input type="email" placeholder="ornek@email.com" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" className="w-full" size="lg" loading={form.formState.isSubmitting}>
              <Mail className="w-4 h-4" /> Bağlantı Gönder
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="pt-0 justify-center">
        <Link href="/login" className="text-sm text-primary hover:underline">← Giriş sayfasına dön</Link>
      </CardFooter>
    </Card>
  );
}
