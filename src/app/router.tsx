import { Navigate, Route, Routes } from 'react-router-dom'
import { MobileShell } from '@/app/layouts/mobile-shell'
import { RouteGuard } from '@/app/route-guard'
import { AttendancePage } from '@/features/attendance/pages/attendance-page'
import { LoginPage } from '@/features/auth/pages/login-page'
import { DashboardPage } from '@/features/dashboard/pages/dashboard-page'
import { FeesPage } from '@/features/fees/pages/fees-page'
import { ReportsPage } from '@/features/reports/pages/reports-page'
import { ProfileSetupPage } from '@/features/marketplace/pages/profile-setup-page'
import { SearchPage } from '@/features/marketplace/pages/search-page'
import { TeacherProfilePage } from '@/features/marketplace/pages/teacher-profile-page'
import { RateTeacherPage } from '@/features/marketplace/pages/rate-teacher-page'
import { InquiriesPage } from '@/features/marketplace/pages/inquiries-page'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Public routes — NO AUTH REQUIRED */}
      <Route path="/search" element={<SearchPage />} />
      <Route path="/profile/:id" element={<TeacherProfilePage />} />
      <Route path="/profile/:id/review" element={<RateTeacherPage />} />


      <Route element={<RouteGuard />}>
        {/* Profile setup wizard — full-screen, no MobileShell */}
        <Route path="/profile/setup" element={<ProfileSetupPage />} />

        <Route element={<MobileShell />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/fees" element={<FeesPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/inquiries" element={<InquiriesPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
