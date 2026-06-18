"use client";

import { useState, useRef } from "react";
import { Download, Upload, ShieldCheck, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function BackupPage() {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/backup");
      if (!res.ok) throw new Error("Yedekleme başarısız");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `finansapp-backup-${new Date().toISOString().split("T")[0]}.json`; a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Yedek indirildi", variant: "success" } as never);
    } catch {
      toast({ title: "Yedekleme başarısız", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const res  = await fetch("/api/backup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Geri yükleme başarısız");
      toast({ title: "Yedek geri yüklendi", description: json.data?.message, variant: "success" } as never);
      qc.invalidateQueries();
    } catch (err: unknown) {
      toast({ title: "Hata", description: err instanceof Error ? err.message : "Geçersiz dosya", variant: "destructive" });
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  return (
    <div className="page-container space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-extrabold">Veri Yedekleme</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Tüm hesap verilerinizi dışa aktarın veya geri yükleyin</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Download className="w-4 h-4" /> Verileri Dışa Aktar</CardTitle>
          <CardDescription>Tüm işlemler, ödemeler, kredi kartları ve bütçeleriniz JSON formatında indirilir.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExport} loading={exporting}>
            <Download className="w-4 h-4" /> Yedek Dosyasını İndir
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Upload className="w-4 h-4" /> Yedekten Geri Yükle</CardTitle>
          <CardDescription>Önceden indirdiğiniz bir yedek dosyasını seçin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Geri yükleme işlemi mevcut kayıtları güncelleyebilir. Devam etmeden önce güncel verilerinizi yedeklemeniz önerilir.</span>
          </div>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          <Button variant="outline" onClick={() => fileRef.current?.click()} loading={importing}>
            <Upload className="w-4 h-4" /> Yedek Dosyası Seç
          </Button>
        </CardContent>
      </Card>

      <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10">
        <CardContent className="flex items-start gap-3 pt-6">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-emerald-700 dark:text-emerald-400">Verileriniz güvende</p>
            <p className="text-muted-foreground text-xs mt-1">Tüm veriler şifreli bağlantı üzerinden aktarılır ve sadece sizin hesabınıza ait kayıtlar dışa aktarılır.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
