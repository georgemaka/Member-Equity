import { useState } from 'react'
import { useMockAuditTrailData, AuditAction, AuditEntry, AUDIT_ACTION_LABELS } from '@/hooks/useMockAuditTrailData'
import { useToast } from '@/contexts/ToastContext'
import {
  ClockIcon,
  UserIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

interface AuditTrailProps {
  compact?: boolean
  entityId?: string
  entityType?: string
  limit?: number
}

export default function AuditTrail({ compact = false, entityId, entityType, limit = 50 }: AuditTrailProps) {
  const { success } = useToast()
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedAction, setSelectedAction] = useState<AuditAction | 'all'>('all')
  const [selectedUser, setSelectedUser] = useState<string>('all')
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null)

  const { data, isLoading, error } = useMockAuditTrailData(currentPage, limit)

  const handleExport = () => {
    if (!data) return

    const headers = ['Timestamp', 'User', 'Action', 'Entity', 'Description', 'IP Address']
    const rows = data.entries.map(entry => [
      new Date(entry.timestamp).toLocaleString(),
      entry.userName,
      AUDIT_ACTION_LABELS[entry.action],
      entry.entityName || entry.entityType,
      entry.description,
      entry.ipAddress
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-trail-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    success('Export Complete', 'Audit trail exported successfully')
  }

  const getActionIcon = (action: AuditAction) => {
    switch (action) {
      case 'login':
      case 'logout':
        return <UserIcon className="h-4 w-4" />
      case 'member_created':
      case 'distribution_created':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'member_deleted':
        return <ExclamationCircleIcon className="h-4 w-4" />
      default:
        return <InformationCircleIcon className="h-4 w-4" />
    }
  }

  const getActionColor = (action: AuditAction) => {
    switch (action) {
      case 'member_created':
      case 'distribution_created':
        return 'text-green-600 bg-green-50'
      case 'member_deleted':
        return 'text-red-600 bg-red-50'
      case 'login':
      case 'logout':
        return 'text-blue-600 bg-blue-50'
      case 'equity_updated':
      case 'member_updated':
        return 'text-yellow-600 bg-yellow-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const filteredEntries = data?.entries.filter(entry => {
    if (selectedAction !== 'all' && entry.action !== selectedAction) return false
    if (selectedUser !== 'all' && entry.userId !== selectedUser) return false
    if (entityId && entry.entityId !== entityId) return false
    if (entityType && entry.entityType !== entityType) return false
    return true
  }) || []

  const uniqueUsers = Array.from(new Set(data?.entries.map(e => ({ id: e.userId, name: e.userName })) || []))
    .filter((user, index, self) => self.findIndex(u => u.id === user.id) === index)

  if (compact) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <button
            onClick={handleExport}
            className="text-sm text-indigo-600 hover:text-indigo-900"
          >
            Export
          </button>
        </div>
        
        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredEntries.slice(0, 10).map(entry => (
              <div key={entry.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded">
                <div className={`flex-shrink-0 p-1 rounded-full ${getActionColor(entry.action)}`}>
                  {getActionIcon(entry.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{entry.description}</p>
                  <p className="text-xs text-gray-500">
                    {entry.userName} • {new Date(entry.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit Trail</h2>
          <p className="text-sm text-gray-600">Complete activity log and change history</p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
          Export
        </button>
      </div>

      {/* Summary Cards */}
      {data?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{data.summary.last24Hours}</div>
                <div className="text-sm text-gray-500">Activities (24h)</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <UserIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{data.summary.uniqueUsers}</div>
                <div className="text-sm text-gray-500">Active Users</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <InformationCircleIcon className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{data.summary.totalEntries}</div>
                <div className="text-sm text-gray-500">Total Entries</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-4">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value as any)}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="all">All Actions</option>
              {Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="all">All Users</option>
              {uniqueUsers.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Audit Entries */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading audit trail...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-sm text-red-600">Failed to load audit trail</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(entry.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{entry.userName}</div>
                      <div className="text-sm text-gray-500">{entry.userRole}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(entry.action)}`}>
                        {getActionIcon(entry.action)}
                        <span className="ml-1">{AUDIT_ACTION_LABELS[entry.action]}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{entry.entityName || entry.entityType}</div>
                      <div className="text-sm text-gray-500">{entry.entityId}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {entry.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.ipAddress}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedEntry(entry)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total entries)
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={!data.pagination.hasPreviousPage}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
                <span className="text-sm text-gray-700">{currentPage}</span>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!data.pagination.hasNextPage}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Entry Details Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Audit Entry Details</h3>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Timestamp</label>
                  <div className="text-sm text-gray-900">{new Date(selectedEntry.timestamp).toLocaleString()}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">User</label>
                  <div className="text-sm text-gray-900">{selectedEntry.userName} ({selectedEntry.userRole})</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Action</label>
                  <div className="text-sm text-gray-900">{AUDIT_ACTION_LABELS[selectedEntry.action]}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Entity</label>
                  <div className="text-sm text-gray-900">{selectedEntry.entityName || selectedEntry.entityType}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">IP Address</label>
                  <div className="text-sm text-gray-900">{selectedEntry.ipAddress}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Entity ID</label>
                  <div className="text-sm text-gray-900 font-mono">{selectedEntry.entityId}</div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <div className="text-sm text-gray-900">{selectedEntry.description}</div>
              </div>

              {selectedEntry.changes && Object.keys(selectedEntry.changes).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Changes</label>
                  <div className="mt-2 bg-gray-50 rounded-lg p-3">
                    {Object.entries(selectedEntry.changes).map(([field, change]) => (
                      <div key={field} className="flex items-center justify-between py-1">
                        <span className="text-sm font-medium text-gray-700">{field}:</span>
                        <span className="text-sm text-gray-600">
                          <span className="text-red-600">{String(change.from)}</span>
                          {' → '}
                          <span className="text-green-600">{String(change.to)}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-500">User Agent</label>
                <div className="text-xs text-gray-600 font-mono bg-gray-50 p-2 rounded">{selectedEntry.userAgent}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}