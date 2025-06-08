import { useState } from 'react'
import { MemberSummary, GroupAnalysis } from '@/types/dashboard'
import { MemberStatus } from '@/types/member'
import BulkEditModal from '@/components/BulkEditModal'
import {
  UserIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ClockIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline'

interface MemberOverviewProps {
  members: MemberSummary[]
  groupAnalyses: GroupAnalysis[]
  onMemberSelect: (memberId: string) => void
  onMemberCompare: (memberIds: string[]) => void
  loading?: boolean
}

interface MemberRowProps {
  member: MemberSummary
  onSelect: (memberId: string) => void
  onToggleSelect: (memberId: string) => void
  isSelected: boolean
}

const statusColors: Record<MemberStatus, string> = {
  active: 'bg-green-100 text-green-800',
  retired: 'bg-blue-100 text-blue-800',
  resigned: 'bg-gray-100 text-gray-800',
  terminated: 'bg-red-100 text-red-800',
  deceased: 'bg-gray-100 text-gray-800',
  suspended: 'bg-yellow-100 text-yellow-800',
  probationary: 'bg-orange-100 text-orange-800'
}

function MemberRow({ member, onSelect, onToggleSelect, isSelected }: MemberRowProps) {
  const status = member.member.currentStatus?.status || 'active'
  
  return (
    <tr className={`hover:bg-gray-50 transition-colors duration-150 ${isSelected ? 'bg-indigo-50' : ''}`}>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(member.member.id)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-4"
          />
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <UserIcon className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {member.member.firstName} {member.member.lastName}
            </div>
            <div className="text-sm text-gray-500">{member.member.jobTitle}</div>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {member.yearsOfService.toFixed(1)} years
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {member.currentEquityPercentage.toFixed(2)}%
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        ${member.currentCapitalBalance.toLocaleString()}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        ${member.totalTaxPaymentsThisYear.toLocaleString()}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        ${member.totalDistributionsThisYear.toLocaleString()}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button
          onClick={() => onSelect(member.member.id)}
          className="text-indigo-600 hover:text-indigo-900 flex items-center"
        >
          <EyeIcon className="h-4 w-4 mr-1" />
          View
        </button>
      </td>
    </tr>
  )
}

function GroupSection({ group, onMemberSelect, onMemberToggleSelect, selectedMembers }: {
  group: GroupAnalysis
  onMemberSelect: (memberId: string) => void
  onMemberToggleSelect: (memberId: string) => void
  selectedMembers: Set<string>
}) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="mb-6">
      {/* Group Header */}
      <div 
        className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors duration-150"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          {isExpanded ? (
            <ChevronDownIcon className="h-5 w-5 text-gray-500 mr-2" />
          ) : (
            <ChevronRightIcon className="h-5 w-5 text-gray-500 mr-2" />
          )}
          <h3 className="text-lg font-semibold text-gray-900">{group.groupName}</h3>
          <span className="ml-2 text-sm text-gray-500">({group.memberCount} members)</span>
        </div>
        
        <div className="flex items-center space-x-6 text-sm text-gray-600">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-4 w-4 mr-1" />
            ${(group.totalCapital / 1000).toFixed(0)}K
          </div>
          <div className="flex items-center">
            <ChartBarIcon className="h-4 w-4 mr-1" />
            {group.totalEquity.toFixed(1)}%
          </div>
          <div className="flex items-center">
            <ClockIcon className="h-4 w-4 mr-1" />
            {group.averageYearsOfService.toFixed(1)} yrs
          </div>
        </div>
      </div>

      {/* Group Members */}
      {isExpanded && (
        <div className="mt-2 bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <tbody className="bg-white divide-y divide-gray-200">
              {group.members.map((member) => (
                <MemberRow
                  key={member.member.id}
                  member={member}
                  onSelect={onMemberSelect}
                  onToggleSelect={onMemberToggleSelect}
                  isSelected={selectedMembers.has(member.member.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded-lg mb-2"></div>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="h-8 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function MemberOverview({ 
  members, 
  groupAnalyses, 
  onMemberSelect, 
  onMemberCompare, 
  loading 
}: MemberOverviewProps) {
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'equity' | 'capital' | 'service'>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [showBulkEditModal, setShowBulkEditModal] = useState(false)

  const handleToggleSelect = (memberId: string) => {
    setSelectedMembers(prev => {
      const newSelected = new Set(prev)
      if (newSelected.has(memberId)) {
        newSelected.delete(memberId)
      } else {
        newSelected.add(memberId)
      }
      return newSelected
    })
  }

  const handleSelectAll = () => {
    if (selectedMembers.size === members.length) {
      setSelectedMembers(new Set())
    } else {
      setSelectedMembers(new Set(members.map(m => m.member.id)))
    }
  }

  const handleCompareSelected = () => {
    if (selectedMembers.size > 1) {
      onMemberCompare(Array.from(selectedMembers))
    }
  }

  const handleBulkAction = (action: 'edit' | 'status' | 'export' | 'delete') => {
    const selectedIds = Array.from(selectedMembers)
    console.log(`Bulk ${action} for members:`, selectedIds)
    
    switch (action) {
      case 'edit':
        setShowBulkEditModal(true)
        break
      case 'status':
        // Open bulk status change modal
        alert(`Bulk status change for ${selectedIds.length} members`)
        break
      case 'export':
        // Export selected members
        handleExportSelected()
        break
      case 'delete':
        // Confirm and delete selected members
        if (confirm(`Are you sure you want to delete ${selectedIds.length} members?`)) {
          alert(`Delete ${selectedIds.length} members`)
          setSelectedMembers(new Set())
        }
        break
    }
  }

  const handleBulkEdit = (updates: any) => {
    console.log('Bulk edit updates:', updates)
    // In production, this would call the API to update multiple members
    setSelectedMembers(new Set())
  }

  const handleExportSelected = () => {
    const selectedIds = Array.from(selectedMembers)
    const selectedMemberData = members.filter(m => selectedIds.includes(m.member.id))
    
    // Create CSV data
    const headers = ['Name', 'Email', 'Job Title', 'Status', 'Equity %', 'Capital Balance', 'Years of Service']
    const csvData = [
      headers.join(','),
      ...selectedMemberData.map(m => [
        `"${m.member.firstName} ${m.member.lastName}"`,
        m.member.email,
        `"${m.member.jobTitle || ''}"`,
        m.member.currentStatus?.status || 'active',
        m.currentEquityPercentage.toFixed(2),
        m.currentCapitalBalance,
        m.yearsOfService.toFixed(1)
      ].join(','))
    ].join('\n')
    
    // Download CSV
    const blob = new Blob([csvData], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `members-export-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const filteredMembers = members.filter(member =>
    `${member.member.firstName} ${member.member.lastName} ${member.member.jobTitle}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  const sortedMembers = [...filteredMembers].sort((a, b) => {
    let aValue: any, bValue: any
    
    switch (sortBy) {
      case 'name':
        aValue = `${a.member.firstName} ${a.member.lastName}`
        bValue = `${b.member.firstName} ${b.member.lastName}`
        break
      case 'equity':
        aValue = a.currentEquityPercentage
        bValue = b.currentEquityPercentage
        break
      case 'capital':
        aValue = a.currentCapitalBalance
        bValue = b.currentCapitalBalance
        break
      case 'service':
        aValue = a.yearsOfService
        bValue = b.yearsOfService
        break
    }
    
    if (typeof aValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    } else {
      return sortDirection === 'asc' 
        ? aValue - bValue
        : bValue - aValue
    }
  })

  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex-1 max-w-lg">
          <input
            type="text"
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={`${sortBy}-${sortDirection}`}
            onChange={(e) => {
              const [field, direction] = e.target.value.split('-')
              setSortBy(field as any)
              setSortDirection(direction as any)
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="equity-desc">Equity % High-Low</option>
            <option value="equity-asc">Equity % Low-High</option>
            <option value="capital-desc">Capital High-Low</option>
            <option value="capital-asc">Capital Low-High</option>
            <option value="service-desc">Service Years High-Low</option>
            <option value="service-asc">Service Years Low-High</option>
          </select>
          
          {selectedMembers.size > 0 && (
            <div className="flex items-center space-x-2">
              {selectedMembers.size > 1 && (
                <button
                  onClick={handleCompareSelected}
                  className="px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
                >
                  Compare ({selectedMembers.size})
                </button>
              )}
              
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => handleBulkAction('edit')}
                  title="Bulk Edit"
                  className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-white rounded transition-colors duration-200"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                
                <button
                  onClick={() => handleBulkAction('status')}
                  title="Change Status"
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-white rounded transition-colors duration-200"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                </button>
                
                <button
                  onClick={() => handleBulkAction('export')}
                  title="Export Selected"
                  className="p-2 text-gray-600 hover:text-green-600 hover:bg-white rounded transition-colors duration-200"
                >
                  <DocumentArrowDownIcon className="h-4 w-4" />
                </button>
                
                <button
                  onClick={() => handleBulkAction('delete')}
                  title="Delete Selected"
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-white rounded transition-colors duration-200"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
              
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
                {selectedMembers.size} selected
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Grouped View */}
      {groupAnalyses.length > 0 ? (
        <div>
          {groupAnalyses.map((group) => (
            <GroupSection
              key={group.groupName}
              group={group}
              onMemberSelect={onMemberSelect}
              onMemberToggleSelect={handleToggleSelect}
              selectedMembers={selectedMembers}
            />
          ))}
        </div>
      ) : (
        /* Flat Table View */
        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Members ({filteredMembers.length})
              </h3>
              <button
                onClick={handleSelectAll}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                {selectedMembers.size === members.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service Years
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equity %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capital Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tax Payments
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Distributions
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedMembers.map((member) => (
                  <MemberRow
                    key={member.member.id}
                    member={member}
                    onSelect={onMemberSelect}
                    onToggleSelect={handleToggleSelect}
                    isSelected={selectedMembers.has(member.member.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      <BulkEditModal
        memberIds={Array.from(selectedMembers)}
        isOpen={showBulkEditModal}
        onClose={() => setShowBulkEditModal(false)}
        onSave={handleBulkEdit}
      />
    </div>
  )
}