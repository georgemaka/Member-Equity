import { useState, useMemo } from 'react'
import { Member } from '@/types/member'
import { useToast } from '@/contexts/ToastContext'
import { useMockMembersData } from '@/hooks/useMockMembersData'
import { useMockMemberAllocations } from '@/hooks/useMockFinancialsData'
import { useFiscalYear } from '@/contexts/FiscalYearContext'
import AddMemberModal from '@/components/AddMemberModal'
import ExcelUploadModal from '@/components/ExcelUploadModal'
import BoardEquityView from '@/components/BoardEquityView'
import UpdateStatusModal from '@/components/UpdateStatusModal'
import CreateDistributionRequestModal from '@/components/CreateDistributionRequestModal'
import MemberAllocationModal from '@/components/MemberAllocationModal'
import PermissionGuard from '@/components/PermissionGuard'
import { 
  PlusIcon, 
  ArrowUpTrayIcon, 
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  EyeIcon,
  UsersIcon,
  ChartBarIcon,
  PresentationChartLineIcon,
  CheckCircleIcon,
  UserCircleIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentCheckIcon,
  CurrencyDollarIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

type SortField = 'name' | 'email' | 'joinDate' | 'estimatedEquity' | 'finalEquity' | 'capitalBalance' | 'status' | 'balanceIncentive' | 'equityAllocation' | 'totalAllocation'
type SortDirection = 'asc' | 'desc'

export default function Members() {
  const { currentFiscalYear } = useFiscalYear()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showBoardView, setShowBoardView] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [showDistributionRequestModal, setShowDistributionRequestModal] = useState(false)
  const [selectedMemberForDistribution, setSelectedMemberForDistribution] = useState<Member | null>(null)
  const [showAllocationModal, setShowAllocationModal] = useState(false)
  const [selectedMemberForAllocation, setSelectedMemberForAllocation] = useState<Member | null>(null)
  const [showAllocationDetails, setShowAllocationDetails] = useState(false)
  
  const { success } = useToast()
  
  // Use mock data for now instead of API
  const { data: membersData, isLoading, error } = useMockMembersData(currentPage, pageSize)
  
  // Fetch allocation data for all members
  const { data: allMemberAllocations } = useMockMemberAllocations(currentFiscalYear)

  // Helper function to get allocation data for a specific member
  const getMemberAllocation = (memberId: string) => {
    return allMemberAllocations?.find(allocation => allocation.memberId === memberId)
  }

  const handleDownloadTemplate = () => {
    // Mock template download - in production this would call the API
    const templateData = [
      ['First Name*', 'Last Name*', 'Email*', 'Phone', 'Job Title', 'Address', 'City', 'State', 'Zip Code', 'SSN', 'Tax ID', 'Employee ID', 'Join Date*', 'Hire Date', 'Estimated Equity %*'],
      ['John', 'Smith', 'john.smith@sukut.com', '(555) 123-4567', 'Project Manager', '123 Main St', 'Los Angeles', 'CA', '90210', '123-45-6789', 'T001', 'E001', '2024-01-15', '2023-12-01', '2.5'],
      ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '']
    ]
    
    const csvContent = templateData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'member-upload-template.csv'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    success('Template Downloaded', 'Member upload template has been downloaded successfully')
  }

  // Helper function to get status styling
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-200'
      case 'retired':
        return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-200'
      case 'resigned':
        return 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-200'
      case 'terminated':
        return 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-200'
      case 'deceased':
        return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-200'
      case 'suspended':
        return 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border border-orange-200'
      case 'probationary':
        return 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-200'
      default:
        return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'retired':
        return 'bg-blue-500'
      case 'resigned':
        return 'bg-yellow-500'
      case 'terminated':
        return 'bg-red-500'
      case 'deceased':
        return 'bg-gray-500'
      case 'suspended':
        return 'bg-orange-500'
      case 'probationary':
        return 'bg-purple-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Calculate quick stats for current fiscal year
  const activeMembers = membersData?.data?.filter(m => m.currentStatus?.status === 'active').length || 0
  const totalEstimatedEquity = membersData?.data?.reduce((sum, m) => sum + (m.currentEquity?.estimatedPercentage || 0), 0) || 0
  const totalFinalEquity = membersData?.data?.reduce((sum, m) => sum + (m.currentEquity?.finalPercentage || 0), 0) || 0
  const totalCapital = membersData?.data?.reduce((sum, m) => sum + (m.currentEquity?.capitalBalance || 0), 0) || 0

  // Enhanced filtering and sorting
  const filteredAndSortedMembers = useMemo(() => {
    let filtered = membersData?.data?.filter(member => {
      // Search filter
      const searchMatch = searchTerm === '' || 
        `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.jobTitle || '').toLowerCase().includes(searchTerm.toLowerCase())
      
      // Status filter
      const statusMatch = statusFilter === 'all' || member.currentStatus?.status === statusFilter
      
      return searchMatch && statusMatch
    }) || []
    
    // Sort filtered results
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any
      
      const aAllocation = getMemberAllocation(a.id)
      const bAllocation = getMemberAllocation(b.id)
      
      switch (sortField) {
        case 'name':
          aValue = `${a.firstName} ${a.lastName}`.toLowerCase()
          bValue = `${b.firstName} ${b.lastName}`.toLowerCase()
          break
        case 'email':
          aValue = a.email.toLowerCase()
          bValue = b.email.toLowerCase()
          break
        case 'joinDate':
          aValue = new Date(a.joinDate)
          bValue = new Date(b.joinDate)
          break
        case 'estimatedEquity':
          aValue = a.currentEquity?.estimatedPercentage || 0
          bValue = b.currentEquity?.estimatedPercentage || 0
          break
        case 'finalEquity':
          aValue = a.currentEquity?.finalPercentage || 0
          bValue = b.currentEquity?.finalPercentage || 0
          break
        case 'capitalBalance':
          aValue = a.currentEquity?.capitalBalance || 0
          bValue = b.currentEquity?.capitalBalance || 0
          break
        case 'balanceIncentive':
          aValue = aAllocation?.balanceIncentiveReturn || 0
          bValue = bAllocation?.balanceIncentiveReturn || 0
          break
        case 'equityAllocation':
          aValue = aAllocation?.equityBasedAllocation || 0
          bValue = bAllocation?.equityBasedAllocation || 0
          break
        case 'totalAllocation':
          aValue = aAllocation?.allocationAmount || 0
          bValue = bAllocation?.allocationAmount || 0
          break
        case 'status':
          aValue = a.currentStatus?.status || 'active'
          bValue = b.currentStatus?.status || 'active'
          break
        default:
          return 0
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
    
    return filtered
  }, [membersData?.data, searchTerm, statusFilter, sortField, sortDirection, allMemberAllocations])
  
  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }
  
  // Handle bulk selection
  const handleSelectAll = () => {
    if (selectedMembers.size === filteredAndSortedMembers.length) {
      setSelectedMembers(new Set())
    } else {
      setSelectedMembers(new Set(filteredAndSortedMembers.map(m => m.id)))
    }
  }
  
  const handleSelectMember = (memberId: string) => {
    const newSelected = new Set(selectedMembers)
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId)
    } else {
      newSelected.add(memberId)
    }
    setSelectedMembers(newSelected)
  }
  
  // Get status options for filter
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'retired', label: 'Retired' },
    { value: 'resigned', label: 'Resigned' },
    { value: 'terminated', label: 'Terminated' },
    { value: 'deceased', label: 'Deceased' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'probationary', label: 'Probationary' }
  ]
  
  // Page size options
  const pageSizeOptions = [10, 25, 50, 100]

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Header with gradient background */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-sukut-600 via-sukut-700 to-sukut-800 px-6 py-8 mb-8">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:flex-auto">
              <h1 className="text-3xl font-bold text-white">Members</h1>
              <p className="mt-2 text-sukut-100">
                Manage Sukut Construction equity members and their ownership percentages.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-2">
              <PermissionGuard permission="equity:manage">
                <button
                  onClick={() => setShowBoardView(true)}
                  className="inline-flex items-center px-3 py-2 border border-white/20 shadow-sm text-sm leading-4 font-medium rounded-lg text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200"
                >
                  <PresentationChartLineIcon className="h-4 w-4 mr-2" />
                  Board View
                </button>
              </PermissionGuard>
              <button
                onClick={handleDownloadTemplate}
                className="inline-flex items-center px-3 py-2 border border-white/20 shadow-sm text-sm leading-4 font-medium rounded-lg text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Template
              </button>
              <PermissionGuard permission="members:write">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center px-3 py-2 border border-white/20 shadow-sm text-sm leading-4 font-medium rounded-lg text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200"
                >
                  <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                  Upload
                </button>
              </PermissionGuard>
              <PermissionGuard permission="members:write">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-lg text-sukut-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200 transform hover:scale-105"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Member
                </button>
              </PermissionGuard>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 mb-8">
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Members</dt>
                  <dd className="text-2xl font-bold text-gray-900">{activeMembers}</dd>
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
                  <ChartBarIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Estimated Equity</dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {totalEstimatedEquity < 1 
                      ? totalEstimatedEquity.toFixed(3).replace(/\.?0+$/, '')
                      : totalEstimatedEquity.toFixed(2).replace(/\.?0+$/, '')
                    }%
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
                  <ChartBarIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Final Equity</dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {totalFinalEquity < 1 
                      ? totalFinalEquity.toFixed(3).replace(/\.?0+$/, '')
                      : totalFinalEquity.toFixed(2).replace(/\.?0+$/, '')
                    }%
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
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">$</span>
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Capital</dt>
                  <dd className="text-2xl font-bold text-gray-900">${totalCapital.toLocaleString()}</dd>
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
                  <span className="text-white font-bold text-lg">#</span>
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Members</dt>
                  <dd className="text-2xl font-bold text-gray-900">{membersData?.total || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search members..."
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-sukut-500 focus:border-sukut-500 shadow-sm transition-all duration-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Filters */}
          <div className="flex gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-3 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sukut-500 focus:border-sukut-500 transition-all duration-200"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            
            {/* Page Size */}
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="px-3 py-3 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sukut-500 focus:border-sukut-500 transition-all duration-200"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>{size} per page</option>
              ))}
            </select>
            
            {/* Toggle Filters */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-3 py-3 border border-gray-200 rounded-xl text-sm font-medium transition-all duration-200 ${
                showFilters ? 'bg-sukut-50 text-sukut-600 border-sukut-200' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filters
            </button>
          </div>
        </div>
        
        {/* Bulk Actions */}
        {selectedMembers.size > 0 && (
          <div className="mt-4 p-4 bg-sukut-50 border border-sukut-200 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-sukut-800">
                {selectedMembers.size} member{selectedMembers.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-sm bg-white border border-sukut-300 text-sukut-700 rounded-lg hover:bg-sukut-50 transition-colors duration-200">
                  Export Selected
                </button>
                <button className="px-3 py-1.5 text-sm bg-white border border-sukut-300 text-sukut-700 rounded-lg hover:bg-sukut-50 transition-colors duration-200">
                  Bulk Edit
                </button>
                <button 
                  onClick={() => setSelectedMembers(new Set())}
                  className="px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Active Filters Display */}
        {(searchTerm || statusFilter !== 'all') && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-gray-500">Active filters:</span>
            {searchTerm && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Search: "{searchTerm}"
                <button
                  onClick={() => setSearchTerm('')}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-600 hover:bg-blue-200 hover:text-blue-800"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Status: {statusOptions.find(opt => opt.value === statusFilter)?.label}
                <button
                  onClick={() => setStatusFilter('all')}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-green-600 hover:bg-green-200 hover:text-green-800"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Members Table */}
      <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sukut-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading members...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-sm text-red-600">Failed to load members: {(error as Error).message}</p>
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedMembers.size === filteredAndSortedMembers.length && filteredAndSortedMembers.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-sukut-600 focus:ring-sukut-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center space-x-1 hover:text-gray-700 transition-colors duration-200"
                    >
                      <span>Name</span>
                      {sortField === 'name' && (
                        sortDirection === 'asc' ? 
                          <ChevronUpIcon className="h-4 w-4" /> : 
                          <ChevronDownIcon className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('email')}
                      className="flex items-center space-x-1 hover:text-gray-700 transition-colors duration-200"
                    >
                      <span>Email</span>
                      {sortField === 'email' && (
                        sortDirection === 'asc' ? 
                          <ChevronUpIcon className="h-4 w-4" /> : 
                          <ChevronDownIcon className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('estimatedEquity')}
                      className="flex items-center space-x-1 hover:text-gray-700 transition-colors duration-200"
                    >
                      <span>Estimated %</span>
                      {sortField === 'estimatedEquity' && (
                        sortDirection === 'asc' ? 
                          <ChevronUpIcon className="h-4 w-4" /> : 
                          <ChevronDownIcon className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('finalEquity')}
                      className="flex items-center space-x-1 hover:text-gray-700 transition-colors duration-200"
                    >
                      <span>Final %</span>
                      {sortField === 'finalEquity' && (
                        sortDirection === 'asc' ? 
                          <ChevronUpIcon className="h-4 w-4" /> : 
                          <ChevronDownIcon className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('capitalBalance')}
                      className="flex items-center space-x-1 hover:text-gray-700 transition-colors duration-200"
                    >
                      <span>Capital Balance</span>
                      {sortField === 'capitalBalance' && (
                        sortDirection === 'asc' ? 
                          <ChevronUpIcon className="h-4 w-4" /> : 
                          <ChevronDownIcon className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('balanceIncentive')}
                      className="flex items-center space-x-1 hover:text-gray-700 transition-colors duration-200"
                    >
                      <span>Balance Incentive</span>
                      {sortField === 'balanceIncentive' && (
                        sortDirection === 'asc' ? 
                          <ChevronUpIcon className="h-4 w-4" /> : 
                          <ChevronDownIcon className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('equityAllocation')}
                      className="flex items-center space-x-1 hover:text-gray-700 transition-colors duration-200"
                    >
                      <span>Equity Allocation</span>
                      {sortField === 'equityAllocation' && (
                        sortDirection === 'asc' ? 
                          <ChevronUpIcon className="h-4 w-4" /> : 
                          <ChevronDownIcon className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('totalAllocation')}
                      className="flex items-center space-x-1 hover:text-gray-700 transition-colors duration-200"
                    >
                      <span>Total Allocation</span>
                      {sortField === 'totalAllocation' && (
                        sortDirection === 'asc' ? 
                          <ChevronUpIcon className="h-4 w-4" /> : 
                          <ChevronDownIcon className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('status')}
                      className="flex items-center space-x-1 hover:text-gray-700 transition-colors duration-200"
                    >
                      <span>Status</span>
                      {sortField === 'status' && (
                        sortDirection === 'asc' ? 
                          <ChevronUpIcon className="h-4 w-4" /> : 
                          <ChevronDownIcon className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedMembers.map((member) => (
                  <tr key={member.id} className={`hover:bg-gray-50 transition-colors duration-200 ${
                    selectedMembers.has(member.id) ? 'bg-sukut-50' : ''
                  }`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedMembers.has(member.id)}
                        onChange={() => handleSelectMember(member.id)}
                        className="h-4 w-4 text-sukut-600 focus:ring-sukut-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {member.firstName} {member.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        Joined {new Date(member.joinDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.jobTitle || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-16">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(member.currentEquity?.estimatedPercentage || 0, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 min-w-12">
                          {(member.currentEquity?.estimatedPercentage || 0) < 1 
                            ? (member.currentEquity?.estimatedPercentage || 0).toFixed(3).replace(/\.?0+$/, '')
                            : (member.currentEquity?.estimatedPercentage || 0).toFixed(2).replace(/\.?0+$/, '')
                          }%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-16">
                          <div 
                            className="bg-gradient-to-r from-sukut-500 to-sukut-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(member.currentEquity?.finalPercentage || 0, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 min-w-12">
                          {(member.currentEquity?.finalPercentage || 0) < 1 
                            ? (member.currentEquity?.finalPercentage || 0).toFixed(3).replace(/\.?0+$/, '')
                            : (member.currentEquity?.finalPercentage || 0).toFixed(2).replace(/\.?0+$/, '')
                          }%
                        </span>
                        {member.currentEquity?.isFinalized && (
                          <CheckCircleIcon className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${member.currentEquity?.capitalBalance?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const allocation = getMemberAllocation(member.id)
                        return (
                          <div className="space-y-1">
                            <span className="text-sm font-semibold text-blue-600">
                              ${allocation?.balanceIncentiveReturn?.toLocaleString() || '0'}
                            </span>
                            <div className="text-xs text-gray-500">
                              {allocation?.effectiveReturnRate?.toFixed(2) || '0.00'}% of balance
                            </div>
                          </div>
                        )
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const allocation = getMemberAllocation(member.id)
                        return (
                          <div className="space-y-1">
                            <span className="text-sm font-semibold text-purple-600">
                              ${allocation?.equityBasedAllocation?.toLocaleString() || '0'}
                            </span>
                            <div className="text-xs text-gray-500">
                              {member.currentEquity?.finalPercentage?.toFixed(2) || '0.00'}% equity
                            </div>
                          </div>
                        )
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const allocation = getMemberAllocation(member.id)
                        return (
                          <div className="space-y-1">
                            <span className="text-sm font-bold text-green-600">
                              ${allocation?.allocationAmount?.toLocaleString() || '0'}
                            </span>
                            <div className="text-xs text-gray-500">
                              Total allocation
                            </div>
                          </div>
                        )
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full shadow-sm ${
                        getStatusStyle(member.currentStatus?.status || 'active')
                      }`}>
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          getStatusIcon(member.currentStatus?.status || 'active')
                        }`}></div>
                        {member.currentStatus?.status ? 
                          member.currentStatus.status.charAt(0).toUpperCase() + member.currentStatus.status.slice(1) :
                          'Active'
                        }
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-1">
                        <button
                          onClick={() => {
                            setSelectedMemberForAllocation(member)
                            setShowAllocationModal(true)
                          }}
                          className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                          title="View Allocation Details"
                        >
                          <CurrencyDollarIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setSelectedMember(member)}
                          className="p-2 text-sukut-600 hover:text-sukut-700 hover:bg-sukut-50 rounded-lg transition-all duration-200"
                          title="View Member Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <PermissionGuard permission="members:write">
                          <button 
                            onClick={() => {
                              // TODO: Implement edit member functionality
                              success('Edit Member', 'Edit member functionality will be implemented')
                            }}
                            className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200"
                            title="Edit Member"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        </PermissionGuard>
                        <PermissionGuard permission="members:write">
                          <button
                            onClick={() => {
                              setSelectedMember(member)
                              setShowStatusModal(true)
                            }}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                            title="Update Status"
                          >
                            <UserCircleIcon className="h-4 w-4" />
                          </button>
                        </PermissionGuard>
                        <PermissionGuard resource="distributions">
                          <button
                            onClick={() => {
                              setSelectedMemberForDistribution(member)
                              setShowDistributionRequestModal(true)
                            }}
                            className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-200"
                            title="Create Distribution Request"
                          >
                            <DocumentCheckIcon className="h-4 w-4" />
                          </button>
                        </PermissionGuard>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Enhanced Pagination */}
            {membersData && membersData.totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(membersData.totalPages, currentPage + 1))}
                    disabled={currentPage === membersData.totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div className="flex items-center space-x-4">
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span>
                      {' '}to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * pageSize, filteredAndSortedMembers.length)}
                      </span>
                      {' '}of{' '}
                      <span className="font-medium">{filteredAndSortedMembers.length}</span>
                      {' '}results
                      {filteredAndSortedMembers.length !== membersData.total && (
                        <span className="text-gray-500"> (filtered from {membersData.total} total)</span>
                      )}
                    </p>
                    {selectedMembers.size > 0 && (
                      <span className="text-sm text-sukut-600 font-medium">
                        {selectedMembers.size} selected
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200"
                      >
                        Previous
                      </button>
                      {[...Array(Math.min(membersData.totalPages, 10))].map((_, index) => {
                        const pageNum = index + 1
                        const isCurrentPage = currentPage === pageNum
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors duration-200 ${
                              isCurrentPage
                                ? 'z-10 bg-sukut-50 border-sukut-500 text-sukut-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}
                      {membersData.totalPages > 10 && (
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          ...
                        </span>
                      )}
                      <button
                        onClick={() => setCurrentPage(Math.min(membersData.totalPages, currentPage + 1))}
                        disabled={currentPage === membersData.totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />

      {/* Excel Upload Modal */}
      <ExcelUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
      />

      {/* Board Equity View Modal */}
      <BoardEquityView
        isOpen={showBoardView}
        onClose={() => setShowBoardView(false)}
      />

      {/* Update Status Modal */}
      <UpdateStatusModal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false)
          setSelectedMember(null)
        }}
        member={selectedMember}
      />

      {/* Create Distribution Request Modal */}
      <CreateDistributionRequestModal
        isOpen={showDistributionRequestModal}
        onClose={() => {
          setShowDistributionRequestModal(false)
          setSelectedMemberForDistribution(null)
        }}
        preselectedMemberId={selectedMemberForDistribution?.id}
      />

      {/* Member Allocation Modal */}
      <MemberAllocationModal
        isOpen={showAllocationModal}
        onClose={() => {
          setShowAllocationModal(false)
          setSelectedMemberForAllocation(null)
        }}
        memberId={selectedMemberForAllocation?.id || ''}
        memberName={selectedMemberForAllocation ? `${selectedMemberForAllocation.firstName} ${selectedMemberForAllocation.lastName}` : ''}
      />
    </div>
  )
}