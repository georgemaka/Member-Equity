import { useState, useMemo } from 'react'
import { useFiscalYear } from '@/contexts/FiscalYearContext'
import { useToast } from '@/contexts/ToastContext'
import { useMockAuth } from '@/contexts/MockAuthContext'
import { 
  useMockDistributionsData, 
  Distribution,
  DistributionType,
  DistributionStatus,
  DISTRIBUTION_TYPE_LABELS,
  DISTRIBUTION_STATUS_LABELS
} from '@/hooks/useMockDistributionsData'
import { 
  useMockDistributionRequests, 
  useMockDistributionRequestSummary
} from '@/hooks/useMockDistributionRequests'
import { DistributionRequest, RequestStatus } from '@/types/distributionRequest'
import CreateDistributionRequestModal from '@/components/CreateDistributionRequestModal'
import DistributionRequestDetailModal from '@/components/DistributionRequestDetailModal'
import PermissionGuard from '@/components/PermissionGuard'
import PageContainer from '@/components/PageContainer'
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
  TrashIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline'

// Unified status mapping for better workflow
const UNIFIED_STATUS_FLOW = {
  // From Distribution Requests
  'draft': { label: 'Draft', color: 'bg-gray-100 text-gray-800', order: 1, category: 'active' },
  'pending_approval': { label: 'Pending Approval', color: 'bg-yellow-100 text-yellow-800', order: 2, category: 'active' },
  'edit_requested': { label: 'Edit Requested', color: 'bg-orange-100 text-orange-800', order: 3, category: 'active' },
  'approved': { label: 'Approved', color: 'bg-green-100 text-green-800', order: 4, category: 'active' },
  'rejected': { label: 'Rejected', color: 'bg-red-100 text-red-800', order: 5, category: 'history' },
  'cancelled': { label: 'Cancelled', color: 'bg-gray-100 text-gray-800', order: 6, category: 'history' },
  'payment_pending': { label: 'Payment Pending', color: 'bg-blue-100 text-blue-800', order: 7, category: 'active' },
  'payment_processing': { label: 'Processing', color: 'bg-indigo-100 text-indigo-800', order: 8, category: 'active' },
  
  // From Distributions (mapped to unified flow)
  'processing': { label: 'Processing', color: 'bg-indigo-100 text-indigo-800', order: 8, category: 'active' },
  'completed': { label: 'Completed', color: 'bg-emerald-100 text-emerald-800', order: 9, category: 'history' },
  'paid': { label: 'Paid', color: 'bg-emerald-100 text-emerald-800', order: 9, category: 'history' },
  'failed': { label: 'Failed', color: 'bg-red-100 text-red-800', order: 10, category: 'history' }
}

type TabType = 'active' | 'history' | 'all'

interface UnifiedDistribution {
  id: string
  type: 'request' | 'distribution'
  requestNumber?: string
  distributionDate: string
  distributionType: DistributionType | string
  description: string
  amount: number
  status: string
  memberName?: string
  memberCount?: number
  requestedBy?: string
  createdBy?: string
  approvedBy?: string
  createdAt: string
  priority?: string
  reason?: string
  memberDistributions?: any[]
  originalData: DistributionRequest | Distribution
}

