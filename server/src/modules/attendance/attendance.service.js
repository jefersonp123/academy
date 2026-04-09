import { supabaseAdmin } from '../../config/supabase.js';
import { AppError } from '../../core/errors/AppError.js';

export async function list(academyId, filters, { from, to }) {
  let query = supabaseAdmin
    .from('attendance_records')
    .select('*, training_sessions(id, session_date, title)', { count: 'exact' })
    .eq('academy_id', academyId)
    .order('recorded_at', { ascending: false })
    .range(from, to);

  if (filters.sessionId) query = query.eq('training_session_id', filters.sessionId);
  if (filters.status) query = query.eq('attendance_status', filters.status);

  const { data, error, count } = await query;
  if (error) throw new AppError('Failed to fetch attendance', 500, 'FETCH_FAILED');
  return { data, total: count };
}

export async function bulkRecord(academyId, { session_id, records }, recordedBy) {
  const { data: session } = await supabaseAdmin
    .from('training_sessions')
    .select('id, status')
    .eq('academy_id', academyId)
    .eq('id', session_id)
    .single();

  if (!session) throw new AppError('Session not found in this academy', 404, 'NOT_FOUND');
  if (session.status === 'cancelled') throw new AppError('Cannot record attendance for a cancelled session', 400, 'INVALID_STATE');

  const now = new Date().toISOString();
  const upsertData = records.map((r) => ({
    academy_id: academyId,
    training_session_id: session_id,
    athlete_enrollment_id: r.athlete_enrollment_id,
    attendance_status: r.attendance_status,
    recorded_by: recordedBy,
    recorded_at: now,
  }));

  const { data, error } = await supabaseAdmin
    .from('attendance_records')
    .upsert(upsertData, { onConflict: 'training_session_id,athlete_enrollment_id' })
    .select();

  if (error) throw new AppError('Failed to record attendance', 500, 'RECORD_FAILED');

  // Mark session completed if not already
  await supabaseAdmin
    .from('training_sessions')
    .update({ status: 'completed', updated_at: now })
    .eq('id', session_id)
    .eq('status', 'scheduled');

  return data;
}

export async function bySession(academyId, sessionId) {
  // 1. Get session → group → category
  const { data: session } = await supabaseAdmin
    .from('training_sessions')
    .select('id, training_group_id, training_groups(id, category_id)')
    .eq('academy_id', academyId)
    .eq('id', sessionId)
    .single();

  if (!session) throw new AppError('Session not found', 404, 'NOT_FOUND');

  const groupId = session.training_group_id;
  const categoryId = session.training_groups?.category_id;

  // 2. Check if the group has explicit athlete assignments (new model)
  const { data: groupAthletes } = await supabaseAdmin
    .from('training_group_athletes')
    .select('athlete_enrollment_id')
    .eq('training_group_id', groupId)
    .eq('academy_id', academyId);

  const hasExplicitAthletes = groupAthletes && groupAthletes.length > 0;

  // 3. Build enrollment query based on assignment model
  let enrollments = [];

  if (hasExplicitAthletes) {
    // New model: use athletes explicitly assigned to this group
    const enrollmentIds = groupAthletes.map((ga) => ga.athlete_enrollment_id);
    const { data, error } = await supabaseAdmin
      .from('athlete_academy_enrollments')
      .select('id, athlete_id, category_id, athletes(id, first_name, last_name), categories(id, name)')
      .eq('academy_id', academyId)
      .eq('membership_status', 'active')
      .in('id', enrollmentIds);
    if (error) throw new AppError('Failed to fetch enrollments', 500, 'FETCH_FAILED');
    enrollments = data ?? [];
  } else if (categoryId) {
    // Legacy fallback: all active athletes in the same category
    const { data, error } = await supabaseAdmin
      .from('athlete_academy_enrollments')
      .select('id, athlete_id, category_id, athletes(id, first_name, last_name), categories(id, name)')
      .eq('academy_id', academyId)
      .eq('membership_status', 'active')
      .eq('category_id', categoryId);
    if (error) throw new AppError('Failed to fetch enrollments', 500, 'FETCH_FAILED');
    enrollments = data ?? [];
  }

  // 4. Get existing attendance records for this session
  const { data: records, error: recErr } = await supabaseAdmin
    .from('attendance_records')
    .select('id, athlete_enrollment_id, attendance_status, recorded_at')
    .eq('academy_id', academyId)
    .eq('training_session_id', sessionId);

  if (recErr) throw new AppError('Failed to fetch attendance records', 500, 'FETCH_FAILED');

  // 5. Build map of existing records by enrollment id
  const recordMap = new Map();
  for (const r of (records || [])) {
    recordMap.set(r.athlete_enrollment_id, r);
  }

  // 6. Merge: every athlete gets a row, with attendance if it exists
  return enrollments.map((enrollment) => {
    const existing = recordMap.get(enrollment.id);
    return {
      id: existing?.id || null,
      academy_id: academyId,
      training_session_id: sessionId,
      athlete_enrollment_id: enrollment.id,
      attendance_status: existing?.attendance_status || null,
      recorded_at: existing?.recorded_at || null,
      athlete_academy_enrollments: {
        id: enrollment.id,
        athletes: enrollment.athletes,
        categories: enrollment.categories,
      },
    };
  });
}

export async function byAthlete(academyId, athleteId, filters, { from, to }) {
  const { data: enrollment } = await supabaseAdmin
    .from('athlete_academy_enrollments')
    .select('id')
    .eq('academy_id', academyId)
    .eq('athlete_id', athleteId)
    .single();

  if (!enrollment) throw new AppError('Athlete not found in this academy', 404, 'NOT_FOUND');

  let query = supabaseAdmin
    .from('attendance_records')
    .select('*, training_sessions(id, session_date, title, training_groups(id, name))', { count: 'exact' })
    .eq('academy_id', academyId)
    .eq('athlete_enrollment_id', enrollment.id)
    .order('recorded_at', { ascending: false })
    .range(from, to);

  if (filters.from) query = query.gte('recorded_at', filters.from);
  if (filters.to) query = query.lte('recorded_at', filters.to);

  const { data, error, count } = await query;
  if (error) throw new AppError('Failed to fetch athlete attendance', 500, 'FETCH_FAILED');
  return { data, total: count };
}
