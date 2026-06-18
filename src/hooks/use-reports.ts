"use client";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, buildSearchParams } from "@/lib/utils";
import type { DashboardSummary, ForecastMonth, MonthlyData, CategoryBreakdown } from "@/types";

export function useDashboardSummary(year?: number, month?: number) {
  const now = new Date();
  const y   = year  ?? now.getFullYear();
  const m   = month ?? now.getMonth();
  return useQuery({
    queryKey: ["reports", "dashboard", y, m],
    queryFn:  () => apiFetch<{ data: DashboardSummary }>(`/api/reports?${buildSearchParams({ type: "dashboard", year: y, month: m })}`).then((r) => r.data),
  });
}

export function useForecast() {
  return useQuery({
    queryKey: ["reports", "forecast"],
    queryFn:  () => apiFetch<{ data: ForecastMonth[] }>("/api/reports?type=forecast").then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useSavingsReport() {
  return useQuery({
    queryKey: ["reports", "savings"],
    queryFn:  () => apiFetch<{ data: MonthlyData[] }>("/api/reports?type=savings").then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useCategoryReport() {
  return useQuery({
    queryKey: ["reports", "category"],
    queryFn:  () => apiFetch<{ data: { income: CategoryBreakdown[]; expense: CategoryBreakdown[] } }>("/api/reports?type=category").then((r) => r.data),
    staleTime: 60_000,
  });
}
