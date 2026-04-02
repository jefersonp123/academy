import { supabaseAdmin } from '../../config/supabase.js';
import { AppError } from '../../core/errors/AppError.js';

export async function list(academyId, filters) {
  let query = supabaseAdmin
    .from('categories')
    .select('id, name, age_min, age_max, sort_order, status, created_at')
    .eq('academy_id', academyId)
    .order('sort_order', { ascending: true });

  if (filters.status) query = query.eq('status', filters.status);

  const { data, error } = await query;
  if (error) throw new AppError('Failed to fetch categories', 500, 'FETCH_FAILED');
  return data;
}

export async function create(academyId, payload, createdBy) {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .insert({ academy_id: academyId, ...payload, status: 'active', created_by: createdBy })
    .select()
    .single();

  if (error) throw new AppError('Failed to create category', 500, 'CREATE_FAILED');
  return data;
}

export async function getOne(academyId, id) {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('*, category_fee_versions(id, amount, currency_code, effective_from, effective_to, is_active)')
    .eq('academy_id', academyId)
    .eq('id', id)
    .single();

  if (error) throw new AppError('Category not found', 404, 'NOT_FOUND');
  return data;
}

export async function update(academyId, id, payload) {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('academy_id', academyId)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError('Failed to update category', 500, 'UPDATE_FAILED');
  return data;
}

export async function updateStatus(academyId, id, status) {
  return update(academyId, id, { status });
}

export async function listFees(academyId, categoryId) {
  const { data, error } = await supabaseAdmin
    .from('category_fee_versions')
    .select('*')
    .eq('academy_id', academyId)
    .eq('category_id', categoryId)
    .eq('is_active', true)
    .order('effective_from', { ascending: false });

  if (error) throw new AppError('Failed to fetch fees', 500, 'FETCH_FAILED');
  return data;
}

export async function createFee(academyId, categoryId, { amount, currency_code, effective_from }, createdBy) {
  // Close previous active fee
  await supabaseAdmin
    .from('category_fee_versions')
    .update({ is_active: false, effective_to: effective_from })
    .eq('academy_id', academyId)
    .eq('category_id', categoryId)
    .eq('is_active', true);

  const { data, error } = await supabaseAdmin
    .from('category_fee_versions')
    .insert({
      academy_id: academyId,
      category_id: categoryId,
      amount,
      currency_code,
      effective_from,
      is_active: true,
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) throw new AppError('Failed to create fee version', 500, 'CREATE_FAILED');
  return data;
}

export async function feeHistory(academyId, categoryId) {
  const { data, error } = await supabaseAdmin
    .from('category_fee_versions')
    .select('*')
    .eq('academy_id', academyId)
    .eq('category_id', categoryId)
    .order('effective_from', { ascending: false });

  if (error) throw new AppError('Failed to fetch fee history', 500, 'FETCH_FAILED');
  return data;
}
