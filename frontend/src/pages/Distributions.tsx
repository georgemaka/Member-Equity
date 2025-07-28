import { useState } from 'react'
import { useFiscalYear } from '@/contexts/FiscalYearContext'
import { useToast } from '@/contexts/ToastContext'
import PageContainer from '@/components/PageContainer'
import FiscalYearSelectorCompact from '@/components/FiscalYearSelectorCompact'
import { 
  useMockDistributionsData, 
  Distribution,
  DistributionType,
  DistributionStatus,
  DISTRIBUTION_TYPE_LABELS,
  DISTRIBUTION_STATUS_LABELS
} from '@/hooks/useMockDistributionsData'
import { 
  CurrencyDollarIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  DocumentArrowDownIcon,
  PlusIcon,
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  ArrowPathIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

export default function Distributions() {
  const { currentFiscalYear, availableYears } = useFiscalYear()
  const { success, error: showError } = useToast()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedDistribution, setSelectedDistribution] = useState<Distribution | null>(null)
  const [selectedType, setSelectedType] = useState<DistributionType | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = useState<DistributionStatus | 'all'>('all')
  const [showHistoricalView, setShowHistoricalView] = useState(false)
  const [historicalStartYear, setHistoricalStartYear] = useState(currentFiscalYear - 3)
  const [historicalEndYear, setHistoricalEndYear] = useState(currentFiscalYear)

  const { data, isLoading, error } = useMockDistributionsData()

  const handleExport = async () => {
    try {
      // Create CSV content
      const headers = ['Date', 'Type', 'Description', 'Total Amount', 'Status', 'Members', 'Created By', 'Approved By']
      const rows = data?.distributions.map(dist => [
        dist.distributionDate,
        DISTRIBUTION_TYPE_LABELS[dist.type],
        dist.description,
        dist.totalAmount.toFixed(2),
        DISTRIBUTION_STATUS_LABELS[dist.status],
        dist.memberDistributions.length,
        dist.createdBy,
        dist.approvedBy || 'N/A'
      ]) || []

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `distributions-fy${currentFiscalYear}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      success('Export Complete', 'Distribution report downloaded successfully')
    } catch (error) {
      showError('Export Failed', 'Failed to download distribution report')
    }
  }

  const handleApprove = (distribution: Distribution) => {
    success('Distribution Approved', `${distribution.description} has been approved`)
  }

  const handleProcess = (distribution: Distribution) => {
    success('Processing Started', `Payment processing initiated for ${distribution.description}`)
  }

  const getStatusColor = (status: DistributionStatus) => {
    switch (status) {
      case 'draft':
        return 'text-gray-600 bg-gray-50 border-gray-200'
      case 'approved':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'processing':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'cancelled':
        return 'text-red-600 bg-red-50 border-red-200'
    }
  }

  const getTypeColor = (type: DistributionType) => {
    switch (type) {
      case 'quarterly':
        return 'text-blue-600 bg-blue-50'
      case 'annual':
        return 'text-purple-600 bg-purple-50'
      case 'special':
        return 'text-orange-600 bg-orange-50'
      case 'tax':
        return 'text-green-600 bg-green-50'
    }
  }

  const filteredDistributions = data?.distributions.filter(dist => {
    if (selectedType !== 'all' && dist.type !== selectedType) return false
    if (selectedStatus !== 'all' && dist.status !== selectedStatus) return false
    return true
  }) || []

  return (
    <PageContainer fullWidth>
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 px-6 py-8 mb-8">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:flex-auto">
              <h1 className="text-3xl font-bold text-white">Distributions</h1>
              <p className="mt-2 text-purple-100">
                Manage profit distributions to members for FY {currentFiscalYear}
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex items-center space-x-2">
              {/* Fiscal Year Selector */}
              <div className="bg-white/10 backdrop-blur rounded-lg px-3 py-1">
                <FiscalYearSelectorCompact className="text-white" />
              </div>
              
              <button
                onClick={() => setShowHistoricalView(!showHistoricalView)}
                className="inline-flex items-center px-3 py-2 border border-white/20 shadow-sm text-sm leading-4 font-medium rounded-lg text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200"
              >
                <ClockIcon className="h-4 w-4 mr-2" />
                Historical
              </button>
              
              <button
                onClick={handleExport}
                className="inline-flex items-center px-3 py-2 border border-white/20 shadow-sm text-sm leading-4 font-medium rounded-lg text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                Export
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-lg text-purple-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200 transform hover:scale-105"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Distribution
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Historical View Panel */}
      {showHistoricalView && (
        <div className="bg-white shadow-xl rounded-xl border border-gray-100 mb-8 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Historical Distribution Analysis</h3>
              <p className="text-sm text-gray-600">Compare distribution trends across fiscal years</p>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={historicalStartYear}
                onChange={(e) => setHistoricalStartYear(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>FY {year}</option>
                ))}
              </select>
              <span className="text-sm text-gray-500">to</span>
              <select
                value={historicalEndYear}
                onChange={(e) => setHistoricalEndYear(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                {availableYears.filter(year => year >= historicalStartYear).map(year => (
                  <option key={year} value={year}>FY {year}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Historical Charts Placeholder */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-900">Distribution Trends</h4>
                <ChartBarIcon className="h-5 w-5 text-gray-400" />
              </div>
              <div className="h-48 flex items-center justify-center">
                <p className="text-sm text-gray-500">Distribution trend chart placeholder</p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-900">Type Breakdown</h4>
                <ChartBarIcon className="h-5 w-5 text-gray-400" />
              </div>
              <div className="h-48 flex items-center justify-center">
                <p className="text-sm text-gray-500">Distribution type breakdown placeholder</p>
              </div>
            </div>
          </div>
          
          {/* Historical Summary */}
          <div className="mt-6 grid grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-900">$2.4M</div>
              <div className="text-sm text-blue-700">Total Distributed</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-900">+15%</div>
              <div className="text-sm text-green-700">YoY Growth</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-900">18</div>
              <div className="text-sm text-purple-700">Distributions</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-900">$133K</div>
              <div className="text-sm text-orange-700">Avg Distribution</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex space-x-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Distribution Type
          </label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="all">All Types</option>
            {Object.entries(DISTRIBUTION_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="all">All Statuses</option>
            {Object.entries(DISTRIBUTION_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-shadow duration-200">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <CurrencyDollarIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Distributed</dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    ${data?.summary.totalDistributed.toLocaleString() || 0}
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
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                  <ClockIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    ${data?.summary.pendingDistributions.toLocaleString() || 0}
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Average</dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    ${data?.summary.averageDistribution.toLocaleString() || 0}
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
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <CalendarDaysIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Upcoming</dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {data?.summary.upcomingDistributions || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Distributions List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading distributions...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-sm text-red-600">Failed to load distributions</p>
        </div>
      ) : (
        <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Distribution History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Members
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDistributions.map((distribution) => (
                  <tr key={distribution.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(distribution.distributionDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(distribution.type)}`}>
                        {DISTRIBUTION_TYPE_LABELS[distribution.type]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {distribution.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ${distribution.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(distribution.status)}`}>
                        {DISTRIBUTION_STATUS_LABELS[distribution.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {distribution.memberDistributions.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedDistribution(distribution)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        {distribution.status === 'draft' && (
                          <>
                            <button
                              onClick={() => {}}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleApprove(distribution)}
                              className="text-green-600 hover:text-green-900"
                              title="Approve"
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {distribution.status === 'approved' && (
                          <button
                            onClick={() => handleProcess(distribution)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Process Payments"
                          >
                            <BanknotesIcon className="h-4 w-4" />
                          </button>
                        )}
                        {distribution.status === 'processing' && (
                          <ArrowPathIcon className="h-4 w-4 text-gray-400 animate-spin" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Distribution Details Modal */}
      {selectedDistribution && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{selectedDistribution.description}</h3>
                <button
                  onClick={() => setSelectedDistribution(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="text-sm text-gray-500">Total Amount</div>
                  <div className="text-xl font-semibold">${selectedDistribution.totalAmount.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Distribution Date</div>
                  <div className="text-xl font-semibold">{new Date(selectedDistribution.distributionDate).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Type</div>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(selectedDistribution.type)}`}>
                      {DISTRIBUTION_TYPE_LABELS[selectedDistribution.type]}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Status</div>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(selectedDistribution.status)}`}>
                      {DISTRIBUTION_STATUS_LABELS[selectedDistribution.status]}
                    </span>
                  </div>
                </div>
              </div>

              <h4 className="text-md font-semibold mb-4">Member Distributions</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Equity %</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Payment Method</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedDistribution.memberDistributions.slice(0, 10).map((md) => (
                      <tr key={md.memberId}>
                        <td className="px-4 py-2 text-sm text-gray-900">{md.memberName}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{md.equityPercentage.toFixed(2)}%</td>
                        <td className="px-4 py-2 text-sm font-semibold text-gray-900">${md.distributionAmount.toLocaleString()}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 capitalize">{md.paymentMethod}</td>
                        <td className="px-4 py-2 text-sm">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            md.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                            md.paymentStatus === 'sent' ? 'bg-blue-100 text-blue-800' :
                            md.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {md.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {selectedDistribution.memberDistributions.length > 10 && (
                  <div className="text-center py-2 text-sm text-gray-500">
                    And {selectedDistribution.memberDistributions.length - 10} more members...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Distribution Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Create New Distribution</h3>
            <p className="text-gray-600 mb-4">Distribution creation functionality will be implemented here.</p>
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  )
}