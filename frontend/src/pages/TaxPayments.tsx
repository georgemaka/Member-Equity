import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { taxPaymentApi } from '@/services/taxPaymentApi'
import { useFiscalYear } from '@/contexts/FiscalYearContext'
import { useToast } from '@/contexts/ToastContext'
import { TaxDashboardData, TAX_PAYMENT_TYPE_LABELS } from '@/types/taxPayment'
import AddTaxPaymentModal from '@/components/AddTaxPaymentModal'
import TaxPaymentUploadModal from '@/components/TaxPaymentUploadModal'
import { 
  CurrencyDollarIcon,
  CalendarDaysIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  PlusIcon,
  CloudArrowUpIcon,
  ChartBarIcon,
  UsersIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

export default function TaxPayments() {
  const { currentFiscalYear } = useFiscalYear()
  const { success, error: showError } = useToast()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedTaxYear, setSelectedTaxYear] = useState(new Date().getFullYear())

  const { data: dashboardData, isLoading, error } = useQuery<TaxDashboardData>({
    queryKey: ['tax-dashboard', currentFiscalYear],
    queryFn: () => taxPaymentApi.getTaxDashboard(currentFiscalYear)
  })

  const handleExport = async () => {
    try {
      const blob = await taxPaymentApi.exportTaxPayments(currentFiscalYear, selectedTaxYear)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tax-payments-fy${currentFiscalYear}-ty${selectedTaxYear}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      success('Export Complete', 'Tax payment report downloaded successfully')
    } catch (error) {
      showError('Export Failed', 'Failed to download tax payment report')
    }
  }

  const totalPayments = (dashboardData?.totalCompanyPayments || 0) + (dashboardData?.totalMemberPayments || 0)
  const avgMemberPayment = dashboardData?.memberSummaries?.length 
    ? dashboardData.totalMemberPayments / dashboardData.memberSummaries.length 
    : 0

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 px-6 py-8 mb-8">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:flex-auto">
              <h1 className="text-3xl font-bold text-white">Tax Payments</h1>
              <p className="mt-2 text-emerald-100">
                Track tax payments made on behalf of members for FY {currentFiscalYear}
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-2">
              <button
                onClick={handleExport}
                className="inline-flex items-center px-3 py-2 border border-white/20 shadow-sm text-sm leading-4 font-medium rounded-lg text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                Export
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center px-3 py-2 border border-white/20 shadow-sm text-sm leading-4 font-medium rounded-lg text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200"
              >
                <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                Upload
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-lg text-emerald-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200 transform hover:scale-105"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Payment
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tax Year Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tax Year
        </label>
        <select
          value={selectedTaxYear}
          onChange={(e) => setSelectedTaxYear(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          {Array.from({ length: 5 }, (_, i) => {
            const year = new Date().getFullYear() - i
            return (
              <option key={year} value={year}>
                Tax Year {year}
              </option>
            )
          })}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-shadow duration-200">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <CurrencyDollarIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Payments</dt>
                  <dd className="text-2xl font-bold text-gray-900">${totalPayments.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-shadow duration-200">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <UsersIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Average per Member</dt>
                  <dd className="text-2xl font-bold text-gray-900">${avgMemberPayment.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-shadow duration-200">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <ChartBarIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Payment Types</dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {dashboardData?.paymentsByType ? Object.keys(dashboardData.paymentsByType).length : 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-shadow duration-200">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <ClockIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Upcoming</dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {dashboardData?.upcomingPayments?.length || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading tax payment data...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-sm text-red-600">Failed to load tax payments: {(error as Error).message}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Member Summaries */}
          <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Member Payment Summaries</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {dashboardData?.memberSummaries?.map((summary) => (
                <div key={summary.memberId} className="p-4 border-b border-gray-100 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{summary.memberName}</h4>
                      <p className="text-xs text-gray-500">Tax Year {summary.taxYear}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        ${summary.totalPayments.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {summary.lastPaymentDate ? 
                          `Last: ${new Date(summary.lastPaymentDate).toLocaleDateString()}` : 
                          'No payments'
                        }
                      </p>
                    </div>
                  </div>
                  
                  {/* Quarterly breakdown */}
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {Object.entries(summary.paymentsByQuarter).map(([quarter, amount]) => (
                      <div key={quarter} className="text-center">
                        <p className="text-xs text-gray-500">{quarter}</p>
                        <p className="text-xs font-medium text-gray-900">
                          ${amount.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Types Breakdown */}
          <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Payment Types</h3>
            </div>
            <div className="p-6">
              {dashboardData?.paymentsByType && Object.entries(dashboardData.paymentsByType).map(([type, amount]) => (
                <div key={type} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <span className="text-sm text-gray-700">
                    {TAX_PAYMENT_TYPE_LABELS[type as keyof typeof TAX_PAYMENT_TYPE_LABELS] || type}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    ${amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Payments */}
          <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Payments</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {dashboardData?.recentPayments?.map((payment) => (
                <div key={payment.id} className="p-4 border-b border-gray-100 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {TAX_PAYMENT_TYPE_LABELS[payment.paymentType]}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                        {payment.quarter && ` • Q${payment.quarter}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        ${payment.amount.toLocaleString()}
                      </p>
                      {payment.isEstimated && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          Estimated
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Payments */}
          <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Upcoming Payments</h3>
                {dashboardData?.upcomingPayments && dashboardData.upcomingPayments.length > 0 && (
                  <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
                )}
              </div>
            </div>
            <div className="p-6">
              {dashboardData?.upcomingPayments && dashboardData.upcomingPayments.length > 0 ? (
                dashboardData.upcomingPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {TAX_PAYMENT_TYPE_LABELS[payment.paymentType]}
                      </p>
                      <p className="text-xs text-gray-500">
                        Due: {new Date(payment.paymentDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      ${payment.amount.toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No upcoming payments scheduled
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      <AddTaxPaymentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />

      {/* Upload Modal */}
      <TaxPaymentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
      />
    </div>
  )
}