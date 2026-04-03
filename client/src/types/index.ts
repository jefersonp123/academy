// ─── API Response ───────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta: PaginationMeta | null;
  error: ApiError | null;
}

export interface ApiError {
  code: string;
  message: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface AuthResponse extends AuthTokens {
  profile: Profile;
}

// ─── Profiles ────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  auth_user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  status: ProfileStatus;
  last_active_academy_id?: string;
  created_at: string;
  updated_at: string;
  profile_platform_roles?: { platform_roles: { code: string; name: string } }[];
  academy_memberships?: AcademyMembership[];
}

export type ProfileStatus = 'pending_approval' | 'active' | 'blocked' | 'inactive';

// ─── Academies ───────────────────────────────────────────────────────────────

export interface Academy {
  id: string;
  name: string;
  slug: string;
  sport_type: string;
  country: string;
  currency_code: string;
  timezone: string;
  status: AcademyStatus;
  owner_profile_id?: string;
  created_at: string;
  updated_at: string;
}

export type AcademyStatus = 'active' | 'suspended' | 'inactive';

export interface AcademySettings {
  id: string;
  academy_id: string;
  payment_due_day: number;
  late_fee_amount: number;
  allow_partial_payments: boolean;
  notification_days_before_due: number;
  default_currency: string;
  custom_fields?: Record<string, unknown>;
  updated_at: string;
}

// ─── Memberships ─────────────────────────────────────────────────────────────

export type AcademyRole =
  | 'academy_owner'
  | 'academy_admin'
  | 'finance_manager'
  | 'collections_manager'
  | 'coach'
  | 'staff'
  | 'guardian'
  | 'athlete';

export type PlatformRole = 'super_admin';

export type MembershipStatus = 'pending' | 'active' | 'suspended' | 'inactive' | 'archived';

export interface AcademyMembership {
  id: string;
  academy_id: string;
  profile_id: string;
  role_code: AcademyRole;
  status: MembershipStatus;
  is_primary: boolean;
  joined_at?: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  academies?: Academy;
}

export interface AcademyInvitation {
  id: string;
  academy_id: string;
  email: string;
  role_code: AcademyRole;
  status: 'pending' | 'accepted' | 'cancelled' | 'expired';
  expires_at: string;
  created_by?: string;
  created_at: string;
  token?: string;
}

// ─── Athletes ────────────────────────────────────────────────────────────────

export interface Athlete {
  id: string;
  first_name: string;
  last_name: string;
  birth_date?: string;
  gender?: 'male' | 'female' | 'other';
  document_number?: string;
  phone?: string;
  email?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type EnrollmentStatus = 'active' | 'inactive' | 'suspended' | 'archived';
export type MedicalClearance = 'pending' | 'approved' | 'expired';

export interface AthleteEnrollment {
  id: string;
  academy_id: string;
  athlete_id: string;
  category_id?: string;
  membership_status: EnrollmentStatus;
  joined_at: string;
  left_at?: string;
  medical_clearance_status: MedicalClearance;
  can_train: boolean;
  created_at: string;
  updated_at: string;
  athletes?: Athlete;
  categories?: Category;
}

export interface GuardianLink {
  id: string;
  guardian_profile_id: string;
  athlete_id: string;
  relationship_type: 'parent' | 'legal_guardian' | 'relative' | 'other';
  is_primary: boolean;
  created_at: string;
  profiles?: Profile;
}

// ─── Categories ──────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  academy_id: string;
  name: string;
  age_min?: number;
  age_max?: number;
  sort_order: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  category_fee_versions?: CategoryFeeVersion[];
}

export interface CategoryFeeVersion {
  id: string;
  academy_id: string;
  category_id: string;
  amount: number;
  currency_code: string;
  effective_from: string;
  effective_to?: string;
  is_active: boolean;
  created_at: string;
}

// ─── Trainings ───────────────────────────────────────────────────────────────

export interface TrainingGroup {
  id: string;
  academy_id: string;
  category_id?: string;
  name: string;
  location?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  categories?: Category;
}

export type SessionStatus = 'scheduled' | 'completed' | 'cancelled';

export interface TrainingSession {
  id: string;
  academy_id: string;
  training_group_id: string;
  title?: string;
  session_date: string;
  start_time: string;
  end_time: string;
  is_enabled: boolean;
  cancellation_reason?: string;
  status: SessionStatus;
  created_at: string;
  updated_at: string;
  training_groups?: TrainingGroup;
}

// ─── Attendance ──────────────────────────────────────────────────────────────

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'justified';

export interface AttendanceRecord {
  id: string;
  academy_id: string;
  training_session_id: string;
  athlete_enrollment_id: string;
  attendance_status: AttendanceStatus;
  recorded_by?: string;
  recorded_at: string;
  training_sessions?: TrainingSession;
  athlete_academy_enrollments?: AthleteEnrollment & { athletes?: Athlete };
}

// ─── Billing ─────────────────────────────────────────────────────────────────

export type PaymentPeriodStatus =
  | 'pending'
  | 'under_review'
  | 'partially_paid'
  | 'confirmed'
  | 'overdue'
  | 'cancelled';

