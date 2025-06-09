import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MockAuthProvider } from '@/contexts/MockAuthContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { FiscalYearProvider } from '@/contexts/FiscalYearContext'
import ComprehensiveDashboard from '@/pages/ComprehensiveDashboard'
import MemberDashboard from '@/pages/MemberDashboard'
import MembersEnhanced from '@/pages/MembersEnhanced'
import Equity from '@/pages/Equity'
import TaxPayments from '@/pages/TaxPayments'
import YearEndAllocation from '@/pages/YearEndAllocation'
import DistributionManagement from '@/pages/DistributionManagement'
import Analytics from '@/pages/Analytics'
import Documents from '@/pages/Documents'
import Audit from '@/pages/Audit'
import Layout from '@/components/Layout'
import PermissionGuard from '@/components/PermissionGuard'
import { useMockAuth } from '@/contexts/MockAuthContext'

const queryClient = new QueryClient()

function AppRoutes() {
  const { user } = useMockAuth()
  
  // Different dashboard based on user role
  const DashboardComponent = user?.role === 'member' ? MemberDashboard : ComprehensiveDashboard
  
  return (
    <Routes>
      <Route path="/" element={<DashboardComponent />} />
      <Route 
        path="/members" 
        element={
          <PermissionGuard resource="members">
            <MembersEnhanced />
          </PermissionGuard>
        } 
      />
      <Route 
        path="/equity" 
        element={
          <PermissionGuard resource="equity">
            <Equity />
          </PermissionGuard>
        } 
      />
      <Route 
        path="/tax-payments" 
        element={
          <PermissionGuard resource="tax-payments">
            <TaxPayments />
          </PermissionGuard>
        } 
      />
      <Route 
        path="/year-end-allocation" 
        element={
          <PermissionGuard permission="equity:write">
            <YearEndAllocation />
          </PermissionGuard>
        } 
      />
      <Route 
        path="/distributions" 
        element={
          <PermissionGuard resource="distributions">
            <DistributionManagement />
          </PermissionGuard>
        } 
      />
      {/* Legacy route redirect for distribution-requests */}
      <Route 
        path="/distribution-requests" 
        element={
          <PermissionGuard resource="distributions">
            <DistributionManagement />
          </PermissionGuard>
        } 
      />
      <Route 
        path="/analytics" 
        element={
          <PermissionGuard resource="analytics">
            <Analytics />
          </PermissionGuard>
        } 
      />
      <Route 
        path="/documents" 
        element={
          <PermissionGuard resource="documents">
            <Documents />
          </PermissionGuard>
        } 
      />
      <Route 
        path="/audit" 
        element={
          <PermissionGuard resource="audit">
            <Audit />
          </PermissionGuard>
        } 
      />
    </Routes>
  )
}

function App() {
  return (
    <MockAuthProvider>
      <ToastProvider>
        <FiscalYearProvider>
          <QueryClientProvider client={queryClient}>
            <Router>
              <Layout>
                <AppRoutes />
              </Layout>
            </Router>
          </QueryClientProvider>
        </FiscalYearProvider>
      </ToastProvider>
    </MockAuthProvider>
  )
}

export default App