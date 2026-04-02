import { supabaseAdmin } from '../../config/supabase.js';
import { AppError } from '../../core/errors/AppError.js';

export async function list(academyId, filters, { from, to }) {
  let query = supabaseAdmin
    .from('extra_incomes')
    .select('*, income_categories(id, name)', { count: 'exact' })
    .eq('academy_id', academyId)
    .neq('status', 'archived')
    .order('income_date', { ascending: false })
    .range(from, to);

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.from) query = query.gte('income_date', filters.from);
  if (filters.to) query = query.lte('income_date', filters.to);
  if (filters.tournamentId) query = query.eq('tournament_id', filters.tournamentId);

  const { data, error, count } = await query;
  if (error) throw new AppError('Failed to fetch incomes', 500, 'FETCH_FAILED');
  return { data, total: count };
}

export async function create(academyId, payload, createdBy) {
  const { data, error } = await supabaseAdmin
    .from('extra_incomes')
    .insert({ academy_id: academyId, ...payload, status: 'draft', created_by: createdBy })
    .select()
    .single();

  if (error) throw new AppError('Failed to create income', 500, 'CREATE_FAILED');
  return data;
}

export async function getOne(academyId, id) {
  const { data, error } = await supabaseAdmin
    .from('extra_incomes')
    .select('*, income_categories(id, name)')
    .eq('academy_id', academyId)
    .eq('id', id)
    .single();

  if (error) throw new AppError('Income not found', 404, 'NOT_FOUND');
  return data;
}

export async function update(academyId, id, payload) {
  const { data: income } = await supabaseAdmin
    .from('extra_incomes')
    .select('status')
    .eq('academy_id', academyId)
    .eq('id', id)
    .single();

  if (!income) throw new AppError('Income not found', 404, 'NOT_FOUND');
  if (income.status === 'archived') throw new AppError('Cannot update an archived income', 400, 'INVALID_STATE');

  const { data, error } = await supabaseAdmin
    .from('extra_incomes')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('academy_id', academyId)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError('Failed to update income', 500, 'UPDATE_FAILED');
  return data;
}

export async function archive(academyId, id) {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from('extra_incomes')
    .update({ status: 'archived', archived_at: now, updated_at: now })
    .eq('academy_id', academyId)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError('Failed to archive income', 500, 'UPDATE_FAILED');
  return data;
}
