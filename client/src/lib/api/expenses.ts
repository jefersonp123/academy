import api from './client';
import type { Expense, ExpenseCategory, ListParams } from '@/types';

export const expensesApi = {
  list: (academyId: string, params?: ListParams) =>
    api.get<unknown, { data: Expense[]; meta: unknown }>(`/academies/${academyId}/expenses`, { params }),

  create: (academyId: string, payload: Record<string, unknown>) =>
    api.post<unknown, Expense>(`/academies/${academyId}/expenses`, payload),

  getById: (academyId: string, id: string) =>
    api.get<unknown, Expense>(`/academies/${academyId}/expenses/${id}`),

  update: (academyId: string, id: string, payload: Record<string, unknown>) =>
    api.patch<unknown, Expense>(`/academies/${academyId}/expenses/${id}`, payload),

  archive: (academyId: string, id: string) =>
    api.patch<unknown, Expense>(`/academies/${academyId}/expenses/${id}/archive`),

  listCategories: (academyId: string) =>
    api.get<unknown, ExpenseCategory[]>(`/academies/${academyId}/expense-categories`),

  createCategory: (academyId: string, payload: { name: string; type?: string }) =>
    api.post<unknown, ExpenseCategory>(`/academies/${academyId}/expense-categories`, payload),

  updateCategory: (academyId: string, categoryId: string, payload: Record<string, unknown>) =>
    api.patch<unknown, ExpenseCategory>(`/academies/${academyId}/expense-categories/${categoryId}`, payload),
};