export interface PaymentPeriod {
  id: string;
  academy_id: string;
  athlete_enrollment_id: string;
  category_id?: string;
  period_year: number;
  period_month: number;
  fee_amount: number;
  discount_amount: number;
  surcharge_amount: number;
  total_due: number;
  due_date: string;
  status: PaymentPeriodStatus;
  generated_by?: string;
  generated_at: string;
  created_at: string;
  updated_at: string;
  athlete_academy_enrollments?: AthleteEnrollment & { athletes?: Athlete };
  categories?: Category;
  payment_reports?: PaymentReport[];
}

export interface CollectionsSummary {
  period: string;
  total_periods: number;
  total_due: number;
  total_confirmed: number;
  total_pending: number;
  total_overdue: number;
  total_cancelled: number;
  by_status: Record<string, number>;
}

// ─── Payments ────────────────────────────────────────────────────────────────

export type PaymentReportStatus =
  | 'submitted'
  | 'under_review'
  | 'confirmed'
  | 'rejected'
  | 'observed'
  | 'cancelled';

export interface PaymentReport {
  id: string;
  academy_id: string;
  payment_period_id: string;
  reported_by_profile_id: string;
  amount_reported: number;
  payment_method: string;
  reference_number?: string;
  payment_date: string;
  proof_file_path?: string;
  status: PaymentReportStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
  payment_periods?: PaymentPeriod;
  payment_report_events?: PaymentReportEvent[];
}

export interface PaymentReportEvent {
  id: string;
  payment_report_id: string;
  event_type: string;
  event_by?: string;
  notes?: string;
  created_at: string;
}

// ─── Expenses ────────────────────────────────────────────────────────────────

export type ExpenseStatus = 'draft' | 'confirmed' | 'cancelled' | 'archived';

export interface ExpenseCategory {
  id: string;
  academy_id: string;
  name: string;
  type?: string;
  status: 'active' | 'inactive';
}

export interface Expense {
  id: string;
  academy_id: string;
  category_id?: string;
  tournament_id?: string;
  title: string;
  description?: string;
  expense_date: string;
  amount: number;
  currency_code: string;
  payment_method?: string;
  proof_file_path?: string;
  status: ExpenseStatus;
  created_by?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
  archived_at?: string;
  expense_categories?: ExpenseCategory;
}

// ─── Incomes ─────────────────────────────────────────────────────────────────

export type IncomeStatus = 'draft' | 'confirmed' | 'cancelled' | 'archived';

export interface IncomeCategory {
  id: string;
  academy_id: string;
  name: string;
  type?: string;
  status: 'active' | 'inactive';
}

export interface ExtraIncome {
  id: string;
  academy_id: string;
  category_id?: string;
  tournament_id?: string;
  title: string;
  description?: string;
  income_date: string;
  amount: number;
  currency_code: string;
  proof_file_path?: string;
  status: IncomeStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
  archived_at?: string;
  income_categories?: IncomeCategory;
}

// ─── Finance ─────────────────────────────────────────────────────────────────

export interface FinanceDashboard {
  period: string;
  total_revenue_payments: number;
  total_extra_incomes: number;
  total_income: number;
  total_expenses: number;
  net_result: number;
  total_pending_collection: number;
}

export interface PnLMonthly {
  period: string;
  incomes: {
    payments: number;
    extra: number;
    total: number;
    extra_detail: { amount: number; income_categories?: { name: string } }[];
  };
  expenses: {
    total: number;
    detail: { amount: number; expense_categories?: { name: string } }[];
  };
  net: number;
}

export interface PnLSeriesItem {
  month: number;
  period: string;
  payments: number;
  extra_incomes: number;
  total_income: number;
  expenses: number;
  net: number;
}

export interface FinanceProjection {
  period: string;
  projected_revenue: number;
  active_athletes: number;
}

// ─── Tournaments ─────────────────────────────────────────────────────────────

export type TournamentStatus =
  | 'planned'
  | 'callup_launched'
  | 'in_progress'
  | 'finished'
  | 'cancelled';

export interface Tournament {
  id: string;
  academy_id: string;
  name: string;
  description?: string;
  location?: string;
  start_date: string;
  end_date: string;
  status: TournamentStatus;
  expected_cost?: number;
  expected_income?: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export type CallupStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export interface TournamentCallup {
  id: string;
  academy_id: string;
  tournament_id: string;
  athlete_enrollment_id: string;
  status: CallupStatus;
  responded_at?: string;
  response_notes?: string;
  created_at: string;
  updated_at: string;
  athlete_academy_enrollments?: AthleteEnrollment & { athletes?: Athlete };
  tournaments?: Tournament;
}

// ─── Notifications ───────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  academy_id?: string;
  profile_id: string;
  type: string;
  title: string;
  body: string;
  payload_json?: Record<string, unknown>;
  is_read: boolean;
  sent_at: string;
  created_at: string;
}

// ─── Platform ────────────────────────────────────────────────────────────────

export interface PlatformOverview {
  total_academies: number;
  total_active_memberships: number;
  total_active_athletes: number;
}

// ─── Me / Self-service ───────────────────────────────────────────────────────

export interface MeDashboard {
  active_enrollments: number;
  pending_payments: number;
  unread_notifications: number;
}

// ─── Filters & Params ────────────────────────────────────────────────────────

export interface ListParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}
