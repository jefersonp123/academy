-- =============================================
-- 003_permissions_seed.sql
-- Base permissions and role assignments
-- =============================================

insert into academy_permissions (code, module, description) values
  ('academy.read', 'academies', 'View academy details'),
  ('academy.update', 'academies', 'Update academy settings'),
  ('membership.read', 'memberships', 'View memberships'),
  ('membership.create', 'memberships', 'Create memberships'),
  ('membership.update', 'memberships', 'Update memberships'),
  ('athlete.read', 'athletes', 'View athletes'),
  ('athlete.create', 'athletes', 'Create athletes'),
  ('athlete.update', 'athletes', 'Update athletes'),
  ('category.read', 'categories', 'View categories'),
  ('category.manage', 'categories', 'Manage categories and fees'),
  ('training.read', 'trainings', 'View trainings'),
  ('training.manage', 'trainings', 'Manage training groups and sessions'),
  ('attendance.read', 'attendance', 'View attendance'),
  ('attendance.manage', 'attendance', 'Record attendance'),
  ('payment_period.read', 'billing', 'View payment periods'),
  ('payment_period.generate', 'billing', 'Generate payment periods'),
  ('payment_report.create', 'payments', 'Create payment reports'),
  ('payment_report.review', 'payments', 'Review payment reports'),
  ('payment_report.confirm', 'payments', 'Confirm payment reports'),
  ('payment_report.reject', 'payments', 'Reject payment reports'),
  ('expense.read', 'expenses', 'View expenses'),
  ('expense.create', 'expenses', 'Create expenses'),
  ('expense.update', 'expenses', 'Update expenses'),
  ('income.read', 'incomes', 'View incomes'),
  ('income.create', 'incomes', 'Create incomes'),
  ('income.update', 'incomes', 'Update incomes'),
  ('finance.read', 'finance', 'View financial dashboards'),
  ('finance.export', 'finance', 'Export financial reports'),
  ('tournament.read', 'tournaments', 'View tournaments'),
  ('tournament.create', 'tournaments', 'Create tournaments'),
  ('tournament.update', 'tournaments', 'Update tournaments'),
  ('tournament.callup.manage', 'tournaments', 'Manage tournament callups'),
  ('notification.send', 'notifications', 'Send notifications');

-- academy_owner: full access
insert into academy_role_permissions (role_code, permission_code)
select 'academy_owner', code from academy_permissions;

-- academy_admin: full access except finance.export
insert into academy_role_permissions (role_code, permission_code)
select 'academy_admin', code from academy_permissions where code != 'finance.export';

-- finance_manager
insert into academy_role_permissions (role_code, permission_code) values
  ('finance_manager', 'academy.read'),
  ('finance_manager', 'athlete.read'),
  ('finance_manager', 'category.read'),
  ('finance_manager', 'payment_period.read'),
  ('finance_manager', 'payment_period.generate'),
  ('finance_manager', 'payment_report.review'),
  ('finance_manager', 'payment_report.confirm'),
  ('finance_manager', 'payment_report.reject'),
  ('finance_manager', 'expense.read'),
  ('finance_manager', 'expense.create'),
  ('finance_manager', 'expense.update'),
  ('finance_manager', 'income.read'),
  ('finance_manager', 'income.create'),
  ('finance_manager', 'income.update'),
  ('finance_manager', 'finance.read'),
  ('finance_manager', 'finance.export'),
  ('finance_manager', 'notification.send');

-- collections_manager
insert into academy_role_permissions (role_code, permission_code) values
  ('collections_manager', 'academy.read'),
  ('collections_manager', 'athlete.read'),
  ('collections_manager', 'category.read'),
  ('collections_manager', 'payment_period.read'),
  ('collections_manager', 'payment_period.generate'),
  ('collections_manager', 'payment_report.review'),
  ('collections_manager', 'payment_report.confirm'),
  ('collections_manager', 'payment_report.reject'),
  ('collections_manager', 'finance.read'),
  ('collections_manager', 'notification.send');

-- coach
insert into academy_role_permissions (role_code, permission_code) values
  ('coach', 'academy.read'),
  ('coach', 'athlete.read'),
  ('coach', 'category.read'),
  ('coach', 'training.read'),
  ('coach', 'training.manage'),
  ('coach', 'attendance.read'),
  ('coach', 'attendance.manage'),
  ('coach', 'tournament.read'),
  ('coach', 'tournament.create'),
  ('coach', 'tournament.update'),
  ('coach', 'tournament.callup.manage');

-- staff
insert into academy_role_permissions (role_code, permission_code) values
  ('staff', 'academy.read'),
  ('staff', 'athlete.read'),
  ('staff', 'category.read'),
  ('staff', 'training.read'),
  ('staff', 'attendance.read'),
  ('staff', 'attendance.manage'),
  ('staff', 'tournament.read');

-- guardian: create payment reports only (self-service routes handle the rest)
insert into academy_role_permissions (role_code, permission_code) values
  ('guardian', 'academy.read'),
  ('guardian', 'athlete.read'),
  ('guardian', 'payment_period.read'),
  ('guardian', 'payment_report.create'),
  ('guardian', 'training.read'),
  ('guardian', 'tournament.read');

-- athlete: read + create own reports
insert into academy_role_permissions (role_code, permission_code) values
  ('athlete', 'academy.read'),
  ('athlete', 'payment_period.read'),
  ('athlete', 'payment_report.create'),
  ('athlete', 'training.read'),
  ('athlete', 'tournament.read');
