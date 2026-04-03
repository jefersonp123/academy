-- =============================================
-- 002_indexes.sql
-- Performance indexes
-- =============================================

-- Profiles
create index idx_profiles_auth_user_id on profiles(auth_user_id);
create index idx_profiles_email on profiles(email);

-- Academy memberships
create index idx_academy_memberships_profile_id on academy_memberships(profile_id);
create index idx_academy_memberships_academy_id on academy_memberships(academy_id);
create index idx_academy_memberships_status on academy_memberships(status);

-- Athletes
create index idx_athlete_enrollments_academy_id on athlete_academy_enrollments(academy_id);
create index idx_athlete_enrollments_athlete_id on athlete_academy_enrollments(athlete_id);
create index idx_athlete_enrollments_category_id on athlete_academy_enrollments(category_id);
create index idx_athlete_enrollments_status on athlete_academy_enrollments(membership_status);

-- Guardian / athlete links
create index idx_guardian_links_athlete_id on guardian_links(athlete_id);
create index idx_guardian_links_guardian_profile_id on guardian_links(guardian_profile_id);
create index idx_athlete_user_links_profile_id on athlete_user_links(profile_id);

-- Categories & fees
create index idx_category_fee_versions_category_id on category_fee_versions(category_id);
create index idx_category_fee_versions_is_active on category_fee_versions(is_active);

-- Training
create index idx_training_sessions_academy_id on training_sessions(academy_id);
create index idx_training_sessions_date on training_sessions(session_date);
create index idx_training_sessions_group_id on training_sessions(training_group_id);
create index idx_attendance_records_session_id on attendance_records(training_session_id);
create index idx_attendance_records_enrollment_id on attendance_records(athlete_enrollment_id);

-- Payment periods
create index idx_payment_periods_academy_id on payment_periods(academy_id);
create index idx_payment_periods_enrollment_id on payment_periods(athlete_enrollment_id);
create index idx_payment_periods_status on payment_periods(status);
create index idx_payment_periods_year_month on payment_periods(period_year, period_month);
create index idx_payment_periods_due_date on payment_periods(due_date);

-- Payment reports
create index idx_payment_reports_academy_id on payment_reports(academy_id);
create index idx_payment_reports_period_id on payment_reports(payment_period_id);
create index idx_payment_reports_status on payment_reports(status);

-- Expenses & incomes
create index idx_expenses_academy_id on expenses(academy_id);
create index idx_expenses_date on expenses(expense_date);
create index idx_expenses_status on expenses(status);
create index idx_extra_incomes_academy_id on extra_incomes(academy_id);
create index idx_extra_incomes_date on extra_incomes(income_date);
create index idx_extra_incomes_status on extra_incomes(status);

-- Tournaments
create index idx_tournaments_academy_id on tournaments(academy_id);
create index idx_tournaments_status on tournaments(status);
create index idx_tournament_callups_tournament_id on tournament_callups(tournament_id);
create index idx_tournament_callups_enrollment_id on tournament_callups(athlete_enrollment_id);

-- Notifications
create index idx_notifications_profile_id on notifications(profile_id);
create index idx_notifications_is_read on notifications(is_read);
create index idx_push_subscriptions_profile_id on push_subscriptions(profile_id);
