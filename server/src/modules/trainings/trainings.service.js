import { supabaseAdmin } from '../../config/supabase.js';
import { AppError } from '../../core/errors/AppError.js';

export async function listGroups(academyId, filters) {
  let query = supabaseAdmin
    .from('training_groups')
    .select('id, name, location, status, created_at, athlete_limit, coach_profile_id, categories(id, name), coach:profiles!coach_profile_id(id, first_name, last_name, avatar_url)')
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
    .select('*, categories(id, name), coach:profiles!coach_profile_id(id, first_name, last_name, avatar_url)')
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

// ─── GROUP ATHLETES ──────────────────────────────────────────────────────────

export async function listGroupAthletes(academyId, groupId) {
  const { data: group } = await supabaseAdmin
    .from('training_groups')
    .select('id')
    .eq('academy_id', academyId)
    .eq('id', groupId)
    .single();
  if (!group) throw new AppError('Training group not found', 404, 'NOT_FOUND');

  const { data, error } = await supabaseAdmin
    .from('training_group_athletes')
    .select(`
      id, added_at,
      athlete_academy_enrollments(
        id, membership_status,
        athletes(id, first_name, last_name, birth_date, gender),
        categories(id, name)
      )
    `)
    .eq('training_group_id', groupId)
    .eq('academy_id', academyId)
    .order('added_at', { ascending: true });

  if (error) throw new AppError('Failed to fetch group athletes', 500, 'FETCH_FAILED');
  return data;
}

export async function addGroupAthletes(academyId, groupId, enrollmentIds, addedBy) {
  const { data: group } = await supabaseAdmin
    .from('training_groups')
    .select('id, athlete_limit')
    .eq('academy_id', academyId)
    .eq('id', groupId)
    .single();
  if (!group) throw new AppError('Training group not found', 404, 'NOT_FOUND');

  // Verify limit
  if (group.athlete_limit) {
    const { count: currentCount } = await supabaseAdmin
      .from('training_group_athletes')
      .select('*', { count: 'exact', head: true })
      .eq('training_group_id', groupId);

    if (currentCount + enrollmentIds.length > group.athlete_limit) {
      throw new AppError(`Cannot exceed group athlete limit. Available slots: ${group.athlete_limit - currentCount}`, 400, 'LIMIT_EXCEEDED');
    }
  }

  // Verify all enrollments belong to this academy
  const { data: validEnrollments } = await supabaseAdmin
    .from('athlete_academy_enrollments')
    .select('id')
    .eq('academy_id', academyId)
    .in('id', enrollmentIds);

  const validIds = new Set((validEnrollments || []).map((e) => e.id));
  const invalid = enrollmentIds.filter((id) => !validIds.has(id));
  if (invalid.length > 0) {
    throw new AppError('One or more athletes not found in this academy', 400, 'INVALID_INPUT');
  }

  const now = new Date().toISOString();
  const records = enrollmentIds.map((id) => ({
    academy_id: academyId,
    training_group_id: groupId,
    athlete_enrollment_id: id,
    added_by: addedBy,
    added_at: now,
  }));

  const { data, error } = await supabaseAdmin
    .from('training_group_athletes')
    .upsert(records, { onConflict: 'training_group_id,athlete_enrollment_id', ignoreDuplicates: true })
    .select();

  if (error) throw new AppError('Failed to add athletes to group', 500, 'CREATE_FAILED');
  return data;
}

export async function removeGroupAthlete(academyId, groupId, enrollmentId) {
  const { error } = await supabaseAdmin
    .from('training_group_athletes')
    .delete()
    .eq('academy_id', academyId)
    .eq('training_group_id', groupId)
    .eq('athlete_enrollment_id', enrollmentId);

  if (error) throw new AppError('Failed to remove athlete from group', 500, 'DELETE_FAILED');
}

// ─── SESSIONS ────────────────────────────────────────────────────────────────

export async function listSessions(academyId, filters, { from, to }) {
  let query = supabaseAdmin
    .from('training_sessions')
    .select('*, training_groups(id, name, location)', { count: 'exact' })
    .eq('academy_id', academyId)
    .order('session_date', { ascending: false })
    .range(from, to);

  if (filters.training_group_id) query = query.eq('training_group_id', filters.training_group_id);
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
    .select('*, training_groups(id, name, location)')
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
