import { supabaseAdmin } from '../../config/supabase.js';
import { AppError } from '../../core/errors/AppError.js';

export async function list(academyId, filters, { from, to }) {
  let query = supabaseAdmin
    .from('payment_reports')
    .select(`
      id, amount_reported, payment_method, payment_date, status, created_at,
      payment_periods(id, period_year, period_month, total_due, athlete_academy_enrollments(athletes(id, first_name, last_name)))
    `, { count: 'exact' })
    .eq('academy_id', academyId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (filters.status) query = query.eq('status', filters.status);

  const { data, error, count } = await query;
  if (error) throw new AppError('Failed to fetch payment reports', 500, 'FETCH_FAILED');
  return { data, total: count };
}

export async function create(academyId, payload, reportedBy) {
  // Validate period belongs to this academy and is not cancelled
  const { data: period, error: periodError } = await supabaseAdmin
    .from('payment_periods')
    .select('id, status')
    .eq('academy_id', academyId)
    .eq('id', payload.payment_period_id)
    .single();

  if (periodError || !period) throw new AppError('Payment period not found', 404, 'NOT_FOUND');
  if (period.status === 'cancelled') throw new AppError('Cannot report payment for a cancelled period', 400, 'INVALID_STATE');
  if (period.status === 'confirmed') throw new AppError('Payment period is already confirmed', 400, 'INVALID_STATE');

  const { data, error } = await supabaseAdmin
    .from('payment_reports')
    .insert({
      academy_id: academyId,
      ...payload,
      reported_by_profile_id: reportedBy,
      status: 'submitted',
    })
    .select()
    .single();

  if (error) throw new AppError('Failed to create payment report', 500, 'CREATE_FAILED');

  // Update period to under_review
  await supabaseAdmin
    .from('payment_periods')
    .update({ status: 'under_review', updated_at: new Date().toISOString() })
    .eq('id', payload.payment_period_id)
    .eq('status', 'pending');

  await logEvent(data.id, 'submitted', reportedBy, null);
  return data;
}

export async function getOne(academyId, id) {
  const { data, error } = await supabaseAdmin
    .from('payment_reports')
    .select(`
      *,
      payment_periods(id, period_year, period_month, total_due, fee_amount, status,
        athlete_academy_enrollments(id, athletes(id, first_name, last_name))),
      payment_report_events(id, event_type, event_by, notes, created_at)
    `)
    .eq('academy_id', academyId)
    .eq('id', id)
    .single();

  if (error) throw new AppError('Payment report not found', 404, 'NOT_FOUND');
  return data;
}

export async function review(academyId, id, newStatus, review_notes, reviewedBy) {
  const { data: report } = await supabaseAdmin
    .from('payment_reports')
    .select('id, status, payment_period_id')
    .eq('academy_id', academyId)
    .eq('id', id)
    .single();

  if (!report) throw new AppError('Payment report not found', 404, 'NOT_FOUND');
  if (!['submitted', 'under_review', 'observed'].includes(report.status)) {
    throw new AppError(`Cannot review a report with status: ${report.status}`, 400, 'INVALID_STATE');
  }

  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from('payment_reports')
    .update({ status: newStatus, reviewed_by: reviewedBy, reviewed_at: now, review_notes: review_notes || null, updated_at: now })
    .eq('academy_id', academyId)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError('Failed to update payment report', 500, 'UPDATE_FAILED');

  // Update period status accordingly
  if (newStatus === 'confirmed') {
    await supabaseAdmin
      .from('payment_periods')
      .update({ status: 'confirmed', updated_at: now })
      .eq('id', report.payment_period_id);
  } else if (newStatus === 'rejected') {
    await supabaseAdmin
      .from('payment_periods')
      .update({ status: 'pending', updated_at: now })
      .eq('id', report.payment_period_id);
  }

  await logEvent(id, newStatus, reviewedBy, review_notes || null);
  return data;
}

export async function cancel(academyId, id, cancelledBy) {
  const { data: report } = await supabaseAdmin
    .from('payment_reports')
    .select('id, status, payment_period_id')
    .eq('academy_id', academyId)
    .eq('id', id)
    .single();

  if (!report) throw new AppError('Payment report not found', 404, 'NOT_FOUND');
  if (report.status === 'confirmed') throw new AppError('Cannot cancel a confirmed report', 400, 'INVALID_STATE');
  if (report.status === 'cancelled') throw new AppError('Report is already cancelled', 400, 'INVALID_STATE');

  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from('payment_reports')
    .update({ status: 'cancelled', updated_at: now })
    .eq('academy_id', academyId)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError('Failed to cancel payment report', 500, 'UPDATE_FAILED');

  await supabaseAdmin
    .from('payment_periods')
    .update({ status: 'pending', updated_at: now })
    .eq('id', report.payment_period_id)
    .eq('status', 'under_review');

  await logEvent(id, 'cancelled', cancelledBy, null);
  return data;
}

async function logEvent(reportId, eventType, eventBy, notes) {
  await supabaseAdmin.from('payment_report_events').insert({
    payment_report_id: reportId,
    event_type: eventType,
    event_by: eventBy,
    notes,
  });
}
