import { supabaseAdmin } from '../../config/supabase.js';
import { AppError } from '../../core/errors/AppError.js';

export async function list(academyId, filters, { from, to }) {
  let query = supabaseAdmin
    .from('payment_periods')
    .select(`
      id, period_year, period_month, fee_amount, discount_amount, surcharge_amount, total_due, due_date, status, generated_at,
      athlete_academy_enrollments(id, athletes(id, first_name, last_name)),
      categories(id, name)
    `, { count: 'exact' })
    .eq('academy_id', academyId)
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false })
    .range(from, to);

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.period) {
    const [year, month] = filters.period.split('-');
    if (year) query = query.eq('period_year', parseInt(year));
    if (month) query = query.eq('period_month', parseInt(month));
  }
  if (filters.categoryId) query = query.eq('category_id', filters.categoryId);

  const { data, error, count } = await query;
  if (error) throw new AppError('Failed to fetch payment periods', 500, 'FETCH_FAILED');
  return { data, total: count };
}

export async function generate(academyId, { period_year, period_month, due_day, category_ids }, generatedBy) {
  // Fetch active enrollments for this academy
  let enrollmentQuery = supabaseAdmin
    .from('athlete_academy_enrollments')
    .select('id, athlete_id, category_id, category_fee_versions!inner(amount, currency_code)')
    .eq('academy_id', academyId)
    .eq('membership_status', 'active')
    .eq('category_fee_versions.is_active', true);

  if (category_ids && category_ids.length > 0) {
    enrollmentQuery = enrollmentQuery.in('category_id', category_ids);
  }

  const { data: enrollments, error: enrollError } = await enrollmentQuery;
  if (enrollError) throw new AppError('Failed to fetch enrollments', 500, 'FETCH_FAILED');

  if (!enrollments || enrollments.length === 0) {
    return { generated: 0, skipped: 0, message: 'No active enrollments found' };
  }

  const dueDay = due_day || 10;
  const dueDate = `${period_year}-${String(period_month).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`;
  const now = new Date().toISOString();

  let generated = 0;
  let skipped = 0;

  for (const enrollment of enrollments) {
    // Check for existing period (no duplicates allowed)
    const { data: existing } = await supabaseAdmin
      .from('payment_periods')
      .select('id')
      .eq('academy_id', academyId)
      .eq('athlete_enrollment_id', enrollment.id)
      .eq('period_year', period_year)
      .eq('period_month', period_month)
      .maybeSingle();

    if (existing) { skipped++; continue; }

    const feeVersion = enrollment.category_fee_versions?.[0];
    const feeAmount = feeVersion?.amount || 0;

    await supabaseAdmin.from('payment_periods').insert({
      academy_id: academyId,
      athlete_enrollment_id: enrollment.id,
      category_id: enrollment.category_id,
      period_year,
      period_month,
      fee_amount: feeAmount,
      discount_amount: 0,
      surcharge_amount: 0,
      total_due: feeAmount,
      due_date: dueDate,
      status: 'pending',
      generated_by: generatedBy,
      generated_at: now,
    });
    generated++;
  }

  return { generated, skipped, period: `${period_year}-${String(period_month).padStart(2, '0')}` };
}

export async function getOne(academyId, id) {
  const { data, error } = await supabaseAdmin
    .from('payment_periods')
    .select(`
      *,
      athlete_academy_enrollments(id, athletes(id, first_name, last_name)),
      categories(id, name),
      payment_reports(id, amount_reported, payment_method, payment_date, status, created_at)
    `)
    .eq('academy_id', academyId)
    .eq('id', id)
    .single();

  if (error) throw new AppError('Payment period not found', 404, 'NOT_FOUND');
  return data;
}

