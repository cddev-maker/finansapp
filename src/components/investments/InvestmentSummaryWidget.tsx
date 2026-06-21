"use client";
import Link from "next/link";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { useInvestments } from "@/hooks/use-investments";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

export function InvestmentSummaryWidget() {
  const { data: investments = [], isLoading } = useInvestments();

  if (isLoading) return <Skeleton className="h-32 rounded-2xl" />;
  if (investments.length === 0) return null;

  const totalCost  = investments.reduce((s, i) => s + (i.totalCost ?? 0), 0);
  const totalValue = investments.reduce((s, i) => s + (i.currentValue ?? i.totalCost ?? 0), 0);
  const totalPL     = totalValue - totalCost;
  const totalPLPct  = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;
  const isProfit    = totalPL >= 0;

  return (
    <Link href="/investments">
      <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer group">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Yatırım Portföyü</p>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-extrabold">{formatCurrency(totalValue)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{investments.length} yatırım</p>
          </div>
          <div className={`flex items-center gap-1 font-bold text-sm ${isProfit ? "text-emerald-600" : "text-destructive"}`}>
            {isProfit ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {isProfit ? "+" : ""}{formatCurrency(totalPL)}
            <span className="text-xs font-semibold">(%{totalPLPct.toFixed(1)})</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
