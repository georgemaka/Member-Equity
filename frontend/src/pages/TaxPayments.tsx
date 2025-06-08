import { useState } from 'react'
import { useFiscalYear } from '@/contexts/FiscalYearContext'
import { useToast } from '@/contexts/ToastContext'
import { useMockTaxPaymentsData, PaymentType, PAYMENT_TYPE_LABELS } from '@/hooks/useMockTaxPaymentsData'
import { 
  CurrencyDollarIcon,
  CalendarDaysIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  PlusIcon,
  CloudArrowUpIcon,
  ChartBarIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

export default function TaxPayments() {
  const { currentFiscalYear } = useFiscalYear()
  const { success, error: showError } = useToast()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedTaxYear, setSelectedTaxYear] = useState(new Date().getFullYear())
  const [selectedQuarter, setSelectedQuarter] = useState<'q1' | 'q2' | 'q3' | 'q4' | 'all'>('all')
  const [selectedPaymentType, setSelectedPaymentType] = useState<PaymentType | 'all'>('all')

  const { data, isLoading, error } = useMockTaxPaymentsData()

  const handleExport = async () => {
    try {
      // Create CSV content
      const headers = ['Member Name', 'Payment Type', 'K-1 Income', 'Q1', 'Q2', 'Q3', 'Q4', 'Total Due', 'Total Paid', 'Outstanding']
      const rows = filteredPayments.map(payment => [
        payment.memberName,
        PAYMENT_TYPE_LABELS[payment.paymentType],
        payment.k1Income,
        payment.quarterlyPayments.q1.amount.toFixed(2),
        payment.quarterlyPayments.q2.amount.toFixed(2),
        payment.quarterlyPayments.q3.amount.toFixed(2),
        payment.quarterlyPayments.q4.amount.toFixed(2),
        payment.totalDue.toFixed(2),
        payment.totalPaid.toFixed(2),
        (payment.totalDue - payment.totalPaid).toFixed(2)
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tax-payments-fy${currentFiscalYear}-ty${selectedTaxYear}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      success('Export Complete', 'Tax payment report downloaded successfully')
    } catch (error) {
      showError('Export Failed', 'Failed to download tax payment report')
    }
  }

  const getStatusColor = (status: 'pending' | 'paid' | 'overdue') => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'overdue':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    }
  }

  const getStatusIcon = (status: 'pending' | 'paid' | 'overdue') => {
    switch (status) {
      case 'paid':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'overdue':
        return <XCircleIcon className="h-4 w-4" />
      case 'pending':
        return <ClockIcon className="h-4 w-4" />
    }
  }

  const filteredPayments = data?.taxPayments.filter(payment => {
    // Filter by payment type
    if (selectedPaymentType !== 'all' && payment.paymentType !== selectedPaymentType) {
      return false
    }
    
    // Filter by quarter status
    if (selectedQuarter !== 'all') {
      return payment.quarterlyPayments[selectedQuarter].status !== 'paid'
    }
    
    return true
  }) || []

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
                Track quarterly estimated tax payments for members in FY {currentFiscalYear}
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

      {/* Filters */}
      <div className="mb-6 flex space-x-4">
        <div>
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Type
          </label>
          <select
            value={selectedPaymentType}
            onChange={(e) => setSelectedPaymentType(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">All Types</option>
            {Object.entries(PAYMENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quarter Filter
          </label>
          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">All Quarters</option>
            <option value="q1">Q1 - April 15</option>
            <option value="q2">Q2 - June 15</option>
            <option value="q3">Q3 - September 15</option>
            <option value="q4">Q4 - January 15</option>
          </select>
        </div>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Due</dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    ${data?.summary.totalDue.toLocaleString() || 0}
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
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Paid</dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    ${data?.summary.totalPaid.toLocaleString() || 0}
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
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                  <ExclamationTriangleIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Outstanding</dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    ${data?.summary.totalOutstanding.toLocaleString() || 0}
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
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <ChartBarIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Compliance Rate</dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {data?.summary.complianceRate.toFixed(0) || 0}%
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
          <p className="text-sm text-red-600">Failed to load tax payments</p>
        </div>
      ) : (
        <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Member Tax Payments</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    K-1 Income
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Q1
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Q2
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Q3
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Q4
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Due
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{payment.memberName}</div>
                      {payment.notes && (
                        <div className="text-xs text-gray-500">{payment.notes}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        payment.paymentType === 'federal' ? 'bg-blue-100 text-blue-800' :
                        payment.paymentType.startsWith('state_ca') ? 'bg-green-100 text-green-800' :
                        payment.paymentType.startsWith('state_ny') ? 'bg-purple-100 text-purple-800' :
                        payment.paymentType.startsWith('state_tx') ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {PAYMENT_TYPE_LABELS[payment.paymentType]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${payment.k1Income.toLocaleString()}
                    </td>
                    {(['q1', 'q2', 'q3', 'q4'] as const).map(quarter => {
                      const q = payment.quarterlyPayments[quarter]
                      return (
                        <td key={quarter} className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-sm text-gray-900">
                              ${q.amount.toLocaleString()}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(q.status)}`}>
                              {getStatusIcon(q.status)}
                              <span className="ml-1">{q.status}</span>
                            </span>
                            {q.paidDate && (
                              <span className="text-xs text-gray-500 mt-1">
                                {new Date(q.paidDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </td>
                      )
                    })}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ${payment.totalDue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-green-600">
                        ${payment.totalPaid.toLocaleString()}
                      </div>
                      {payment.totalDue > payment.totalPaid && (
                        <div className="text-xs text-red-600">
                          Outstanding: ${(payment.totalDue - payment.totalPaid).toLocaleString()}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Placeholder modals - you can implement these later */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Add Tax Payment</h3>
            <p className="text-gray-600 mb-4">Tax payment form will be implemented here.</p>
            <button
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Upload Tax Payments</h3>
            <p className="text-gray-600 mb-4">Upload functionality will be implemented here.</p>
            <button
              onClick={() => setShowUploadModal(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}