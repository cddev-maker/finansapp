"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, buildSearchParams } from "@/lib/utils";
import type { Budget, CreateBudgetInput, UpdateBudgetInput } from "@/types";

export function useBudgets(year?: number, month?: number) {
  const now = new Date();
  const y   = year  ?? now.getFullYear();
  const m   = month ?? now.getMonth();
  return useQuery({
    queryKey: ["budgets", y, m],
    queryFn:  () => apiFetch<{ data: Budget[] }>(`/api/budgets?${buildSearchParams({ year: y, month: m })}`).then((r) => r.data),
  });
}

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBudgetInput) =>
      apiFetch<{ data: Budget }>("/api/budgets", { method: "POST", body: JSON.stringify(input) }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
  });
}

export function useUpdateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...rest }: UpdateBudgetInput) =>
      apiFetch<{ data: Budget }>(`/api/budgets/${id}`, { method: "PATCH", body: JSON.stringify(rest) }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/budgets/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
  });
}
