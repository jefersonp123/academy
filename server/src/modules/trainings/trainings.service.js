import { supabaseAdmin } from '../../config/supabase.js';
import { AppError } from '../../core/errors/AppError.js';

export async function listGroups(academyId, filters) {
  let query = supabaseAdmin
    .from('training_groups')
    .select('id, name, location, status, created_at, categories(id, name)')
    .eq('academy_id', academyId)
    .order('name', { ascending: true });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.categoryId) query = query.eq('category_id', filters.categoryId);

  const { data, error } = await query;
  if (error) throw new AppError('Failed to fetch training groups', 500, 'FETCH_FAILED');
  return data;
}

export async function createGroup(academyId, payload, createdBy) {
  const { data, error } = await supabaseAdmin
    .from('training_groups')
    .insert({ academy_id: academyId, ...payload, status: 'active', created_by: createdBy })
    .select()
    .single();

  if (error) throw new AppError('Failed to create training group', 500, 'CREATE_FAILED');
  return data;
}

export async function getGroup(academyId, id) {
  const { data, error } = await supabaseAdmin
    .from('training_groups')
    .select('*, categories(id, name)')
    .eq('academy_id', academyId)
    .eq('id', id)
    .single();

  if (error) throw new AppError('Training group not found', 404, 'NOT_FOUND');
  return data;
}

export async function updateGroup(academyId, id, payload) {
  const { data, error } = await supabaseAdmin
    .from('training_groups')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('academy_id', academyId)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError('Failed to update training group', 500, 'UPDATE_FAILED');
  return data;
}

export async function listSessions(academyId, filters, { from, to }) {
  let query = supabaseAdmin
    .from('training_sessions')
    .select('*, training_groups(id, name)', { count: 'exact' })
    .eq('academy_id', academyId)
    .order('session_date', { ascending: false })
    .range(from, to);

  if (filters.groupId) query = query.eq('training_group_id', filters.groupId);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.from) query = query.gte('session_date', filters.from);
  if (filters.to) query = query.lte('session_date', filters.to);

  const { data, error, count } = await query;
  if (error) throw new AppError('Failed to fetch sessions', 500, 'FETCH_FAILED');
  return { data, total: count };
}

export async function createSession(academyId, payload, createdBy) {
  const { data: group } = await supabaseAdmin
    .from('training_groups')
    .select('id')
    .eq('academy_id', academyId)
    .eq('id', payload.training_group_id)
    .single();

  if (!group) throw new AppError('Training group not found in this academy', 404, 'NOT_FOUND');

  const { data, error } = await supabaseAdmin
    .from('training_sessions')
    .insert({ academy_id: academyId, ...payload, status: 'scheduled', is_enabled: true, created_by: createdBy })
    .select()
    .single();

  if (error) throw new AppError('Failed to create session', 500, 'CREATE_FAILED');
  return data;
}

export async function getSession(academyId, id) {
  const { data, error } = await supabaseAdmin
    .from('training_sessions')
    .select('*, training_groups(id, name)')
    .eq('academy_id', academyId)
    .eq('id', id)
    .single();

  if (error) throw new AppError('Session not found', 404, 'NOT_FOUND');
  return data;
}

export async function updateSession(academyId, id, payload) {
  const { data: session } = await supabaseAdmin
    .from('training_sessions')
    .select('status')
    .eq('academy_id', academyId)
    .eq('id', id)
    .single();

  if (!session) throw new AppError('Session not found', 404, 'NOT_FOUND');
  if (session.status === 'cancelled') throw new AppError('Cannot update a cancelled session', 400, 'INVALID_STATE');

  const { data, error } = await supabaseAdmin
    .from('training_sessions')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('academy_id', academyId)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError('Failed to update session', 500, 'UPDATE_FAILED');
  return data;
}

export async function cancelSession(academyId, id, cancellation_reason) {
  const { data: session } = await supabaseAdmin
    .from('training_sessions')
    .select('status')
    .eq('academy_id', academyId)
    .eq('id', id)
    .single();

  if (!session) throw new AppError('Session not found', 404, 'NOT_FOUND');
  if (session.status === 'cancelled') throw new AppError('Session is already cancelled', 400, 'INVALID_STATE');

  const { data, error } = await supabaseAdmin
    .from('training_sessions')
    .update({ status: 'cancelled', cancellation_reason: cancellation_reason || null, is_enabled: false, updated_at: new Date().toISOString() })
    .eq('academy_id', academyId)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError('Failed to cancel session', 500, 'UPDATE_FAILED');
  return data;
}
