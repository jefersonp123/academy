import { supabaseAdmin } from '../../config/supabase.js';
import { AppError } from '../../core/errors/AppError.js';

export async function list(academyId, filters, { from, to }) {
  let query = supabaseAdmin
    .from('tournaments')
    .select('id, name, location, start_date, end_date, status, expected_cost, expected_income, created_at', { count: 'exact' })
    .eq('academy_id', academyId)
    .order('start_date', { ascending: false })
    .range(from, to);

  if (filters.status) query = query.eq('status', filters.status);

  const { data, error, count } = await query;
  if (error) throw new AppError('Failed to fetch tournaments', 500, 'FETCH_FAILED');
  return { data, total: count };
}

export async function create(academyId, payload, createdBy) {
  const { data, error } = await supabaseAdmin
    .from('tournaments')
    .insert({ academy_id: academyId, ...payload, status: 'planned', created_by: createdBy })
    .select()
    .single();

  if (error) throw new AppError('Failed to create tournament', 500, 'CREATE_FAILED');
  return data;
}

export async function getOne(academyId, id) {
  const { data, error } = await supabaseAdmin
    .from('tournaments')
    .select('*')
    .eq('academy_id', academyId)
    .eq('id', id)
    .single();

  if (error) throw new AppError('Tournament not found', 404, 'NOT_FOUND');
  return data;
}

export async function update(academyId, id, payload) {
  const { data: tournament } = await supabaseAdmin
    .from('tournaments')
    .select('status')
    .eq('academy_id', academyId)
    .eq('id', id)
    .single();

  if (!tournament) throw new AppError('Tournament not found', 404, 'NOT_FOUND');
  if (tournament.status === 'cancelled') throw new AppError('Cannot update a cancelled tournament', 400, 'INVALID_STATE');

  const { data, error } = await supabaseAdmin
    .from('tournaments')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('academy_id', academyId)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError('Failed to update tournament', 500, 'UPDATE_FAILED');
  return data;
}

export async function cancel(academyId, id) {
  const { data: tournament } = await supabaseAdmin
    .from('tournaments')
    .select('status')
    .eq('academy_id', academyId)
    .eq('id', id)
    .single();

  if (!tournament) throw new AppError('Tournament not found', 404, 'NOT_FOUND');
  if (tournament.status === 'cancelled') throw new AppError('Tournament is already cancelled', 400, 'INVALID_STATE');

  const { data, error } = await supabaseAdmin
    .from('tournaments')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('academy_id', academyId)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError('Failed to cancel tournament', 500, 'UPDATE_FAILED');
  return data;
}

export async function listCallups(academyId, tournamentId) {
  const { data, error } = await supabaseAdmin
    .from('tournament_callups')
    .select(`
      id, status, responded_at, response_notes, created_at,
      athlete_academy_enrollments(id, athletes(id, first_name, last_name))
    `)
    .eq('academy_id', academyId)
    .eq('tournament_id', tournamentId)
    .order('created_at', { ascending: true });

  if (error) throw new AppError('Failed to fetch callups', 500, 'FETCH_FAILED');
  return data;
}

export async function createCallups(academyId, tournamentId, enrollmentIds, createdBy) {
  const { data: tournament } = await supabaseAdmin
    .from('tournaments')
    .select('status')
    .eq('academy_id', academyId)
    .eq('id', tournamentId)
    .single();

  if (!tournament) throw new AppError('Tournament not found', 404, 'NOT_FOUND');
  if (tournament.status === 'cancelled') throw new AppError('Cannot add callups to a cancelled tournament', 400, 'INVALID_STATE');

  const now = new Date().toISOString();
  const records = enrollmentIds.map((id) => ({
    academy_id: academyId,
    tournament_id: tournamentId,
    athlete_enrollment_id: id,
    status: 'pending',
    created_by: createdBy,
    created_at: now,
    updated_at: now,
  }));

  const { data, error } = await supabaseAdmin
    .from('tournament_callups')
    .upsert(records, { onConflict: 'tournament_id,athlete_enrollment_id', ignoreDuplicates: true })
    .select();

  if (error) throw new AppError('Failed to create callups', 500, 'CREATE_FAILED');
  return data;
}

export async function launchCallups(academyId, tournamentId, launchedBy) {
  const { data: tournament } = await supabaseAdmin
    .from('tournaments')
    .select('status')
    .eq('academy_id', academyId)
    .eq('id', tournamentId)
    .single();

  if (!tournament) throw new AppError('Tournament not found', 404, 'NOT_FOUND');
  if (!['planned'].includes(tournament.status)) {
    throw new AppError('Callups can only be launched from planned status', 400, 'INVALID_STATE');
  }

  const { data, error } = await supabaseAdmin
    .from('tournaments')
    .update({ status: 'callup_launched', updated_at: new Date().toISOString() })
    .eq('academy_id', academyId)
    .eq('id', tournamentId)
    .select()
    .single();

  if (error) throw new AppError('Failed to launch callups', 500, 'UPDATE_FAILED');
  return data;
}

export async function respondCallup(profileId, { callup_id, response, response_notes }) {
  // Verify callup belongs to this profile via athlete link
  const { data: callup } = await supabaseAdmin
    .from('tournament_callups')
    .select('id, status, athlete_academy_enrollments(athlete_id)')
    .eq('id', callup_id)
    .single();

  if (!callup) throw new AppError('Callup not found', 404, 'NOT_FOUND');
  if (callup.status !== 'pending') throw new AppError('Callup already responded', 400, 'INVALID_STATE');

  const athleteId = callup.athlete_academy_enrollments?.athlete_id;
  const { data: link } = await supabaseAdmin
    .from('athlete_user_links')
    .select('id')
    .eq('profile_id', profileId)
    .eq('athlete_id', athleteId)
    .maybeSingle();

  // Also allow guardians
  const { data: guardianLink } = await supabaseAdmin
    .from('guardian_links')
    .select('id')
    .eq('guardian_profile_id', profileId)
    .eq('athlete_id', athleteId)
    .maybeSingle();

  if (!link && !guardianLink) {
    throw new AppError('Not authorized to respond to this callup', 403, 'FORBIDDEN');
  }

  const now = new Date().toISOString();
  const newStatus = response === 'accepted' ? 'accepted' : 'declined';

  const { data, error } = await supabaseAdmin
    .from('tournament_callups')
    .update({ status: newStatus, responded_at: now, response_notes: response_notes || null, updated_at: now })
    .eq('id', callup_id)
    .select()
    .single();

  if (error) throw new AppError('Failed to respond to callup', 500, 'UPDATE_FAILED');
  return data;
}
