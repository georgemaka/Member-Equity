import { useState } from 'react'
import { useFiscalYear } from '@/contexts/FiscalYearContext'
import { useToast } from '@/contexts/ToastContext'
import { 
  useMockDistributionsData, 
  DISTRIBUTION_TYPE_LABELS,
  DISTRIBUTION_STATUS_LABELS
} from '@/hooks/useMockDistributionsData'
import { 
  useMockDistributionRequests, 
  useMockDistributionRequestSummary
} from '@/hooks/useMockDistributionRequests'
import { 
  CurrencyDollarIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  DocumentArrowDownIcon,
  PlusIcon,
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

export default function DistributionManagementSimple() {
  const { currentFiscalYear } = useFiscalYear()
  const { success, error: showError } = useToast()

  // Fetch data from both sources
  const distributionsQuery = useMockDistributionsData()
  const requestsQuery = useMockDistributionRequests()
  const summaryQuery = useMockDistributionRequestSummary()

  const isLoading = distributionsQuery.isLoading || requestsQuery.isLoading
  const error = distributionsQuery.error || requestsQuery.error

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading distributions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className="text-sm text-red-600">Failed to load distributions: {error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Distribution Management</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage distribution requests and track payment history - FY {currentFiscalYear}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center">
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Export
            </button>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center">
              <PlusIcon className="h-4 w-4 mr-2" />
              New Request
            </button>
          </div>
        </div>
      </div>

      {/* Debug Info */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Debug Info:</h3>
        <p className="text-sm text-gray-600">
          Distributions: {distributionsQuery.data?.distributions?.length || 0} items
        </p>
        <p className="text-sm text-gray-600">
          Requests: {requestsQuery.data?.length || 0} items
        </p>
        <p className="text-sm text-gray-600">
          Summary: {summaryQuery.data ? 'Loaded' : 'Not loaded'}
        </p>
      </div>

      {/* Simple Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution Requests */}
        <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribution Requests</h3>
          {requestsQuery.data && requestsQuery.data.length > 0 ? (
            <div className="space-y-3">
              {requestsQuery.data.slice(0, 5).map((request) => (
                <div key={request.id} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{request.reason}</p>
                      <p className="text-xs text-gray-500">{request.memberName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">${request.amount.toLocaleString()}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        request.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {request.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No requests found</p>
          )}
        </div>

        {/* Distributions */}
        <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distributions</h3>
          {distributionsQuery.data?.distributions && distributionsQuery.data.distributions.length > 0 ? (
            <div className="space-y-3">
              {distributionsQuery.data.distributions.slice(0, 5).map((distribution) => (
                <div key={distribution.id} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{distribution.description}</p>
                      <p className="text-xs text-gray-500">{DISTRIBUTION_TYPE_LABELS[distribution.type]}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">${distribution.totalAmount.toLocaleString()}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        distribution.status === 'completed' ? 'bg-green-100 text-green-800' :
                        distribution.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {DISTRIBUTION_STATUS_LABELS[distribution.status]}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No distributions found</p>
          )}
        </div>
      </div>
    </div>
  )
}