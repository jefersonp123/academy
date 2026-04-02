-- =============================================
-- 001_initial_schema.sql
-- Club Deportivo PWA — Base schema
-- =============================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- =============================================
-- PROFILES
-- =============================================
create table profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  avatar_url text,
  status text not null default 'active' check (status in ('pending_approval','active','blocked','inactive')),
  last_active_academy_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================
-- PLATFORM ROLES
-- =============================================
create table platform_roles (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null
);

insert into platform_roles (code, name) values
  ('super_admin', 'Super Administrator');

create table profile_platform_roles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  platform_role_id uuid not null references platform_roles(id),
  unique (profile_id, platform_role_id)
);

-- =============================================
-- ACADEMIES
-- =============================================
create table academies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  sport_type text not null,
  country text not null,
  currency_code char(3) not null default 'USD',
  timezone text not null default 'UTC',
  status text not null default 'active' check (status in ('active','suspended','inactive')),
  owner_profile_id uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table academy_settings (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid unique not null references academies(id) on delete cascade,
  payment_due_day int default 10 check (payment_due_day between 1 and 28),
  late_fee_amount numeric(12,2) default 0,
  allow_partial_payments boolean default false,
  notification_days_before_due int default 5,
  default_currency char(3) default 'USD',
  custom_fields jsonb,
  updated_at timestamptz not null default now()
);

-- =============================================
-- ACADEMY MEMBERSHIPS & ROLES
-- =============================================
create table academy_memberships (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academies(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  role_code text not null,
  status text not null default 'active' check (status in ('pending','active','suspended','inactive','archived')),
  is_primary boolean default false,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (academy_id, profile_id)
);

create table academy_permissions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  module text not null,
  description text
);

create table academy_role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_code text not null,
  permission_code text not null references academy_permissions(code) on delete cascade,
  unique (role_code, permission_code)
);

