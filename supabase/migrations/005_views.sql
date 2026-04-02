-- =============================================
-- 005_views.sql
-- Reporting views
-- =============================================

-- Member balance view
create or replace view vw_academy_member_balance as
select
  pp.academy_id,
  pp.athlete_enrollment_id,
  a.first_name || ' ' || a.last_name as athlete_name,
  sum(case when pp.status in ('pending','overdue') then pp.total_due else 0 end) as total_pending,
  sum(case when pp.status = 'confirmed' then pp.total_due else 0 end) as total_paid,
  count(*) filter (where pp.status = 'overdue') as overdue_count
from payment_periods pp
join athlete_academy_enrollments e on pp.athlete_enrollment_id = e.id
join athletes a on e.athlete_id = a.id
group by pp.academy_id, pp.athlete_enrollment_id, athlete_name;

-- Debtors view
create or replace view vw_academy_debtors as
select
  pp.academy_id,
  pp.athlete_enrollment_id,
  a.first_name || ' ' || a.last_name as athlete_name,
  pp.period_year,
  pp.period_month,
  pp.total_due,
  pp.due_date,
  pp.status
from payment_periods pp
join athlete_academy_enrollments e on pp.athlete_enrollment_id = e.id
join athletes a on e.athlete_id = a.id
where pp.status in ('pending','overdue')
order by pp.due_date asc;

-- Confirmed income monthly
create or replace view vw_academy_confirmed_income_monthly as
select
  pp.academy_id,
  pp.period_year,
  pp.period_month,
  sum(pp.total_due) as confirmed_payments
from payment_periods pp
where pp.status = 'confirmed'
group by pp.academy_id, pp.period_year, pp.period_month;

-- Expenses monthly
create or replace view vw_academy_expenses_monthly as
select
  e.academy_id,
  extract(year from e.expense_date) as year,
  extract(month from e.expense_date) as month,
  sum(e.amount) as total_expenses
from expenses e
where e.status = 'confirmed'
group by e.academy_id, year, month;

-- Monthly P&L per academy
create or replace view vw_academy_monthly_pnl as
select
  i.academy_id,
  i.period_year as year,
  i.period_month as month,
  coalesce(i.confirmed_payments, 0) as payments_income,
  coalesce(ex.total_expenses, 0) as expenses,
  coalesce(i.confirmed_payments, 0) - coalesce(ex.total_expenses, 0) as net
from vw_academy_confirmed_income_monthly i
left join vw_academy_expenses_monthly ex
  on i.academy_id = ex.academy_id
  and i.period_year = ex.year
  and i.period_month = ex.month;

-- Tournament P&L
create or replace view vw_tournament_pnl as
select
  t.id as tournament_id,
  t.academy_id,
  t.name as tournament_name,
  coalesce(sum(e.amount), 0) as actual_expenses,
  coalesce(sum(inc.amount), 0) as actual_incomes,
  coalesce(sum(inc.amount), 0) - coalesce(sum(e.amount), 0) as net,
  t.expected_cost,
  t.expected_income,
  t.expected_income - t.expected_cost as expected_net
from tournaments t
left join expenses e on e.tournament_id = t.id and e.status = 'confirmed'
left join extra_incomes inc on inc.tournament_id = t.id and inc.status = 'confirmed'
group by t.id, t.academy_id, t.name, t.expected_cost, t.expected_income;

-- Platform consolidated P&L
create or replace view vw_platform_consolidated_pnl as
select
  pnl.year,
  pnl.month,
  sum(pnl.payments_income) as total_payments_income,
  sum(pnl.expenses) as total_expenses,
  sum(pnl.net) as total_net
from vw_academy_monthly_pnl pnl
group by pnl.year, pnl.month
order by pnl.year desc, pnl.month desc;
