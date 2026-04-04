import React, { Suspense } from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { ADMIN_ROLES, PORTAL_ROLES } from '@/lib/constants'
import { AppShellAdmin } from '@/layouts/AppShellAdmin'
import { AppShellPortal } from '@/layouts/AppShellPortal'
import { AppShellPlatform } from '@/layouts/AppShellPlatform'
import * as S from '@/pages/stubs'

function PageLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-surface">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy-700 border-t-transparent" />
    </div>
  )
}

function wrap(Component: React.ComponentType) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  )
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PlatformGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, platformRole } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (platformRole !== 'super_admin') return <Navigate to="/app" replace />
  return <>{children}</>
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, activeAcademy, academyRole } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!activeAcademy) return <Navigate to="/select-academy" replace />
  if (!academyRole || !ADMIN_ROLES.includes(academyRole as typeof ADMIN_ROLES[number])) {
    return <Navigate to="/portal" replace />
  }
  return <>{children}</>
}

function PortalGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, activeAcademy, academyRole } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!activeAcademy) return <Navigate to="/select-academy" replace />
  if (!academyRole || !PORTAL_ROLES.includes(academyRole as typeof PORTAL_ROLES[number])) {
    return <Navigate to="/app" replace />
  }
  return <>{children}</>
}

function RootRedirect() {
  const { isAuthenticated, platformRole, academyRole, activeAcademy } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (platformRole === 'super_admin') return <Navigate to="/platform/academies" replace />
  if (!activeAcademy) return <Navigate to="/select-academy" replace />
  if (academyRole && ADMIN_ROLES.includes(academyRole as typeof ADMIN_ROLES[number])) return <Navigate to="/app/dashboard" replace />
  if (academyRole && PORTAL_ROLES.includes(academyRole as typeof PORTAL_ROLES[number])) return <Navigate to="/portal/training" replace />
  return <Navigate to="/select-academy" replace />
}

export const router = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },
  { path: '/login', element: wrap(S.LoginPage) },
  { path: '/register', element: wrap(S.RegisterPage) },
  { path: '/forgot-password', element: wrap(S.ForgotPasswordPage) },
  { path: '/reset-password', element: wrap(S.ResetPasswordPage) },
  { path: '/accept-invitation', element: wrap(S.AcceptInvitationPage) },
  {
    path: '/select-academy',
    element: <AuthGuard>{wrap(S.SelectAcademyPage)}</AuthGuard>,
  },
  {
    path: '/platform',
    element: <PlatformGuard><AppShellPlatform /></PlatformGuard>,
    children: [
      { index: true, element: <Navigate to="/platform/academies" replace /> },
      { path: 'academies', element: wrap(S.PlatformAcademiesPage) },
      { path: 'academies/:id', element: wrap(S.PlatformAcademyDetailPage) },
      { path: 'finance', element: wrap(S.PlatformFinancePage) },
      { path: 'settings', element: wrap(S.PlatformSettingsPage) },
    ],
  },
  {
    path: '/app',
    element: <AdminGuard><AppShellAdmin /></AdminGuard>,
    children: [
      { index: true, element: <Navigate to="/app/dashboard" replace /> },
      { path: 'dashboard', element: wrap(S.DashboardPage) },
      { path: 'athletes', element: wrap(S.AthletesPage) },
      { path: 'athletes/new', element: wrap(S.AthleteNewPage) },
      { path: 'athletes/:id', element: wrap(S.AthleteDetailPage) },
      { path: 'athletes/:id/edit', element: wrap(S.AthleteEditPage) },
      { path: 'categories', element: wrap(S.CategoriesPage) },
      { path: 'categories/:id', element: wrap(S.CategoryDetailPage) },
      { path: 'trainings', element: wrap(S.TrainingsPage) },
      { path: 'trainings/:id', element: wrap(S.TrainingDetailPage) },
      { path: 'attendance', element: wrap(S.AttendancePage) },
      { path: 'billing', element: wrap(S.BillingPage) },
      { path: 'payment-reports', element: wrap(S.PaymentReportsPage) },
      { path: 'payment-reports/:id', element: wrap(S.PaymentReportDetailPage) },
      { path: 'expenses', element: wrap(S.ExpensesPage) },
      { path: 'expenses/:id', element: wrap(S.ExpenseDetailPage) },
      { path: 'income', element: wrap(S.IncomePage) },
      { path: 'income/:id', element: wrap(S.IncomeDetailPage) },
      { path: 'finance', element: wrap(S.FinancePage) },
      { path: 'finance/pnl', element: wrap(S.FinancePnlPage) },
      { path: 'tournaments', element: wrap(S.TournamentsPage) },
      { path: 'tournaments/:id', element: wrap(S.TournamentDetailPage) },
      { path: 'callups/:id', element: wrap(S.CalloupsDetailPage) },
      { path: 'notifications', element: wrap(S.NotificationsPage) },
      { path: 'members', element: wrap(S.MembersPage) },
      { path: 'members/:id', element: wrap(S.MemberDetailPage) },
      { path: 'invitations/new', element: wrap(S.InvitationsNewPage) },
      { path: 'profile', element: wrap(S.ProfilePage) },
      { path: 'settings/brand', element: wrap(S.SettingsBrandPage) },
      { path: 'settings/notifications', element: wrap(S.SettingsNotificationsPage) },
      { path: 'settings/system', element: wrap(S.SettingsSystemPage) },
    ],
  },
  {
    path: '/portal',
    element: <PortalGuard><AppShellPortal /></PortalGuard>,
    children: [
      { index: true, element: <Navigate to="/portal/training" replace /> },
      { path: 'training', element: wrap(S.PortalTrainingPage) },
      { path: 'payments', element: wrap(S.PortalPaymentsPage) },
      { path: 'account-status', element: wrap(S.PortalAccountStatusPage) },
      { path: 'tournaments', element: wrap(S.PortalTournamentsPage) },
      { path: 'notifications', element: wrap(S.PortalNotificationsPage) },
      { path: 'profile', element: wrap(S.PortalProfilePage) },
    ],
  },
  {
    path: '*',
    element: (
      <div className="flex h-screen items-center justify-center bg-surface flex-col gap-4">
        <p className="text-6xl font-bold text-slate-200">404</p>
        <p className="text-slate-500">Página no encontrada</p>
        <a href="/" className="text-navy-700 text-sm underline">Volver al inicio</a>
      </div>
    ),
  },
])