create table academy_invitations (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academies(id) on delete cascade,
  email text not null,
  role_code text not null,
  token_hash text not null,
  status text not null default 'pending' check (status in ('pending','accepted','cancelled','expired')),
  expires_at timestamptz not null,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- =============================================
-- ATHLETES
-- =============================================
create table athletes (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  birth_date date,
  gender text check (gender in ('male','female','other')),
  document_number text,
  phone text,
  email text,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table athlete_academy_enrollments (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academies(id) on delete cascade,
  athlete_id uuid not null references athletes(id) on delete cascade,
  category_id uuid,
  membership_status text not null default 'active' check (membership_status in ('active','inactive','suspended','archived')),
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  medical_clearance_status text default 'pending' check (medical_clearance_status in ('pending','approved','expired')),
  can_train boolean default false,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table guardian_links (
  id uuid primary key default gen_random_uuid(),
  guardian_profile_id uuid not null references profiles(id) on delete cascade,
  athlete_id uuid not null references athletes(id) on delete cascade,
  relationship_type text not null check (relationship_type in ('parent','legal_guardian','relative','other')),
  is_primary boolean default false,
  created_at timestamptz not null default now(),
  unique (guardian_profile_id, athlete_id)
);

create table athlete_user_links (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references athletes(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  relationship_type text not null default 'self',
  created_at timestamptz not null default now(),
  unique (athlete_id, profile_id)
);

-- =============================================
-- CATEGORIES
-- =============================================
create table categories (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academies(id) on delete cascade,
  name text not null,
  age_min int,
  age_max int,
  sort_order int default 0,
  status text not null default 'active' check (status in ('active','inactive')),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table athlete_academy_enrollments
  add constraint fk_enrollment_category foreign key (category_id) references categories(id);

create table category_fee_versions (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academies(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  amount numeric(12,2) not null,
  currency_code char(3) not null,
  effective_from date not null,
  effective_to date,
  is_active boolean not null default true,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- =============================================
-- TRAININGS
-- =============================================
create table training_groups (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academies(id) on delete cascade,
  category_id uuid references categories(id),
  name text not null,
  location text,
  status text not null default 'active' check (status in ('active','inactive')),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table training_sessions (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academies(id) on delete cascade,
  training_group_id uuid not null references training_groups(id) on delete cascade,
  title text,
  session_date date not null,
  start_time time not null,
  end_time time not null,
  is_enabled boolean not null default true,
  cancellation_reason text,
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled')),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table attendance_records (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academies(id) on delete cascade,
  training_session_id uuid not null references training_sessions(id) on delete cascade,
  athlete_enrollment_id uuid not null references athlete_academy_enrollments(id) on delete cascade,
  attendance_status text not null check (attendance_status in ('present','absent','late','justified')),
  recorded_by uuid references profiles(id),
  recorded_at timestamptz not null default now(),
  unique (training_session_id, athlete_enrollment_id)
);

-- =============================================
-- BILLING & PAYMENTS
-- =============================================
create table payment_periods (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academies(id) on delete cascade,
  athlete_enrollment_id uuid not null references athlete_academy_enrollments(id) on delete cascade,
  category_id uuid references categories(id),
  period_year int not null,
  period_month int not null check (period_month between 1 and 12),
  fee_amount numeric(12,2) not null,
  discount_amount numeric(12,2) not null default 0,
  surcharge_amount numeric(12,2) not null default 0,
  total_due numeric(12,2) not null,
  due_date date not null,
  status text not null default 'pending' check (status in ('pending','under_review','partially_paid','confirmed','overdue','cancelled')),
  generated_by uuid references profiles(id),
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (academy_id, athlete_enrollment_id, period_year, period_month)
);

create table payment_reports (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academies(id) on delete cascade,
  payment_period_id uuid not null references payment_periods(id) on delete cascade,
  reported_by_profile_id uuid not null references profiles(id),
  amount_reported numeric(12,2) not null,
  payment_method text not null,
  reference_number text,
  payment_date date not null,
  proof_file_path text,
  status text not null default 'submitted' check (status in ('submitted','under_review','confirmed','rejected','observed','cancelled')),
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table payment_report_events (
  id uuid primary key default gen_random_uuid(),
  payment_report_id uuid not null references payment_reports(id) on delete cascade,
  event_type text not null,
  event_by uuid references profiles(id),
  notes text,
  created_at timestamptz not null default now()
);

create table extra_charges (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academies(id) on delete cascade,
  athlete_enrollment_id uuid not null references athlete_academy_enrollments(id) on delete cascade,
  title text not null,
  description text,
  amount numeric(12,2) not null,
  due_date date,
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled')),
  linked_tournament_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================
-- EXPENSES & INCOMES
-- =============================================
create table expense_categories (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academies(id) on delete cascade,
  name text not null,
  type text,
  status text not null default 'active' check (status in ('active','inactive'))
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academies(id) on delete cascade,
  category_id uuid references expense_categories(id),
  tournament_id uuid,
  title text not null,
  description text,
  expense_date date not null,
  amount numeric(12,2) not null,
  currency_code char(3) not null,
  payment_method text,
  proof_file_path text,
  status text not null default 'draft' check (status in ('draft','confirmed','cancelled','archived')),
  created_by uuid references profiles(id),
  approved_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table income_categories (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academies(id) on delete cascade,
  name text not null,
  type text,
  status text not null default 'active' check (status in ('active','inactive'))
);

create table extra_incomes (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academies(id) on delete cascade,
  category_id uuid references income_categories(id),
  tournament_id uuid,
  title text not null,
  description text,
  income_date date not null,
  amount numeric(12,2) not null,
  currency_code char(3) not null,
  proof_file_path text,
  status text not null default 'draft' check (status in ('draft','confirmed','cancelled','archived')),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

-- =============================================
-- TOURNAMENTS
-- =============================================
create table tournaments (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academies(id) on delete cascade,
  name text not null,
  description text,
  location text,
  start_date date not null,
  end_date date not null,
  status text not null default 'planned' check (status in ('planned','callup_launched','in_progress','finished','cancelled')),
  expected_cost numeric(12,2),
  expected_income numeric(12,2),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table expenses add constraint fk_expense_tournament foreign key (tournament_id) references tournaments(id);
alter table extra_incomes add constraint fk_income_tournament foreign key (tournament_id) references tournaments(id);
alter table extra_charges add constraint fk_charge_tournament foreign key (linked_tournament_id) references tournaments(id);

create table tournament_callups (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academies(id) on delete cascade,
  tournament_id uuid not null references tournaments(id) on delete cascade,
  athlete_enrollment_id uuid not null references athlete_academy_enrollments(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled')),
  responded_at timestamptz,
  response_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tournament_id, athlete_enrollment_id)
);

-- =============================================
-- NOTIFICATIONS
-- =============================================
create table notifications (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid references academies(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  payload_json jsonb,
  is_read boolean not null default false,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  academy_id uuid references academies(id) on delete set null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, endpoint)
);
