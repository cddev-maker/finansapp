"use client";

import { useState } from "react";
import { FileText, Download, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { useDashboardSummary, useForecast, useSavingsReport, useCategoryReport } from "@/hooks/use-reports";
import { useTransactions } from "@/hooks/use-transactions";
import { useBudgets } from "@/hooks/use-budgets";
import { useToast } from "@/hooks/use-toast";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import { CHART_COLORS, MONTH_NAMES } from "@/constants";

const TS = {
  backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))",
  borderRadius: "10px", color: "hsl(var(--popover-foreground))", fontSize: 12,
};

export default function ReportsPage() {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const { toast } = useToast();

  const { data: summary,   isLoading: sl } = useDashboardSummary(year, month);
  const { data: forecast = [] }             = useForecast();
  const { data: savings  = [], isLoading: savL } = useSavingsReport();
  const { data: catData,   isLoading: catL }     = useCategoryReport();
  const { data: txResult }                  = useTransactions({ year, pageSize: 1000 });
  const { data: budgets = [] }              = useBudgets(year, month);

  const transactions = txResult?.data ?? [];

  const totalSavings    = savings.reduce((s, m) => s + m.savings, 0);
  const avgIncome       = savings.length ? savings.reduce((s, m) => s + m.income, 0) / savings.length : 0;
  const avgExpense      = savings.length ? savings.reduce((s, m) => s + m.expense, 0) / savings.length : 0;
  const savingsRate     = avgIncome > 0 ? ((avgIncome - avgExpense) / avgIncome) * 100 : 0;

  const handleMonthlyPDF = async () => {
    const { generateMonthlyPDF } = await import("@/lib/pdf");
    const monthTx = transactions.filter((t) => { const d = new Date(t.date); return d.getFullYear() === year && d.getMonth() === month; });
    generateMonthlyPDF(monthTx, [], budgets, year, month);
    toast({ title: "Aylık PDF oluşturuldu" });
  };

  const handleYearlyPDF = async () => {
    const { generateYearlyPDF } = await import("@/lib/pdf");
    const yearTx = transactions.filter((t) => new Date(t.date).getFullYear() === year);
    generateYearlyPDF(yearTx, year);
    toast({ title: "Yıllık PDF oluşturuldu" });
  };

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Raporlar & Tahmin</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Detaylı finansal analiz ve projeksiyonlar</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>{MONTH_NAMES.map((n, i) => <SelectItem key={i} value={String(i)}>{n}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>{[2022,2023,2024,2025,2026].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" onClick={handleMonthlyPDF}><FileText className="w-4 h-4" /> Aylık PDF</Button>
          <Button variant="outline" onClick={handleYearlyPDF}><Download className="w-4 h-4" /> Yıllık PDF</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="12 Ay Tasarruf"   value={formatCurrency(totalSavings)}  color={totalSavings >= 0 ? "indigo" : "red"} icon={<TrendingUp className="w-4 h-4" />} loading={savL} />
        <StatCard label="Ort. Aylık Gelir"  value={formatCurrency(avgIncome)}     color="green"  icon={<TrendingUp className="w-4 h-4" />}   loading={savL} />
        <StatCard label="Ort. Aylık Gider"  value={formatCurrency(avgExpense)}    color="red"    icon={<TrendingDown className="w-4 h-4" />}  loading={savL} />
        <StatCard label="Tasarruf Oranı"   value={`%${savingsRate.toFixed(1)}`}  color={savingsRate >= 20 ? "green" : savingsRate >= 10 ? "blue" : "amber"} icon={<BarChart3 className="w-4 h-4" />} loading={savL} sub={savingsRate >= 20 ? "Mükemmel 🎉" : savingsRate >= 10 ? "İyi" : "Geliştirilebilir"} />
      </div>

      {/* Forecast */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">📈 12 Aylık Nakit Akışı Tahmini</CardTitle>
          <p className="text-xs text-muted-foreground">Son 6 ayın ortalaması ve tekrarlayan ödemeler baz alınmıştır.</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={forecast} margin={{ left: -20 }}>
              <defs>
                <linearGradient id="incF" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                <linearGradient id="expF" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={TS} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="projectedIncome"  name="Tahmini Gelir" stroke="#10b981" fill="url(#incF)" strokeWidth={2} />
              <Area type="monotone" dataKey="projectedExpense" name="Tahmini Gider" stroke="#ef4444" fill="url(#expF)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Savings & Category grid */}
      <div className="grid xl:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">💰 Aylık Tasarruf Analizi</CardTitle></CardHeader>
          <CardContent>
            {savL ? <Skeleton className="h-52" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={savings} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={TS} />
                  <Bar dataKey="savings" name="Net Tasarruf" radius={[4,4,0,0]}>
                    {savings.map((m, i) => <Cell key={i} fill={m.savings >= 0 ? "#6366f1" : "#ef4444"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">📊 Kategori Harcama Dağılımı</CardTitle></CardHeader>
          <CardContent>
            {catL ? <Skeleton className="h-52" /> : (catData?.expense?.length ?? 0) > 0 ? (
              <div className="space-y-3">
                {catData!.expense.slice(0, 7).map((cat, i) => (
                  <div key={cat.category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{cat.label}</span>
                      <span className="text-muted-foreground">{formatCurrency(cat.amount)} <span className="text-xs">(%{cat.percentage})</span></span>
                    </div>
                    <Progress value={cat.percentage} className="h-2" indicatorClassName="" style={{ "--tw-bg": CHART_COLORS[i] } as never} />
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">Yeterli harcama verisi yok</p>}
          </CardContent>
        </Card>
      </div>

      {/* Forecast table */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">🗓️ 12 Aylık Tahmin Tablosu</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Ay","Tahmini Gelir","Tahmini Gider","Net"].map((h) => (
                    <th key={h} className="text-left py-2 px-3 text-xs font-bold text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {forecast.map((m, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-3 font-medium">{m.label}</td>
                    <td className="py-2.5 px-3 text-emerald-600 font-medium">{formatCurrency(m.projectedIncome)}</td>
                    <td className="py-2.5 px-3 text-destructive font-medium">{formatCurrency(m.projectedExpense)}</td>
                    <td className={`py-2.5 px-3 font-bold ${m.net >= 0 ? "text-primary" : "text-destructive"}`}>
                      {m.net >= 0 ? "+" : ""}{formatCurrency(m.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
