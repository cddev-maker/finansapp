"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, buildSearchParams } from "@/lib/utils";
import type { Payment, PaymentFilters, CreatePaymentInput, UpdatePaymentInput } from "@/types";

export function usePayments(filters?: PaymentFilters) {
  return useQuery({
    queryKey: ["payments", filters],
    queryFn:  () => apiFetch<{ data: Payment[] }>(`/api/payments?${buildSearchParams(filters as Record<string, string>)}`).then((r) => r.data),
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePaymentInput) =>
      apiFetch<{ data: Payment }>("/api/payments", { method: "POST", body: JSON.stringify(input) }).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payments"] }); qc.invalidateQueries({ queryKey: ["reports"] }); },
  });
}

export function useUpdatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...rest }: UpdatePaymentInput) =>
      apiFetch<{ data: Payment }>(`/api/payments/${id}`, { method: "PATCH", body: JSON.stringify(rest) }).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payments"] }); qc.invalidateQueries({ queryKey: ["reports"] }); },
  });
}

export function useDeletePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/payments/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payments"] }),
  });
}
