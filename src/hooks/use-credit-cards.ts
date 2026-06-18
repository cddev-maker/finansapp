"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/utils";
import type { CreditCard, CreateCreditCardInput, UpdateCreditCardInput } from "@/types";

export function useCreditCards() {
  return useQuery({
    queryKey: ["credit-cards"],
    queryFn:  () => apiFetch<{ data: CreditCard[] }>("/api/credit-cards").then((r) => r.data),
  });
}

export function useCreateCreditCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCreditCardInput) =>
      apiFetch<{ data: CreditCard }>("/api/credit-cards", { method: "POST", body: JSON.stringify(input) }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["credit-cards"] }),
  });
}

export function useUpdateCreditCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...rest }: UpdateCreditCardInput) =>
      apiFetch<{ data: CreditCard }>(`/api/credit-cards/${id}`, { method: "PATCH", body: JSON.stringify(rest) }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["credit-cards"] }),
  });
}

export function useDeleteCreditCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/credit-cards/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["credit-cards"] }),
  });
}
