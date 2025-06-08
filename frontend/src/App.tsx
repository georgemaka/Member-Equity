import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MockAuthProvider } from '@/contexts/MockAuthContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { FiscalYearProvider } from '@/contexts/FiscalYearContext'
import ComprehensiveDashboard from '@/pages/ComprehensiveDashboard'
import Members from '@/pages/Members'
import Equity from '@/pages/Equity'
import TaxPayments from '@/pages/TaxPayments'
import YearEndAllocation from '@/pages/YearEndAllocation'
import Distributions from '@/pages/Distributions'
import Analytics from '@/pages/Analytics'
import Layout from '@/components/Layout'

const queryClient = new QueryClient()

function App() {
  return (
    <MockAuthProvider>
      <ToastProvider>
        <FiscalYearProvider>
          <QueryClientProvider client={queryClient}>
            <Router>
              <Layout>
                <Routes>
                  <Route path="/" element={<ComprehensiveDashboard />} />
                  <Route path="/members" element={<Members />} />
                  <Route path="/equity" element={<Equity />} />
                  <Route path="/tax-payments" element={<TaxPayments />} />
                  <Route path="/year-end-allocation" element={<YearEndAllocation />} />
                  <Route path="/distributions" element={<Distributions />} />
                  <Route path="/analytics" element={<Analytics />} />
                </Routes>
              </Layout>
            </Router>
          </QueryClientProvider>
        </FiscalYearProvider>
      </ToastProvider>
    </MockAuthProvider>
  )
}

export default App