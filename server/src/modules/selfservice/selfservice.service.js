import { supabaseAdmin } from '../../config/supabase.js';
import { AppError } from '../../core/errors/AppError.js';

async function getAthleteEnrollmentIds(profileId) {
  const [userLinks, guardianLinks] = await Promise.all([
    supabaseAdmin.from('athlete_user_links').select('athlete_id').eq('profile_id', profileId),
    supabaseAdmin.from('guardian_links').select('athlete_id').eq('guardian_profile_id', profileId),
  ]);

  const athleteIds = new Set([
    ...(userLinks.data || []).map((l) => l.athlete_id),
    ...(guardianLinks.data || []).map((l) => l.athlete_id),
  ]);

  if (athleteIds.size === 0) return [];

  const { data: enrollments } = await supabaseAdmin
    .from('athlete_academy_enrollments')
    .select('id, academy_id, athlete_id, category_id')
    .in('athlete_id', [...athleteIds])
    .eq('membership_status', 'active');

  return enrollments || [];
}

export async function dashboard(profileId) {
  const enrollments = await getAthleteEnrollmentIds(profileId);

  const enrollmentIds = enrollments.map((e) => e.id);

  const pendingPayments = enrollmentIds.length > 0
    ? await supabaseAdmin.from('payment_periods').select('id', { count: 'exact' }).in('athlete_enrollment_id', enrollmentIds).in('status', ['pending', 'overdue'])
    : { count: 0 };

  const unreadNotifications = await supabaseAdmin
    .from('notifications')
    .select('id', { count: 'exact' })
    .eq('profile_id', profileId)
    .eq('is_read', false);

  return {
    active_enrollments: enrollments.length,
    pending_payments: pendingPayments.count || 0,
    unread_notifications: unreadNotifications.count || 0,
  };
}

export async function academies(profileId) {
  const { data, error } = await supabaseAdmin
    .from('academy_memberships')
    .select('role_code, status, academies(id, name, slug, sport_type, country)')
    .eq('profile_id', profileId)
    .eq('status', 'active');

  if (error) throw new AppError('Failed to fetch academies', 500, 'FETCH_FAILED');
  return data;
}

export async function payments(profileId, filters) {
  const enrollments = await getAthleteEnrollmentIds(profileId);
  const enrollmentIds = enrollments.map((e) => e.id);

  if (enrollmentIds.length === 0) return [];

  let query = supabaseAdmin
    .from('payment_periods')
    .select(`
      id, period_year, period_month, fee_amount, discount_amount, surcharge_amount, total_due, due_date, status,
      payment_reports(id, amount_reported, payment_method, payment_date, status)
    `)
    .in('athlete_enrollment_id', enrollmentIds)
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false });

  if (filters.status) query = query.eq('status', filters.status);

  const { data, error } = await query;
  if (error) throw new AppError('Failed to fetch payments', 500, 'FETCH_FAILED');
  return data;
}

export async function accountStatus(profileId) {
  const enrollments = await getAthleteEnrollmentIds(profileId);
  const enrollmentIds = enrollments.map((e) => e.id);

  if (enrollmentIds.length === 0) return { total_pending: 0, total_overdue: 0, periods: [] };

  const { data } = await supabaseAdmin
    .from('payment_periods')
    .select('id, period_year, period_month, total_due, status, due_date')
    .in('athlete_enrollment_id', enrollmentIds)
    .in('status', ['pending', 'overdue', 'under_review']);

  const summary = {
    total_pending: 0,
    total_overdue: 0,
    periods: data || [],
  };

  for (const p of data || []) {
    if (p.status === 'overdue') summary.total_overdue += p.total_due;
    else summary.total_pending += p.total_due;
  }

  return summary;
}

export async function trainings(profileId, filters) {
  const enrollments = await getAthleteEnrollmentIds(profileId);
  const categoryIds = [...new Set(enrollments.map((e) => e.category_id).filter(Boolean))];

  if (categoryIds.length === 0) return [];

  let query = supabaseAdmin
    .from('training_sessions')
    .select('id, title, session_date, start_time, end_time, status, training_groups(id, name, location, categories(id, name))')
    .in('training_groups.category_id', categoryIds)
    .eq('is_enabled', true)
    .neq('status', 'cancelled')
    .order('session_date', { ascending: true })
    .limit(20);

  if (filters.from) query = query.gte('session_date', filters.from);
  if (filters.to) query = query.lte('session_date', filters.to);

  const { data, error } = await query;
  if (error) throw new AppError('Failed to fetch trainings', 500, 'FETCH_FAILED');
  return data;
}

export async function tournaments(profileId, filters) {
  const enrollments = await getAthleteEnrollmentIds(profileId);
  const enrollmentIds = enrollments.map((e) => e.id);

  if (enrollmentIds.length === 0) return [];

  const { data, error } = await supabaseAdmin
    .from('tournament_callups')
    .select('id, status, responded_at, response_notes, tournaments(id, name, location, start_date, end_date, status)')
    .in('athlete_enrollment_id', enrollmentIds)
    .neq('status', 'cancelled');

  if (error) throw new AppError('Failed to fetch tournaments', 500, 'FETCH_FAILED');
  return data;
}

export async function notifications(profileId, filters) {
  let query = supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (filters.unread === 'true') query = query.eq('is_read', false);

  const { data, error } = await query;
  if (error) throw new AppError('Failed to fetch notifications', 500, 'FETCH_FAILED');
  return data;
}

export async function createPaymentReport(profileId, payload) {
  // Verify the period belongs to one of the profile's athletes
  const enrollments = await getAthleteEnrollmentIds(profileId);
  const enrollmentIds = enrollments.map((e) => e.id);

  const { data: period } = await supabaseAdmin
    .from('payment_periods')
    .select('id, status, academy_id')
    .eq('id', payload.payment_period_id)
    .in('athlete_enrollment_id', enrollmentIds)
    .single();

  if (!period) throw new AppError('Payment period not found or not accessible', 404, 'NOT_FOUND');
  if (period.status === 'cancelled') throw new AppError('Cannot report payment for a cancelled period', 400, 'INVALID_STATE');
  if (period.status === 'confirmed') throw new AppError('Payment period is already confirmed', 400, 'INVALID_STATE');

  const { data, error } = await supabaseAdmin
    .from('payment_reports')
    .insert({
      academy_id: period.academy_id,
      payment_period_id: payload.payment_period_id,
      reported_by_profile_id: profileId,
      amount_reported: payload.amount_reported,
      payment_method: payload.payment_method,
      reference_number: payload.reference_number || null,
      payment_date: payload.payment_date,
      proof_file_path: payload.proof_file_path || null,
      status: 'submitted',
    })
    .select()
    .single();

  if (error) throw new AppError('Failed to create payment report', 500, 'CREATE_FAILED');

  await supabaseAdmin
    .from('payment_periods')
    .update({ status: 'under_review', updated_at: new Date().toISOString() })
    .eq('id', payload.payment_period_id)
    .eq('status', 'pending');

  await supabaseAdmin.from('payment_report_events').insert({
    payment_report_id: data.id,
    event_type: 'submitted',
    event_by: profileId,
    notes: null,
  });

  return data;
}
