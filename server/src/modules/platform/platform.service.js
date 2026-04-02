import { supabaseAdmin } from '../../config/supabase.js';
import { AppError } from '../../core/errors/AppError.js';

export async function listAcademies(filters, { from, to }) {
  let query = supabaseAdmin
    .from('academies')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.country) query = query.eq('country', filters.country);

  const { data, error, count } = await query;
  if (error) throw new AppError('Failed to fetch academies', 500, 'FETCH_FAILED');
  return { data, total: count };
}

export async function createAcademy(payload, createdBy) {
  const { data: existing } = await supabaseAdmin
    .from('academies')
    .select('id')
    .eq('slug', payload.slug)
    .maybeSingle();

  if (existing) throw new AppError('Slug already taken', 409, 'SLUG_TAKEN');

  const { data, error } = await supabaseAdmin
    .from('academies')
    .insert({ ...payload, status: 'active' })
    .select()
    .single();

  if (error) throw new AppError('Failed to create academy', 500, 'CREATE_FAILED');

  // Auto-create owner membership
  await supabaseAdmin.from('academy_memberships').insert({
    academy_id: data.id,
    profile_id: payload.owner_profile_id,
    role_code: 'academy_owner',
    status: 'active',
    joined_at: new Date().toISOString(),
  });

  return data;
}

export async function getAcademy(id) {
  const { data, error } = await supabaseAdmin
    .from('academies')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new AppError('Academy not found', 404, 'NOT_FOUND');
  return data;
}

export async function updateAcademy(id, payload) {
  const { data, error } = await supabaseAdmin
    .from('academies')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError('Failed to update academy', 500, 'UPDATE_FAILED');
  return data;
}

export async function updateAcademyStatus(id, status) {
  const { data, error } = await supabaseAdmin
    .from('academies')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError('Failed to update academy status', 500, 'UPDATE_FAILED');
  return data;
}

export async function getOverview() {
  const [academiesRes, membershipsRes, athletesRes] = await Promise.all([
    supabaseAdmin.from('academies').select('id, status', { count: 'exact' }),
    supabaseAdmin.from('academy_memberships').select('id', { count: 'exact' }).eq('status', 'active'),
    supabaseAdmin.from('athlete_academy_enrollments').select('id', { count: 'exact' }).eq('membership_status', 'active'),
  ]);

  return {
    total_academies: academiesRes.count,
    total_active_memberships: membershipsRes.count,
    total_active_athletes: athletesRes.count,
  };
}

export async function getConsolidatedFinance({ year, month }) {
  const filters = {};
  if (year) filters.year = parseInt(year);
  if (month) filters.month = parseInt(month);

  const { data, error } = await supabaseAdmin
    .from('vw_platform_consolidated_pnl')
    .select('*');

  if (error) throw new AppError('Failed to fetch consolidated finance', 500, 'FETCH_FAILED');
  return data;
}