export async function update(academyId, id, payload) {
  const { data: period } = await supabaseAdmin
    .from('payment_periods')
    .select('status, fee_amount, discount_amount, surcharge_amount')
    .eq('academy_id', academyId)
    .eq('id', id)
    .single();

  if (!period) throw new AppError('Payment period not found', 404, 'NOT_FOUND');
  if (period.status === 'cancelled') throw new AppError('Cannot update a cancelled period', 400, 'INVALID_STATE');

  const feeAmount = period.fee_amount;
  const discount = payload.discount_amount !== undefined ? payload.discount_amount : period.discount_amount;
  const surcharge = payload.surcharge_amount !== undefined ? payload.surcharge_amount : period.surcharge_amount;
  const total_due = feeAmount - discount + surcharge;

  const { data, error } = await supabaseAdmin
    .from('payment_periods')
    .update({ ...payload, total_due, updated_at: new Date().toISOString() })
    .eq('academy_id', academyId)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError('Failed to update payment period', 500, 'UPDATE_FAILED');
  return data;
}

export async function cancel(academyId, id) {
  const { data: period } = await supabaseAdmin
    .from('payment_periods')
    .select('status')
    .eq('academy_id', academyId)
    .eq('id', id)
    .single();

  if (!period) throw new AppError('Payment period not found', 404, 'NOT_FOUND');
  if (period.status === 'confirmed') throw new AppError('Cannot cancel a confirmed payment period', 400, 'INVALID_STATE');
  if (period.status === 'cancelled') throw new AppError('Period is already cancelled', 400, 'INVALID_STATE');

  const { data, error } = await supabaseAdmin
    .from('payment_periods')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('academy_id', academyId)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError('Failed to cancel payment period', 500, 'UPDATE_FAILED');
  return data;
}

export async function accountStatement(academyId, athleteId, filters) {
  const { data: enrollment } = await supabaseAdmin
    .from('athlete_academy_enrollments')
    .select('id')
    .eq('academy_id', academyId)
    .eq('athlete_id', athleteId)
    .single();

  if (!enrollment) throw new AppError('Athlete not found in this academy', 404, 'NOT_FOUND');

  let query = supabaseAdmin
    .from('payment_periods')
    .select('*, payment_reports(id, amount_reported, payment_method, payment_date, status)')
    .eq('academy_id', academyId)
    .eq('athlete_enrollment_id', enrollment.id)
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false });

  if (filters.status) query = query.eq('status', filters.status);

  const { data, error } = await query;
  if (error) throw new AppError('Failed to fetch account statement', 500, 'FETCH_FAILED');
  return data;
}

export async function debtors(academyId, filters) {
  let query = supabaseAdmin
    .from('payment_periods')
    .select(`
      id, period_year, period_month, total_due, due_date, status,
      athlete_academy_enrollments(id, athletes(id, first_name, last_name)),
      categories(id, name)
    `)
    .eq('academy_id', academyId)
    .in('status', ['pending', 'overdue'])
    .order('due_date', { ascending: true });

  if (filters.period) {
    const [year, month] = filters.period.split('-');
    if (year) query = query.eq('period_year', parseInt(year));
    if (month) query = query.eq('period_month', parseInt(month));
  }

  const { data, error } = await query;
  if (error) throw new AppError('Failed to fetch debtors', 500, 'FETCH_FAILED');
  return data;
}

export async function collectionsSummary(academyId, filters) {
  let year = filters.year ? parseInt(filters.year) : new Date().getFullYear();
  let month = filters.month ? parseInt(filters.month) : new Date().getMonth() + 1;

  const { data, error } = await supabaseAdmin
    .from('payment_periods')
    .select('status, total_due')
    .eq('academy_id', academyId)
    .eq('period_year', year)
    .eq('period_month', month);

  if (error) throw new AppError('Failed to fetch collections summary', 500, 'FETCH_FAILED');

  const summary = {
    period: `${year}-${String(month).padStart(2, '0')}`,
    total_periods: data.length,
    total_due: 0,
    total_confirmed: 0,
    total_pending: 0,
    total_overdue: 0,
    total_cancelled: 0,
    by_status: {},
  };

  for (const p of data) {
    summary.total_due += p.total_due;
    if (p.status === 'confirmed') summary.total_confirmed += p.total_due;
    else if (p.status === 'overdue') summary.total_overdue += p.total_due;
    else if (p.status === 'pending' || p.status === 'under_review') summary.total_pending += p.total_due;
    else if (p.status === 'cancelled') summary.total_cancelled += p.total_due;
    summary.by_status[p.status] = (summary.by_status[p.status] || 0) + 1;
  }

  return summary;
}