export default function DistributionManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('active')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<UnifiedDistribution | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const { currentFiscalYear } = useFiscalYear()
  const { success, error: showError } = useToast()
  const { user } = useMockAuth()

  // Fetch data from both sources
  const distributionsQuery = useMockDistributionsData()
  const requestsQuery = useMockDistributionRequests()
  const summaryQuery = useMockDistributionRequestSummary()

  // Combine and normalize data
  const unifiedData = useMemo(() => {
    const requests: UnifiedDistribution[] = (requestsQuery.data || []).map(req => ({
      id: req.id,
      type: 'request' as const,
      requestNumber: req.requestNumber,
      distributionDate: req.requestedDate,
      distributionType: req.distributionType,
      description: req.reason,
      amount: req.amount,
      status: req.status,
      memberName: req.memberName,
      requestedBy: req.requestedBy,
      createdAt: req.createdAt,
      priority: req.priority,
      reason: req.reason,
      originalData: req
    }))

    const distributions: UnifiedDistribution[] = (distributionsQuery.data?.distributions || []).map(dist => ({
      id: dist.id,
      type: 'distribution' as const,
      distributionDate: dist.distributionDate,
      distributionType: dist.type,
      description: dist.description,
      amount: dist.totalAmount,
      status: dist.status,
      memberCount: dist.memberDistributions?.length,
      createdBy: dist.createdBy,
      approvedBy: dist.approvedBy,
      createdAt: dist.createdAt,
      memberDistributions: dist.memberDistributions,
      originalData: dist
    }))

    return [...requests, ...distributions]
  }, [requestsQuery.data, distributionsQuery.data])

  // Filter data based on active tab
  const filteredByTab = useMemo(() => {
    if (activeTab === 'all') return unifiedData
    
    return unifiedData.filter(item => {
      const statusInfo = UNIFIED_STATUS_FLOW[item.status as keyof typeof UNIFIED_STATUS_FLOW]
      // Default to 'active' category if status not found
      const category = statusInfo?.category || 'active'
      return category === activeTab
    })
  }, [unifiedData, activeTab])

  // Apply search and status filters
  const filteredData = useMemo(() => {
    let filtered = filteredByTab

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(item =>
        item.description.toLowerCase().includes(searchLower) ||
        item.requestNumber?.toLowerCase().includes(searchLower) ||
        item.memberName?.toLowerCase().includes(searchLower) ||
        item.requestedBy?.toLowerCase().includes(searchLower) ||
        item.createdBy?.toLowerCase().includes(searchLower)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.distributionDate || '').getTime() || 0
          bValue = new Date(b.distributionDate || '').getTime() || 0
          break
        case 'amount':
          aValue = a.amount || 0
          bValue = b.amount || 0
          break
        case 'status':
          aValue = UNIFIED_STATUS_FLOW[a.status as keyof typeof UNIFIED_STATUS_FLOW]?.order || 0
          bValue = UNIFIED_STATUS_FLOW[b.status as keyof typeof UNIFIED_STATUS_FLOW]?.order || 0
          break
        default:
          return 0
      }
      
      if (isNaN(aValue) || isNaN(bValue)) return 0
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
    })

    return filtered
  }, [filteredByTab, searchTerm, statusFilter, sortBy, sortDirection])

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!unifiedData || unifiedData.length === 0) {
      return {
        totalActive: 0,
        totalCompleted: 0,
        totalAmount: 0,
        pendingAmount: 0,
        avgAmount: 0,
        pendingApproval: 0
      }
    }

    const activeItems = unifiedData.filter(item => {
      const statusInfo = UNIFIED_STATUS_FLOW[item.status as keyof typeof UNIFIED_STATUS_FLOW]
      return (statusInfo?.category || 'active') === 'active'
    })
    const completedItems = unifiedData.filter(item => 
      ['completed', 'paid'].includes(item.status)
    )
    
    return {
      totalActive: activeItems.length,
      totalCompleted: completedItems.length,
      totalAmount: completedItems.reduce((sum, item) => sum + (item.amount || 0), 0),
      pendingAmount: activeItems.reduce((sum, item) => sum + (item.amount || 0), 0),
      avgAmount: completedItems.length > 0 ? completedItems.reduce((sum, item) => sum + (item.amount || 0), 0) / completedItems.length : 0,
      pendingApproval: activeItems.filter(item => item.status === 'pending_approval').length
    }
  }, [unifiedData])

  const getStatusInfo = (status: string) => {
    return UNIFIED_STATUS_FLOW[status as keyof typeof UNIFIED_STATUS_FLOW] || 
           { label: status?.charAt(0)?.toUpperCase() + status?.slice(1) || 'Unknown', color: 'bg-gray-100 text-gray-800', category: 'active', order: 0 }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return <ClockIcon className="h-4 w-4" />
      case 'approved':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'rejected':
      case 'cancelled':
      case 'failed':
        return <XCircleIcon className="h-4 w-4" />
      case 'completed':
      case 'paid':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'processing':
      case 'payment_processing':
        return <ArrowPathIcon className="h-4 w-4" />
      default:
        return <DocumentCheckIcon className="h-4 w-4" />
    }
  }

  const handleExport = async () => {
    try {
      const headers = ['Date', 'Type', 'Description', 'Amount', 'Status', 'Created By', 'Member/Count']
      const rows = filteredData.map(item => [
        item.distributionDate,
        item.type === 'request' ? 'Request' : 'Distribution',
        item.description,
        item.amount.toFixed(2),
        getStatusInfo(item.status).label,
        item.requestedBy || item.createdBy || '',
        item.memberName || `${item.memberCount || 0} members`
      ])

      const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `distribution-management-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      success('Export Complete', `${activeTab} distributions exported successfully`)
    } catch (error) {
      showError('Export Failed', 'Failed to download distribution report')
    }
  }

  const handleAction = (item: UnifiedDistribution, action: string) => {
    switch (action) {
      case 'approve':
        success('Distribution Approved', `${item.description} has been approved`)
        break
      case 'reject':
        success('Distribution Rejected', `${item.description} has been rejected`)
        break
      case 'process':
        success('Processing Started', `Payment processing initiated for ${item.description}`)
        break
      default:
        console.log(`Action ${action} for item:`, item)
    }
  }

  const getTabCount = (tab: TabType) => {
    switch (tab) {
      case 'active':
        return unifiedData.filter(item => {
          const statusInfo = UNIFIED_STATUS_FLOW[item.status as keyof typeof UNIFIED_STATUS_FLOW]
          return (statusInfo?.category || 'active') === 'active'
        }).length
      case 'history':
        return unifiedData.filter(item => {
          const statusInfo = UNIFIED_STATUS_FLOW[item.status as keyof typeof UNIFIED_STATUS_FLOW]
          return (statusInfo?.category || 'active') === 'history'
        }).length
      case 'all':
        return unifiedData.length
    }
  }

  const isLoading = distributionsQuery.isLoading || requestsQuery.isLoading
  const error = distributionsQuery.error || requestsQuery.error

  return (
    <PageContainer fullWidth>
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
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors flex items-center"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Export
            </button>
            <PermissionGuard permission="distributions:write">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                New Request
              </button>
            </PermissionGuard>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-shadow duration-200">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <ClockIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Items</dt>
                  <dd className="text-2xl font-bold text-gray-900">{metrics.totalActive}</dd>
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
                  <ExclamationTriangleIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Approval</dt>
                  <dd className="text-2xl font-bold text-gray-900">{metrics.pendingApproval}</dd>
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
                  <CurrencyDollarIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Distributed</dt>
                  <dd className="text-2xl font-bold text-gray-900">${metrics.totalAmount.toLocaleString()}</dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Average Amount</dt>
                  <dd className="text-2xl font-bold text-gray-900">${metrics.avgAmount.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {(['active', 'history', 'all'] as TabType[]).map((tab) => {
              const isActive = activeTab === tab
              const count = getTabCount(tab)
              
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 transition-colors ${
                    isActive
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="capitalize">{tab}</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    isActive ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search distributions..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Status</option>
              {Object.entries(UNIFIED_STATUS_FLOW)
                .filter(([_, info]) => activeTab === 'all' || info.category === activeTab)
                .map(([status, info]) => (
                  <option key={status} value={status}>{info.label}</option>
                ))}
            </select>

            <select
              value={`${sortBy}-${sortDirection}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-')
                setSortBy(field as any)
                setSortDirection(direction as any)
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
              <option value="status-asc">Status Order</option>
            </select>
          </div>
        </div>
      </div>

      {/* Distribution List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading distributions...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-sm text-red-600">Failed to load distributions</p>
        </div>
      ) : (
        <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Type
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
                    Created By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Members
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((item) => {
                  const statusInfo = getStatusInfo(item.status)
                  
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(item.distributionDate).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.type === 'request' ? 'Request' : 'Distribution'}
                            {item.requestNumber && ` • ${item.requestNumber}`}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                          {item.description}
                        </div>
                        <div className="text-sm text-gray-500">
                          {DISTRIBUTION_TYPE_LABELS[item.distributionType as DistributionType] || item.distributionType}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          ${item.amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          <span className="mr-1">{getStatusIcon(item.status)}</span>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.requestedBy || item.createdBy || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.memberName || `${item.memberCount || 0} members`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium w-32">
                        <div className="flex items-center justify-end space-x-1">
                          {/* Debug: Always show all buttons to test */}
                          <button
                            onClick={() => {
                              setSelectedItem(item)
                              setSelectedItemId(item.id)
                            }}
                            className="p-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded transition-colors"
                            title="View Details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleAction(item, 'approve')}
                            className="p-1.5 text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition-colors"
                            title="Approve"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                          
                          <button
                            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors"
                            title="Edit"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            
            {filteredData.length === 0 && (
              <div className="text-center py-12">
                <DocumentCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No distributions found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filters.' 
                    : `No ${activeTab} distributions to display.`}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateDistributionRequestModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {selectedItemId && (
        <DistributionRequestDetailModal
          requestId={selectedItemId}
          isOpen={!!selectedItemId}
          onClose={() => {
            setSelectedItemId(null)
            setSelectedItem(null)
          }}
        />
      )}
    </PageContainer>
  )
}