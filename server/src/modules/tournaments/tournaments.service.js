import { supabaseAdmin } from '../../config/supabase.js';
import { AppError } from '../../core/errors/AppError.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeResult(ourScore, opponentScore) {
  if (ourScore == null || opponentScore == null) return null;
  if (ourScore > opponentScore) return 'win';
  if (ourScore === opponentScore) return 'draw';
  return 'loss';
}

// ─── Tournaments ─────────────────────────────────────────────────────────────

export async function list(academyId, filters, { from, to }) {
  let query = supabaseAdmin
    .from('tournaments')
    .select('id, name, location, start_date, end_date, status, expected_cost, expected_income, training_group_id, format, is_local_organizer, created_at, training_groups(id, name)', { count: 'exact' })
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
    .select('*, training_groups(id, name)')
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

export async function cancel(academyId, id, cancellation_reason, cancelledBy) {
  const { data: tournament } = await supabaseAdmin
    .from('tournaments')
    .select('status')
    .eq('academy_id', academyId)
    .eq('id', id)
    .single();

  if (!tournament) throw new AppError('Tournament not found', 404, 'NOT_FOUND');
  if (tournament.status === 'cancelled') throw new AppError('Tournament is already cancelled', 400, 'INVALID_STATE');

  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('tournaments')
    .update({ status: 'cancelled', cancellation_reason: cancellation_reason || null, cancelled_by: cancelledBy || null, updated_at: now })
    .eq('academy_id', academyId)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError('Failed to cancel tournament', 500, 'UPDATE_FAILED');

  // Auto-cancel all pending callups
  await supabaseAdmin
    .from('tournament_callups')
    .update({ status: 'cancelled', updated_at: now })
    .eq('tournament_id', id)
    .eq('status', 'pending');

  return data;
}

// ─── Callups ─────────────────────────────────────────────────────────────────

export async function listCallups(academyId, tournamentId) {
  const { data, error } = await supabaseAdmin
    .from('tournament_callups')
    .select(`
      id, status, responded_at, response_notes, created_at,
      athlete_academy_enrollments(id, athletes(id, first_name, last_name), categories(id, name))
    `)
    .eq('academy_id', academyId)
    .eq('tournament_id', tournamentId)
    .order('created_at', { ascending: true });

  if (error) throw new AppError('Failed to fetch callups', 500, 'FETCH_FAILED');
  return data;
}

export async function createCallups(academyId, tournamentId, enrollmentIds) {
  const { data: tournament } = await supabaseAdmin
    .from('tournaments')
    .select('status')
    .eq('academy_id', academyId)
    .eq('id', tournamentId)
    .single();

  if (!tournament) throw new AppError('Tournament not found', 404, 'NOT_FOUND');
  if (tournament.status === 'cancelled') throw new AppError('Cannot add callups to a cancelled tournament', 400, 'INVALID_STATE');

  // Verify enrollments belong to this academy
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
    tournament_id: tournamentId,
    athlete_enrollment_id: id,
    status: 'pending',
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

export async function launchCallups(academyId, tournamentId) {
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

// Returns active athletes eligible for callup:
// - If tournament has a linked training_group, uses that group's athletes
// - Otherwise returns all active enrollments in the academy
// Excludes athletes already in a non-cancelled callup for this tournament
export async function getEligibleAthletes(academyId, tournamentId) {
  const { data: tournament } = await supabaseAdmin
    .from('tournaments')
    .select('id, training_group_id')
    .eq('academy_id', academyId)
    .eq('id', tournamentId)
    .single();

  if (!tournament) throw new AppError('Tournament not found', 404, 'NOT_FOUND');

  // Get enrollment IDs already added (non-cancelled callups)
  const { data: existingCallups } = await supabaseAdmin
    .from('tournament_callups')
    .select('athlete_enrollment_id')
    .eq('tournament_id', tournamentId)
    .neq('status', 'cancelled');

  const alreadyAdded = new Set((existingCallups || []).map((c) => c.athlete_enrollment_id));

  let enrollmentIds = null;

  if (tournament.training_group_id) {
    // Use athletes explicitly assigned to this group
    const { data: groupAthletes } = await supabaseAdmin
      .from('training_group_athletes')
      .select('athlete_enrollment_id')
      .eq('training_group_id', tournament.training_group_id)
      .eq('academy_id', academyId);

    if (groupAthletes && groupAthletes.length > 0) {
      enrollmentIds = groupAthletes.map((ga) => ga.athlete_enrollment_id);
    }
  }

  let query = supabaseAdmin
    .from('athlete_academy_enrollments')
    .select('id, athletes(id, first_name, last_name), categories(id, name)')
    .eq('academy_id', academyId)
    .eq('membership_status', 'active');

  if (enrollmentIds) {
    query = query.in('id', enrollmentIds);
  }

  const { data, error } = await query;
  if (error) throw new AppError('Failed to fetch eligible athletes', 500, 'FETCH_FAILED');

  // Exclude already-added athletes
  return (data || []).filter((e) => !alreadyAdded.has(e.id));
}

// ─── Costs ───────────────────────────────────────────────────────────────────

export async function listCosts(academyId, tournamentId) {
  const { data, error } = await supabaseAdmin
    .from('tournament_costs')
    .select('*')
    .eq('academy_id', academyId)
    .eq('tournament_id', tournamentId)
    .order('created_at', { ascending: true });

  if (error) throw new AppError('Failed to fetch costs', 500, 'FETCH_FAILED');
  return data;
}

export async function createCost(academyId, tournamentId, payload) {
  const { data: tournament } = await supabaseAdmin
    .from('tournaments')
    .select('status')
    .eq('academy_id', academyId)
    .eq('id', tournamentId)
    .single();

  if (!tournament) throw new AppError('Tournament not found', 404, 'NOT_FOUND');
  if (tournament.status === 'cancelled') throw new AppError('Cannot add costs to a cancelled tournament', 400, 'INVALID_STATE');

  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from('tournament_costs')
    .insert({ academy_id: academyId, tournament_id: tournamentId, ...payload, created_at: now, updated_at: now })
    .select()
    .single();

  if (error) throw new AppError('Failed to create cost', 500, 'CREATE_FAILED');
  return data;
}

export async function updateCost(academyId, tournamentId, costId, payload) {
  const { data, error } = await supabaseAdmin
    .from('tournament_costs')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('academy_id', academyId)
    .eq('tournament_id', tournamentId)
    .eq('id', costId)
    .select()
    .single();

  if (error || !data) throw new AppError('Cost not found or update failed', 404, 'NOT_FOUND');
  return data;
}

export async function deleteCost(academyId, tournamentId, costId) {
  const { error } = await supabaseAdmin
    .from('tournament_costs')
    .delete()
    .eq('academy_id', academyId)
    .eq('tournament_id', tournamentId)
    .eq('id', costId);

  if (error) throw new AppError('Failed to delete cost', 500, 'DELETE_FAILED');
}

// ─── Matches ─────────────────────────────────────────────────────────────────

export async function listMatches(academyId, tournamentId) {
  const { data, error } = await supabaseAdmin
    .from('tournament_matches')
    .select(`
      *,
      tournament_match_athletes(
        id, attended, goals, assists, yellow_cards, red_cards, is_injured, injury_notes, performance_note,
        athlete_academy_enrollments(id, athletes(id, first_name, last_name))
      )
    `)
    .eq('academy_id', academyId)
    .eq('tournament_id', tournamentId)
    .order('match_date', { ascending: true, nullsFirst: false });

  if (error) throw new AppError('Failed to fetch matches', 500, 'FETCH_FAILED');
  return data;
}

export async function createMatch(academyId, tournamentId, payload, createdBy) {
  const { data: tournament } = await supabaseAdmin
    .from('tournaments')
    .select('status')
    .eq('academy_id', academyId)
    .eq('id', tournamentId)
    .single();

  if (!tournament) throw new AppError('Tournament not found', 404, 'NOT_FOUND');
  if (tournament.status === 'cancelled') throw new AppError('Cannot add matches to a cancelled tournament', 400, 'INVALID_STATE');

  const result = computeResult(payload.our_score, payload.opponent_score);
  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('tournament_matches')
    .insert({
      academy_id: academyId,
      tournament_id: tournamentId,
      ...payload,
      result,
      created_by: createdBy,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (error) throw new AppError('Failed to create match', 500, 'CREATE_FAILED');
  return data;
}

export async function updateMatch(academyId, tournamentId, matchId, payload) {
  // Recompute result if scores are being updated
  const result = ('our_score' in payload || 'opponent_score' in payload)
    ? computeResult(payload.our_score ?? null, payload.opponent_score ?? null)
    : undefined;

  const updatePayload = { ...payload, updated_at: new Date().toISOString() };
  if (result !== undefined) updatePayload.result = result;

  const { data, error } = await supabaseAdmin
    .from('tournament_matches')
    .update(updatePayload)
    .eq('academy_id', academyId)
    .eq('tournament_id', tournamentId)
    .eq('id', matchId)
    .select()
    .single();

  if (error || !data) throw new AppError('Match not found or update failed', 404, 'NOT_FOUND');
  return data;
}

export async function deleteMatch(academyId, tournamentId, matchId) {
  const { error } = await supabaseAdmin
    .from('tournament_matches')
    .delete()
    .eq('academy_id', academyId)
    .eq('tournament_id', tournamentId)
    .eq('id', matchId);

  if (error) throw new AppError('Failed to delete match', 500, 'DELETE_FAILED');
}

// ─── Match athletes ───────────────────────────────────────────────────────────

export async function upsertMatchAthletes(academyId, matchId, records) {
  // Verify the match belongs to this academy
  const { data: match } = await supabaseAdmin
    .from('tournament_matches')
    .select('id')
    .eq('academy_id', academyId)
    .eq('id', matchId)
    .single();

  if (!match) throw new AppError('Match not found', 404, 'NOT_FOUND');

  const upsertData = records.map((r) => ({
    academy_id: academyId,
    tournament_match_id: matchId,
    athlete_enrollment_id: r.athlete_enrollment_id,
    attended: r.attended ?? false,
    goals: r.goals ?? 0,
    assists: r.assists ?? 0,
    yellow_cards: r.yellow_cards ?? 0,
    red_cards: r.red_cards ?? 0,
    is_injured: r.is_injured ?? false,
    injury_notes: r.injury_notes ?? null,
    performance_note: r.performance_note ?? null,
  }));

  const { data, error } = await supabaseAdmin
    .from('tournament_match_athletes')
    .upsert(upsertData, { onConflict: 'tournament_match_id,athlete_enrollment_id' })
    .select();

  if (error) throw new AppError('Failed to save match athletes', 500, 'UPSERT_FAILED');
  return data;
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export async function getStats(academyId, tournamentId) {
  const [matchesResult, callupsResult, costsResult] = await Promise.all([
    supabaseAdmin
      .from('tournament_matches')
      .select('our_score, opponent_score, result')
      .eq('academy_id', academyId)
      .eq('tournament_id', tournamentId),
    supabaseAdmin
      .from('tournament_callups')
      .select('status')
      .eq('academy_id', academyId)
      .eq('tournament_id', tournamentId),
    supabaseAdmin
      .from('tournament_costs')
      .select('amount, is_confirmed')
      .eq('academy_id', academyId)
      .eq('tournament_id', tournamentId),
  ]);

  if (matchesResult.error) throw new AppError('Failed to fetch stats', 500, 'FETCH_FAILED');

  const matches = matchesResult.data || [];
  const callups = callupsResult.data || [];
  const costs = costsResult.data || [];

  const matchStats = {
    total: matches.length,
    wins: 0,
    draws: 0,
    losses: 0,
    goals_scored: 0,
    goals_conceded: 0,
    goal_difference: 0,
    points: 0,
  };

  for (const m of matches) {
    if (m.result === 'win') { matchStats.wins++; matchStats.points += 3; }
    else if (m.result === 'draw') { matchStats.draws++; matchStats.points += 1; }
    else if (m.result === 'loss') matchStats.losses++;
    if (m.our_score != null) matchStats.goals_scored += m.our_score;
    if (m.opponent_score != null) matchStats.goals_conceded += m.opponent_score;
  }
  matchStats.goal_difference = matchStats.goals_scored - matchStats.goals_conceded;

  const callupStats = {
    total: callups.length,
    accepted: callups.filter((c) => c.status === 'accepted').length,
    declined: callups.filter((c) => c.status === 'declined').length,
    pending: callups.filter((c) => c.status === 'pending').length,
    cancelled: callups.filter((c) => c.status === 'cancelled').length,
  };

  const costStats = {
    total_estimated: costs.reduce((sum, c) => sum + Number(c.amount), 0),
    total_confirmed: costs.filter((c) => c.is_confirmed).reduce((sum, c) => sum + Number(c.amount), 0),
  };

  return { matches: matchStats, callups: callupStats, costs: costStats };
}
