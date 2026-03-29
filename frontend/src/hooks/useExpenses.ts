import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseApi } from '../lib/api';
import { Expense, AuditLog } from '../types';

export function useMyExpenses() {
  return useQuery<Expense[]>({
    queryKey: ['expenses', 'me'],
    queryFn: async () => {
      const res = await expenseApi.getMyExpenses();
      return res.data.data;
    },
  });
}

export function usePendingExpenses() {
  return useQuery<Expense[]>({
    queryKey: ['expenses', 'pending'],
    queryFn: async () => {
      const res = await expenseApi.getPending();
      return res.data.data;
    },
  });
}

export function useAllExpenses(params?: object) {
  return useQuery<Expense[]>({
    queryKey: ['expenses', 'all', params],
    queryFn: async () => {
      const res = await expenseApi.getAll(params);
      return res.data.data;
    },
  });
}

export function useExpenseAudit(expenseId: string) {
  return useQuery<AuditLog[]>({
    queryKey: ['expenses', expenseId, 'audit'],
    queryFn: async () => {
      const res = await expenseApi.getAudit(expenseId);
      return res.data.data;
    },
    enabled: !!expenseId,
  });
}

export function useSubmitExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => expenseApi.submit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

export function useApproveExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      expenseApi.approve(id, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

export function useRejectExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) =>
      expenseApi.reject(id, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

export function useOCR() {
  return useMutation({
    mutationFn: ({ image_base64, mime_type }: { image_base64: string; mime_type: string }) =>
      expenseApi.ocr(image_base64, mime_type),
  });
}
