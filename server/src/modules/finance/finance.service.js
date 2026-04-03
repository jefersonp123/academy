import { supabaseAdmin } from '../../config/supabase.js';
import { AppError } from '../../core/errors/AppError.js';

function monthRange(year, month) {
  const m = String(month).padStart(2, '0');
  return { from: `${year}-${m}-01`, to: `${year}-${m}-31` };
}

export async function dashboard(academyId, filters) {
  const year = parseInt(filters.year) || new Date().getFullYear();
  const month = parseInt(filters.month) || new Date().getMonth() + 1;
  const { from, to } = monthRange(year, month);

  const [payments, expenses, extraIncomes, pendingPeriods] = await Promise.all([
    supabaseAdmin.from('payment_periods').select('total_due').eq('academy_id', academyId).eq('status', 'confirmed').eq('period_year', year).eq('period_month', month),
    supabaseAdmin.from('expenses').select('amount').eq('academy_id', academyId).eq('status', 'confirmed').gte('expense_date', from).lte('expense_date', to),
    supabaseAdmin.from('extra_incomes').select('amount').eq('academy_id', academyId).eq('status', 'confirmed').gte('income_date', from).lte('income_date', to),
    supabaseAdmin.from('payment_periods').select('total_due').eq('academy_id', academyId).in('status', ['pending', 'overdue']).eq('period_year', year).eq('period_month', month),
  ]);

  const totalPayments = (payments.data || []).reduce((s, r) => s + r.total_due, 0);
  const totalExtra = (extraIncomes.data || []).reduce((s, r) => s + r.amount, 0);
  const totalExpenses = (expenses.data || []).reduce((s, r) => s + r.amount, 0);
  const totalPending = (pendingPeriods.data || []).reduce((s, r) => s + r.total_due, 0);
  const totalIncome = totalPayments + totalExtra;

  return {
    period: `${year}-${String(month).padStart(2, '0')}`,
    total_revenue_payments: totalPayments,
    total_extra_incomes: totalExtra,
    total_income: totalIncome,
    total_expenses: totalExpenses,
    net_result: totalIncome - totalExpenses,
    total_pending_collection: totalPending,
  };
}

export async function pnlMonthly(academyId, filters) {
  const year = parseInt(filters.year) || new Date().getFullYear();
  const month = parseInt(filters.month) || new Date().getMonth() + 1;
  const { from, to } = monthRange(year, month);

  const [payments, extraIncomes, expenses] = await Promise.all([
    supabaseAdmin.from('payment_periods').select('total_due').eq('academy_id', academyId).eq('status', 'confirmed').eq('period_year', year).eq('period_month', month),
    supabaseAdmin.from('extra_incomes').select('amount, income_categories(name)').eq('academy_id', academyId).eq('status', 'confirmed').gte('income_date', from).lte('income_date', to),
    supabaseAdmin.from('expenses').select('amount, expense_categories(name)').eq('academy_id', academyId).eq('status', 'confirmed').gte('expense_date', from).lte('expense_date', to),
  ]);

  const totalPayments = (payments.data || []).reduce((s, r) => s + r.total_due, 0);
  const totalExtra = (extraIncomes.data || []).reduce((s, r) => s + r.amount, 0);
  const totalExpenses = (expenses.data || []).reduce((s, r) => s + r.amount, 0);

  return {
    period: `${year}-${String(month).padStart(2, '0')}`,
    incomes: {
      payments: totalPayments,
      extra: totalExtra,
      total: totalPayments + totalExtra,
      extra_detail: extraIncomes.data,
    },
    expenses: {
      total: totalExpenses,
      detail: expenses.data,
    },
    net: totalPayments + totalExtra - totalExpenses,
  };
}

export async function pnlSeries(academyId, filters) {
  const year = parseInt(filters.year) || new Date().getFullYear();
  const series = [];

  for (let m = 1; m <= 12; m++) {
    const { from, to } = monthRange(year, m);
    const [payments, incomes, expenses] = await Promise.all([
      supabaseAdmin.from('payment_periods').select('total_due').eq('academy_id', academyId).eq('status', 'confirmed').eq('period_year', year).eq('period_month', m),
      supabaseAdmin.from('extra_incomes').select('amount').eq('academy_id', academyId).eq('status', 'confirmed').gte('income_date', from).lte('income_date', to),
      supabaseAdmin.from('expenses').select('amount').eq('academy_id', academyId).eq('status', 'confirmed').gte('expense_date', from).lte('expense_date', to),
    ]);

    const p = (payments.data || []).reduce((s, r) => s + r.total_due, 0);
    const i = (incomes.data || []).reduce((s, r) => s + r.amount, 0);
    const e = (expenses.data || []).reduce((s, r) => s + r.amount, 0);

    series.push({ month: m, period: `${year}-${String(m).padStart(2, '0')}`, payments: p, extra_incomes: i, total_income: p + i, expenses: e, net: p + i - e });
  }

  return { year, series };
}

export async function pnlTournament(academyId, tournamentId) {
  const [tournamentRes, expenses, incomes] = await Promise.all([
    supabaseAdmin.from('tournaments').select('id, name, status, expected_cost, expected_income').eq('academy_id', academyId).eq('id', tournamentId).single(),
    supabaseAdmin.from('expenses').select('amount').eq('academy_id', academyId).eq('tournament_id', tournamentId).eq('status', 'confirmed'),
    supabaseAdmin.from('extra_incomes').select('amount').eq('academy_id', academyId).eq('tournament_id', tournamentId).eq('status', 'confirmed'),
  ]);

  if (tournamentRes.error) throw new AppError('Tournament not found', 404, 'NOT_FOUND');

  const totalExpenses = (expenses.data || []).reduce((s, r) => s + r.amount, 0);
  const totalIncomes = (incomes.data || []).reduce((s, r) => s + r.amount, 0);
  const t = tournamentRes.data;

  return {
    tournament: t,
    actual_expenses: totalExpenses,
    actual_incomes: totalIncomes,
    net: totalIncomes - totalExpenses,
    expected_net: (t.expected_income || 0) - (t.expected_cost || 0),
    variance: (totalIncomes - totalExpenses) - ((t.expected_income || 0) - (t.expected_cost || 0)),
  };
}

export async function projection(academyId, filters) {
  const year = parseInt(filters.year) || new Date().getFullYear();
  const month = parseInt(filters.month) || new Date().getMonth() + 1;

  const { data: enrollments } = await supabaseAdmin
    .from('athlete_academy_enrollments')
    .select('id, category_fee_versions!inner(amount)')
    .eq('academy_id', academyId)
    .eq('membership_status', 'active')
    .eq('category_fee_versions.is_active', true);

  const projectedRevenue = (enrollments || []).reduce((s, e) => {
    return s + (e.category_fee_versions?.[0]?.amount || 0);
  }, 0);

  return {
    period: `${year}-${String(month).padStart(2, '0')}`,
    projected_revenue: projectedRevenue,
    active_athletes: enrollments?.length || 0,
  };
}
