"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, buildSearchParams } from "@/lib/utils";
import type { Transaction, TransactionFilters, CreateTransactionInput, UpdateTransactionInput } from "@/types";

type ListResponse = { data: Transaction[]; total: number; page: number; pageSize: number };

export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: ["transactions", filters],
    queryFn:  () => apiFetch<{ data: ListResponse }>(`/api/transactions?${buildSearchParams(filters as Record<string, string>)}`).then((r) => r.data),
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTransactionInput) =>
      apiFetch<{ data: Transaction }>("/api/transactions", { method: "POST", body: JSON.stringify(input) }).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["transactions"] }); qc.invalidateQueries({ queryKey: ["reports"] }); },
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...rest }: UpdateTransactionInput) =>
      apiFetch<{ data: Transaction }>(`/api/transactions/${id}`, { method: "PATCH", body: JSON.stringify(rest) }).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["transactions"] }); qc.invalidateQueries({ queryKey: ["reports"] }); },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/transactions/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["transactions"] }); qc.invalidateQueries({ queryKey: ["reports"] }); },
  });
}
