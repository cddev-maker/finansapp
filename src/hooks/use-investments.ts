"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/utils";
import type { Investment, CreateInvestmentInput, UpdateInvestmentInput, PriceHistoryPoint } from "@/types";

export function useInvestments() {
  return useQuery({
    queryKey: ["investments"],
    queryFn:  () => apiFetch<{ data: Investment[] }>("/api/investments").then((r) => r.data),
  });
}

export function useCreateInvestment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInvestmentInput) =>
      apiFetch<{ data: Investment }>("/api/investments", { method: "POST", body: JSON.stringify(input) }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["investments"] }),
  });
}

export function useUpdateInvestment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...rest }: UpdateInvestmentInput) =>
      apiFetch<{ data: Investment }>(`/api/investments/${id}`, { method: "PATCH", body: JSON.stringify(rest) }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["investments"] }),
  });
}

export function useDeleteInvestment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/investments/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["investments"] }),
  });
}

export function useRefreshPrices() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<{ data: { updated: number; failed: number; total: number } }>("/api/investments/refresh-prices", { method: "POST" }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["investments"] }),
  });
}

export function usePriceHistory(type: string, symbol: string, range: string, enabled: boolean) {
  return useQuery({
    queryKey: ["price-history", type, symbol, range],
    queryFn:  () => apiFetch<{ data: PriceHistoryPoint[] }>(`/api/investments/history?type=${type}&symbol=${encodeURIComponent(symbol)}&range=${range}`).then((r) => r.data),
    enabled,
    staleTime: 60_000,
  });
}
