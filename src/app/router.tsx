import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { MobileShell } from '@/app/layouts/mobile-shell'
import { RouteGuard } from '@/app/route-guard'

const WelcomePage = lazy(() => import('@/features/welcome/pages/welcome-page').then((module) => ({ default: module.WelcomePage })))
const HelpPage = lazy(() => import('@/features/welcome/pages/help-page').then((module) => ({ default: module.HelpPage })))
const LoginPage = lazy(() => import('@/features/auth/pages/login-page').then((module) => ({ default: module.LoginPage })))
const SearchPage = lazy(() => import('@/features/marketplace/pages/search-page').then((module) => ({ default: module.SearchPage })))
const TeacherProfilePage = lazy(() => import('@/features/marketplace/pages/teacher-profile-page').then((module) => ({ default: module.TeacherProfilePage })))
const RateTeacherPage = lazy(() => import('@/features/marketplace/pages/rate-teacher-page').then((module) => ({ default: module.RateTeacherPage })))
const SavedPage = lazy(() => import('@/features/marketplace/pages/saved-page').then((module) => ({ default: module.SavedPage })))
const MessagesPage = lazy(() => import('@/features/marketplace/pages/messages-page').then((module) => ({ default: module.MessagesPage })))
const ParentProfilePage = lazy(() => import('@/features/marketplace/pages/parent-profile-page').then((module) => ({ default: module.ParentProfilePage })))
const ProfileSetupPage = lazy(() => import('@/features/marketplace/pages/profile-setup-page').then((module) => ({ default: module.ProfileSetupPage })))
const DashboardPage = lazy(() => import('@/features/dashboard/pages/dashboard-page').then((module) => ({ default: module.DashboardPage })))
const StudentsPage = lazy(() => import('@/features/students/pages/students-page').then((module) => ({ default: module.StudentsPage })))
const AttendancePage = lazy(() => import('@/features/attendance/pages/attendance-page').then((module) => ({ default: module.AttendancePage })))
const FeesPage = lazy(() => import('@/features/fees/pages/fees-page').then((module) => ({ default: module.FeesPage })))
const ReportsPage = lazy(() => import('@/features/reports/pages/reports-page').then((module) => ({ default: module.ReportsPage })))
const MorePage = lazy(() => import('@/features/settings/pages/more-page').then((module) => ({ default: module.MorePage })))
const InquiriesPage = lazy(() => import('@/features/marketplace/pages/inquiries-page').then((module) => ({ default: module.InquiriesPage })))

function RouteFallback() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#fbf8f1] px-5 text-sm font-bold text-[#746a60]">
      Takhti load ho raha hai...
    </main>
  )
}

export function AppRouter() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route path="/help" element={<HelpPage />} />

        {/* Public routes — NO AUTH REQUIRED */}
        <Route element={<MobileShell />}>
          <Route path="/search" element={<SearchPage />} />
          <Route path="/profile/:id" element={<TeacherProfilePage />} />
          <Route path="/profile/:id/review" element={<RateTeacherPage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/profile" element={<ParentProfilePage />} />
        </Route>


        <Route element={<RouteGuard />}>
          {/* Profile setup wizard — full-screen, no MobileShell */}
          <Route path="/profile/setup" element={<ProfileSetupPage />} />

          <Route element={<MobileShell />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/fees" element={<FeesPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/more" element={<MorePage />} />
            <Route path="/inquiries" element={<InquiriesPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
