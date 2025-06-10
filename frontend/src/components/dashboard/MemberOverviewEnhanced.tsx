import { useState } from 'react'
import { MemberSummary, GroupAnalysis } from '@/types/dashboard'
import { MemberStatus } from '@/types/member'
import BulkEditModal from '@/components/BulkEditModal'
import UpdateStatusModal from '@/components/UpdateStatusModal'
import CreateDistributionRequestModal from '@/components/CreateDistributionRequestModal'
import TaxPaymentDetailModal from '@/components/TaxPaymentDetailModal'
import DistributionDetailModal from '@/components/DistributionDetailModal'
import YearEndAllocationDetailModal from '@/components/YearEndAllocationDetailModal'
import PermissionGuard from '@/components/PermissionGuard'
import {
  UserIcon,
  ChevronDownIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  EyeIcon,
  PencilIcon,
  DocumentArrowDownIcon,
  UserCircleIcon,
  DocumentCheckIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  ChevronUpIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline'

interface MemberOverviewEnhancedProps {
  members: MemberSummary[]
  groupAnalyses: GroupAnalysis[]
  onMemberSelect: (memberId: string) => void
  onMemberCompare: (memberIds: string[]) => void
  loading?: boolean
  fullWidth?: boolean
}

interface MemberRowProps {
  member: MemberSummary
  onSelect: (memberId: string) => void
  onToggleSelect: (memberId: string) => void
  isSelected: boolean
  onEditMember: (member: MemberSummary) => void
  onUpdateStatus: (member: MemberSummary) => void
  onCreateDistribution: (member: MemberSummary) => void
  onTaxPaymentClick: (memberId: string) => void
  onDistributionClick: (memberId: string) => void
  onYearEndAllocationClick: (memberId: string) => void
  getYearEndAllocationData: (memberId: string) => any
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

type SortField = 'name' | 'email' | 'joinDate' | 'service' | 'estimatedEquity' | 'finalEquity' | 'capital' | 'taxPayments' | 'distributions' | 'yearEndAllocation' | 'status'
type SortDirection = 'asc' | 'desc'

function MemberRow({ 
  member, 
  onSelect, 
  onToggleSelect, 
  isSelected,
  onEditMember,
  onUpdateStatus,
  onCreateDistribution,
  onTaxPaymentClick,
  onDistributionClick,
  onYearEndAllocationClick,
  getYearEndAllocationData
}: MemberRowProps) {
  const [showActionsMenu, setShowActionsMenu] = useState(false)
  const status = member.member.currentStatus?.status || 'active'
  const yearEndData = getYearEndAllocationData(member.member.id)
  
  return (
    <tr className={`hover:bg-gray-50 transition-colors duration-150 ${isSelected ? 'bg-indigo-50' : ''}`}>
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(member.member.id)}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
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
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {member.member.email}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {new Date(member.member.joinDate).toLocaleDateString()}
        </div>
        <div className="text-sm text-gray-500">
          {member.yearsOfService.toFixed(1)} years
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-16">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(member.member.currentEquity?.estimatedPercentage || 0, 100)}%` }}
            ></div>
          </div>
          <span className="text-sm font-medium text-gray-900 min-w-12">
            {(member.member.currentEquity?.estimatedPercentage || 0).toFixed(3)}%
          </span>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-16">
            <div 
              className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(member.currentEquityPercentage, 100)}%` }}
            ></div>
          </div>
          <span className="text-sm font-medium text-gray-900 min-w-12">
            {member.currentEquityPercentage.toFixed(3)}%
          </span>
          {member.member.currentEquity?.isFinalized && (
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
          )}
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        ${member.currentCapitalBalance.toLocaleString()}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <button
          onClick={() => onTaxPaymentClick(member.member.id)}
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors"
          title="View tax payment details"
        >
          ${member.totalTaxPaymentsThisYear.toLocaleString()}
        </button>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <button
          onClick={() => onDistributionClick(member.member.id)}
          className="text-sm text-green-600 hover:text-green-800 hover:underline font-medium transition-colors"
          title="View distribution details"
        >
          ${member.totalDistributionsThisYear.toLocaleString()}
        </button>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <button
          onClick={() => onYearEndAllocationClick(member.member.id)}
          className="text-sm text-purple-600 hover:text-purple-800 hover:underline font-medium transition-colors"
          title="View year-end allocation details"
        >
          <div className="space-y-1">
            <div className="font-semibold">
              ${yearEndData.totalYearEndAllocation.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              Preferred + Profits
            </div>
          </div>
        </button>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end space-x-2">
          {/* View Details Button */}
          <button
            onClick={() => onSelect(member.member.id)}
            className="inline-flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-100 transition-colors"
            title="View Member Details"
          >
            <EyeIcon className="h-4 w-4 mr-1" />
            Details
          </button>

          {/* Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="More Actions"
            >
              <EllipsisVerticalIcon className="h-4 w-4" />
            </button>

            {showActionsMenu && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowActionsMenu(false)}
                />
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                  {/* Quick Actions */}
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                    Quick Actions
                  </div>
                  
                  <button
                    onClick={() => {
                      onTaxPaymentClick(member.member.id)
                      setShowActionsMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center"
                  >
                    <CurrencyDollarIcon className="h-4 w-4 mr-3 text-blue-500" />
                    View Tax Payments
                  </button>
                  
                  <button
                    onClick={() => {
                      onDistributionClick(member.member.id)
                      setShowActionsMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 flex items-center"
                  >
                    <DocumentCheckIcon className="h-4 w-4 mr-3 text-green-500" />
                    View Distributions
                  </button>
                  
                  <button
                    onClick={() => {
                      onYearEndAllocationClick(member.member.id)
                      setShowActionsMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 flex items-center"
                  >
                    <ChartBarIcon className="h-4 w-4 mr-3 text-purple-500" />
                    Year-End Allocation
                  </button>

                  {/* Member Management */}
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-t border-gray-100 mt-1">
                    Member Management
                  </div>
                  
                  <PermissionGuard permission="members:write">
                    <button
                      onClick={() => {
                        onUpdateStatus(member)
                        setShowActionsMenu(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    >
                      <UserCircleIcon className="h-4 w-4 mr-3 text-gray-500" />
                      Update Status
                    </button>
                  </PermissionGuard>
                  
                  <PermissionGuard resource="distributions">
                    <button
                      onClick={() => {
                        onCreateDistribution(member)
                        setShowActionsMenu(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    >
                      <DocumentCheckIcon className="h-4 w-4 mr-3 text-gray-500" />
                      Create Distribution
                    </button>
                  </PermissionGuard>
                </div>
              </>
            )}
          </div>
        </div>
      </td>
    </tr>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-16 bg-gray-200 rounded-lg"></div>
        </div>
      ))}
    </div>
  )
}

export default function MemberOverviewEnhanced({ 
  members, 
  groupAnalyses, 
  onMemberSelect, 
  onMemberCompare, 
  loading,
  fullWidth = false
}: MemberOverviewEnhancedProps) {
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [showBulkEditModal, setShowBulkEditModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showDistributionModal, setShowDistributionModal] = useState(false)
  const [selectedMemberForAction, setSelectedMemberForAction] = useState<MemberSummary | null>(null)
  const [showGrouped, setShowGrouped] = useState(false)
  
  // Detail Modal States
  const [showTaxPaymentModal, setShowTaxPaymentModal] = useState(false)
  const [showDistributionDetailModal, setShowDistributionDetailModal] = useState(false)
  const [showYearEndAllocationModal, setShowYearEndAllocationModal] = useState(false)
  const [selectedMemberForModal, setSelectedMemberForModal] = useState<MemberSummary | null>(null)

  // Modal functions - replace navigation with modal opening
  const handleTaxPaymentClick = (memberId: string) => {
    const member = members.find(m => m.member.id === memberId)
    if (member) {
      setSelectedMemberForModal(member)
      setShowTaxPaymentModal(true)
    }
  }

  const handleDistributionClick = (memberId: string) => {
    const member = members.find(m => m.member.id === memberId)
    if (member) {
      setSelectedMemberForModal(member)
      setShowDistributionDetailModal(true)
    }
  }

  const handleYearEndAllocationClick = (memberId: string) => {
    const member = members.find(m => m.member.id === memberId)
    if (member) {
      setSelectedMemberForModal(member)
      setShowYearEndAllocationModal(true)
    }
  }

  // Handle member change within modals (for navigation between members)
  const handleModalMemberChange = (newMember: any) => {
    const memberSummary = members.find(m => m.member.id === newMember.id)
    if (memberSummary) {
      setSelectedMemberForModal(memberSummary)
    }
  }

  // Mock financial data for Year-End Allocation
  const getYearEndAllocationData = (memberId: string) => {
    // Use member ID hash for consistent data
    const hash = memberId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    const baseAmount = Math.abs(hash % 50000) + 5000
    
    return {
      preferredReturn: baseAmount * 0.08, // 8% preferred return
      actualProfitsInterest: baseAmount * 0.04, // 4% actual profits
      totalYearEndAllocation: baseAmount * 0.12 // Combined total
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

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
    if (selectedMembers.size === filteredMembers.length) {
      setSelectedMembers(new Set())
    } else {
      setSelectedMembers(new Set(filteredMembers.map(m => m.member.id)))
    }
  }

  const handleBulkAction = (action: 'edit' | 'status' | 'export' | 'delete') => {
    const selectedIds = Array.from(selectedMembers)
    
    switch (action) {
      case 'edit':
        setShowBulkEditModal(true)
        break
      case 'export':
        handleExportSelected()
        break
      // Handle other actions
    }
  }

  const handleExportSelected = () => {
    const selectedIds = Array.from(selectedMembers)
    const selectedMemberData = members.filter(m => selectedIds.includes(m.member.id))
    
    const headers = ['Name', 'Email', 'Job Title', 'Join Date', 'Status', 'Estimated %', 'Final %', 'Capital Balance', 'Tax Payments', 'Distributions', 'Years of Service']
    const csvData = [
      headers.join(','),
      ...selectedMemberData.map(m => [
        `"${m.member.firstName} ${m.member.lastName}"`,
        m.member.email,
        `"${m.member.jobTitle || ''}"`,
        new Date(m.member.joinDate).toLocaleDateString(),
        m.member.currentStatus?.status || 'active',
        (m.member.currentEquity?.estimatedPercentage || 0).toFixed(3),
        m.currentEquityPercentage.toFixed(3),
        m.currentCapitalBalance,
        m.totalTaxPaymentsThisYear,
        m.totalDistributionsThisYear,
        m.yearsOfService.toFixed(1)
      ].join(','))
    ].join('\n')
    
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
    `${member.member.firstName} ${member.member.lastName} ${member.member.email} ${member.member.jobTitle}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  const sortedMembers = [...filteredMembers].sort((a, b) => {
    let aValue: any, bValue: any
    
    switch (sortField) {
      case 'name':
        aValue = `${a.member.firstName} ${a.member.lastName}`
        bValue = `${b.member.firstName} ${b.member.lastName}`
        break
      case 'email':
        aValue = a.member.email
        bValue = b.member.email
        break
      case 'joinDate':
        aValue = new Date(a.member.joinDate).getTime()
        bValue = new Date(b.member.joinDate).getTime()
        break
      case 'service':
        aValue = a.yearsOfService
        bValue = b.yearsOfService
        break
      case 'estimatedEquity':
        aValue = a.member.currentEquity?.estimatedPercentage || 0
        bValue = b.member.currentEquity?.estimatedPercentage || 0
        break
      case 'finalEquity':
        aValue = a.currentEquityPercentage
        bValue = b.currentEquityPercentage
        break
      case 'capital':
        aValue = a.currentCapitalBalance
        bValue = b.currentCapitalBalance
        break
      case 'taxPayments':
        aValue = a.totalTaxPaymentsThisYear
        bValue = b.totalTaxPaymentsThisYear
        break
      case 'distributions':
        aValue = a.totalDistributionsThisYear
        bValue = b.totalDistributionsThisYear
        break
      case 'yearEndAllocation':
        aValue = getYearEndAllocationData(a.member.id).totalYearEndAllocation
        bValue = getYearEndAllocationData(b.member.id).totalYearEndAllocation
        break
      case 'status':
        aValue = a.member.currentStatus?.status || 'active'
        bValue = b.member.currentStatus?.status || 'active'
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
    <div className={`space-y-6 ${fullWidth ? '' : 'max-w-7xl mx-auto'}`}>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or job title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowGrouped(!showGrouped)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              showGrouped 
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-300' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {showGrouped ? 'Table View' : 'Grouped View'}
          </button>
          
          {selectedMembers.size > 0 && (
            <div className="flex items-center space-x-2">
              {selectedMembers.size > 1 && (
                <button
                  onClick={() => onMemberCompare(Array.from(selectedMembers))}
                  className="px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Compare ({selectedMembers.size})
                </button>
              )}
              
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => handleBulkAction('edit')}
                  title="Bulk Edit"
                  className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-white rounded transition-colors"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                
                <button
                  onClick={() => handleBulkAction('export')}
                  title="Export Selected"
                  className="p-2 text-gray-600 hover:text-green-600 hover:bg-white rounded transition-colors"
                >
                  <DocumentArrowDownIcon className="h-4 w-4" />
                </button>
              </div>
              
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
                {selectedMembers.size} selected
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Table View */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedMembers.size === filteredMembers.length && filteredMembers.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Member</span>
                    {sortField === 'name' && (
                      sortDirection === 'asc' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('email')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Email</span>
                    {sortField === 'email' && (
                      sortDirection === 'asc' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('joinDate')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Join Date</span>
                    {sortField === 'joinDate' && (
                      sortDirection === 'asc' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('estimatedEquity')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Estimated %</span>
                    {sortField === 'estimatedEquity' && (
                      sortDirection === 'asc' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('finalEquity')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Final %</span>
                    {sortField === 'finalEquity' && (
                      sortDirection === 'asc' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('capital')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Capital Balance</span>
                    {sortField === 'capital' && (
                      sortDirection === 'asc' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('taxPayments')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Tax Payments</span>
                    {sortField === 'taxPayments' && (
                      sortDirection === 'asc' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('distributions')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Distributions</span>
                    {sortField === 'distributions' && (
                      sortDirection === 'asc' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('yearEndAllocation')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Year-End Allocation</span>
                    {sortField === 'yearEndAllocation' && (
                      sortDirection === 'asc' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Status</span>
                    {sortField === 'status' && (
                      sortDirection === 'asc' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />
                    )}
                  </button>
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
                  onEditMember={(m) => console.log('Edit member:', m)}
                  onUpdateStatus={(m) => {
                    setSelectedMemberForAction(m)
                    setShowStatusModal(true)
                  }}
                  onCreateDistribution={(m) => {
                    setSelectedMemberForAction(m)
                    setShowDistributionModal(true)
                  }}
                  onTaxPaymentClick={handleTaxPaymentClick}
                  onDistributionClick={handleDistributionClick}
                  onYearEndAllocationClick={handleYearEndAllocationClick}
                  getYearEndAllocationData={getYearEndAllocationData}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <BulkEditModal
        memberIds={Array.from(selectedMembers)}
        isOpen={showBulkEditModal}
        onClose={() => setShowBulkEditModal(false)}
        onSave={(updates) => {
          console.log('Bulk edit updates:', updates)
          setSelectedMembers(new Set())
        }}
      />

      {selectedMemberForAction && (
        <>
          <UpdateStatusModal
            member={selectedMemberForAction.member}
            isOpen={showStatusModal}
            onClose={() => {
              setShowStatusModal(false)
              setSelectedMemberForAction(null)
            }}
          />
          
          <CreateDistributionRequestModal
            member={selectedMemberForAction.member}
            isOpen={showDistributionModal}
            onClose={() => {
              setShowDistributionModal(false)
              setSelectedMemberForAction(null)
            }}
          />
        </>
      )}

      {/* Detail Modals */}
      <TaxPaymentDetailModal
        isOpen={showTaxPaymentModal}
        onClose={() => {
          setShowTaxPaymentModal(false)
          setSelectedMemberForModal(null)
        }}
        member={selectedMemberForModal?.member || null}
        allMembers={members.map(m => m.member)}
        onMemberChange={handleModalMemberChange}
      />

      <DistributionDetailModal
        isOpen={showDistributionDetailModal}
        onClose={() => {
          setShowDistributionDetailModal(false)
          setSelectedMemberForModal(null)
        }}
        member={selectedMemberForModal?.member || null}
        allMembers={members.map(m => m.member)}
        onMemberChange={handleModalMemberChange}
      />

      <YearEndAllocationDetailModal
        isOpen={showYearEndAllocationModal}
        onClose={() => {
          setShowYearEndAllocationModal(false)
          setSelectedMemberForModal(null)
        }}
        member={selectedMemberForModal?.member || null}
        allMembers={members.map(m => m.member)}
        onMemberChange={handleModalMemberChange}
      />
    </div>
  )
}