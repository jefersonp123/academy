import { supabaseAdmin } from '../../config/supabase.js';
import { AppError } from '../../core/errors/AppError.js';

export async function list(academyId, filters, { from, to }) {
  let query = supabaseAdmin
    .from('expenses')
    .select('*, expense_categories(id, name)', { count: 'exact' })
    .eq('academy_id', academyId)
    .neq('status', 'archived')
    .order('expense_date', { ascending: false })
    .range(from, to);

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.category) query = query.eq('category_id', filters.category);
  if (filters.from) query = query.gte('expense_date', filters.from);
  if (filters.to) query = query.lte('expense_date', filters.to);
  if (filters.tournamentId) query = query.eq('tournament_id', filters.tournamentId);

  const { data, error, count } = await query;
  if (error) throw new AppError('Failed to fetch expenses', 500, 'FETCH_FAILED');
  return { data, total: count };
}

export async function create(academyId, payload, createdBy) {
  const { data, error } = await supabaseAdmin
    .from('expenses')
    .insert({ academy_id: academyId, ...payload, status: 'draft', created_by: createdBy })
    .select()
    .single();

  if (error) throw new AppError('Failed to create expense', 500, 'CREATE_FAILED');
  return data;
}

export async function getOne(academyId, id) {
  const { data, error } = await supabaseAdmin
    .from('expenses')
    .select('*, expense_categories(id, name)')
    .eq('academy_id', academyId)
    .eq('id', id)
    .single();

  if (error) throw new AppError('Expense not found', 404, 'NOT_FOUND');
  return data;
}

export async function update(academyId, id, payload) {
  const { data: expense } = await supabaseAdmin
    .from('expenses')
    .select('status')
    .eq('academy_id', academyId)
    .eq('id', id)
    .single();

  if (!expense) throw new AppError('Expense not found', 404, 'NOT_FOUND');
  if (expense.status === 'archived') throw new AppError('Cannot update an archived expense', 400, 'INVALID_STATE');

  const { data, error } = await supabaseAdmin
    .from('expenses')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('academy_id', academyId)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError('Failed to update expense', 500, 'UPDATE_FAILED');
  return data;
}

export async function archive(academyId, id) {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from('expenses')
    .update({ status: 'archived', archived_at: now, updated_at: now })
    .eq('academy_id', academyId)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError('Failed to archive expense', 500, 'UPDATE_FAILED');
  return data;
}

export async function listCategories(academyId) {
  const { data, error } = await supabaseAdmin
    .from('expense_categories')
    .select('*')
    .eq('academy_id', academyId)
    .eq('status', 'active')
    .order('name', { ascending: true });

  if (error) throw new AppError('Failed to fetch expense categories', 500, 'FETCH_FAILED');
  return data;
}

export async function createCategory(academyId, payload) {
  const { data, error } = await supabaseAdmin
    .from('expense_categories')
    .insert({ academy_id: academyId, ...payload, status: 'active' })
    .select()
    .single();

  if (error) throw new AppError('Failed to create expense category', 500, 'CREATE_FAILED');
  return data;
}

export async function updateCategory(academyId, categoryId, payload) {
  const { data, error } = await supabaseAdmin
    .from('expense_categories')
    .update(payload)
    .eq('academy_id', academyId)
    .eq('id', categoryId)
    .select()
    .single();

  if (error) throw new AppError('Failed to update expense category', 500, 'UPDATE_FAILED');
  return data;
}
