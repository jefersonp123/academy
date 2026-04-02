export const ROUTES = {
  // Public
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  ACCEPT_INVITATION: '/accept-invitation',
  SELECT_ACADEMY: '/select-academy',
  ACCESS_DENIED: '/access-denied',

  // App admin
  APP: '/app',
  DASHBOARD: '/app/dashboard',
  ATHLETES: '/app/athletes',
  ATHLETE_NEW: '/app/athletes/new',
  ATHLETE_DETAIL: (id: string) => `/app/athletes/${id}`,
  CATEGORIES: '/app/categories',
  CATEGORY_DETAIL: (id: string) => `/app/categories/${id}`,
  TRAININGS: '/app/trainings',
  TRAINING_DETAIL: (id: string) => `/app/trainings/${id}`,
  CALENDAR: '/app/calendar',
  SESSION_DETAIL: (id: string) => `/app/sessions/${id}`,
  ATTENDANCE: '/app/attendance',
  BILLING: '/app/billing',
  PAYMENT_REPORTS: '/app/payment-reports',
  PAYMENT_REPORT_DETAIL: (id: string) => `/app/payment-reports/${id}`,
  EXPENSES: '/app/expenses',
  EXPENSE_DETAIL: (id: string) => `/app/expenses/${id}`,
  INCOME: '/app/income',
  INCOME_DETAIL: (id: string) => `/app/income/${id}`,
  FINANCE: '/app/finance',
  FINANCE_PNL: '/app/finance/pnl',
  TOURNAMENTS: '/app/tournaments',
  TOURNAMENT_DETAIL: (id: string) => `/app/tournaments/${id}`,
  CALLUP_DETAIL: (id: string) => `/app/callups/${id}`,
  NOTIFICATIONS: '/app/notifications',
  PROFILE: '/app/profile',
  MEMBERS: '/app/members',
  MEMBER_DETAIL: (id: string) => `/app/members/${id}`,
  INVITATIONS_NEW: '/app/invitations/new',
  SETTINGS_BRAND: '/app/settings/brand',
  SETTINGS_NOTIFICATIONS: '/app/settings/notifications',
  SETTINGS_SYSTEM: '/app/settings/system',

  // Platform
  PLATFORM: '/platform',
  PLATFORM_ACADEMIES: '/platform/academies',
  PLATFORM_ACADEMY_DETAIL: (id: string) => `/platform/academies/${id}`,
  PLATFORM_FINANCE: '/platform/finance',
  PLATFORM_SETTINGS: '/platform/settings',

  // Portal
  PORTAL: '/portal',
  PORTAL_TRAINING: '/portal/training',
  PORTAL_PAYMENTS: '/portal/payments',
  PORTAL_ACCOUNT_STATUS: '/portal/account-status',
  PORTAL_TOURNAMENTS: '/portal/tournaments',
  PORTAL_NOTIFICATIONS: '/portal/notifications',
  PORTAL_PROFILE: '/portal/profile',
  PORTAL_ASSESS: '/portal/assess',
  PORTAL_COMPARE: '/portal/compare',
  PORTAL_ANALYTICS: '/portal/analytics',
} as const;

export const STATUS_LABELS: Record<string, string> = {
  // Profile
  pending_approval: 'Pendiente',
  active: 'Activo',
  blocked: 'Bloqueado',
  inactive: 'Inactivo',
  // Membership
  pending: 'Pendiente',
  suspended: 'Suspendido',
  archived: 'Archivado',
  // Session
  scheduled: 'Programado',
  completed: 'Completado',
  cancelled: 'Cancelado',
  // Payment
  under_review: 'En revisión',
  partially_paid: 'Pago parcial',
  confirmed: 'Confirmado',
  overdue: 'Vencido',
  // Payment report
  submitted: 'Enviado',
  rejected: 'Rechazado',
  observed: 'Observado',
  // Expense/Income
  draft: 'Borrador',
  // Tournament
  planned: 'Planificado',
  callup_launched: 'Convocatoria activa',
  in_progress: 'En progreso',
  finished: 'Finalizado',
  // Callup
  accepted: 'Aceptado',
  declined: 'Rechazado',
  // Medical
  approved: 'Aprobado',
  expired: 'Expirado',
  // Attendance
  present: 'Presente',
  absent: 'Ausente',
  late: 'Tardanza',
  justified: 'Justificado',
};

export const STATUS_COLORS: Record<string, string> = {
  active: 'green',
  confirmed: 'green',
  present: 'green',
  accepted: 'green',
  completed: 'green',
  approved: 'green',
  finished: 'green',

  pending: 'amber',
  pending_approval: 'amber',
  scheduled: 'blue',
  planned: 'blue',
  submitted: 'amber',
  under_review: 'amber',
  callup_launched: 'blue',
  in_progress: 'blue',
  partially_paid: 'amber',
  late: 'amber',

  overdue: 'red',
  rejected: 'red',
  blocked: 'red',
  cancelled: 'red',
  expired: 'red',
  declined: 'red',
  absent: 'red',

  inactive: 'slate',
  archived: 'slate',
  draft: 'slate',
  suspended: 'orange',
  observed: 'orange',
  justified: 'purple',
};

export const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  academy_owner: 'Propietario',
  academy_admin: 'Administrador',
  finance_manager: 'Finanzas',
  collections_manager: 'Cobranzas',
  coach: 'Entrenador',
  staff: 'Staff',
  guardian: 'Tutor',
  athlete: 'Atleta',
};

export const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const ADMIN_ROLES = [
  'academy_owner', 'academy_admin', 'finance_manager',
  'collections_manager', 'coach', 'staff',
] as const;

export const PORTAL_ROLES = ['athlete', 'guardian'] as const;
