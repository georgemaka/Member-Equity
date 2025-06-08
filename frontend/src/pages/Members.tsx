import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { memberApi } from '@/services/memberApi'
import { Member, CreateMemberDto, PaginatedMembers } from '@/types/member'
import { useToast } from '@/contexts/ToastContext'
import { useFiscalYear } from '@/contexts/FiscalYearContext'
import { useMockMembersData } from '@/hooks/useMockMembersData'
import AddMemberModal from '@/components/AddMemberModal'
import ExcelUploadModal from '@/components/ExcelUploadModal'
import BoardEquityView from '@/components/BoardEquityView'
import UpdateStatusModal from '@/components/UpdateStatusModal'
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
  UserCircleIcon
} from '@heroicons/react/24/outline'

export default function Members() {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showBoardView, setShowBoardView] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  
  const queryClient = useQueryClient()
  const { success, error: showError } = useToast()
  const { currentFiscalYear } = useFiscalYear()
  
  // Use mock data for now instead of API
  const { data: membersData, isLoading, error } = useMockMembersData(currentPage, 10)

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

  const filteredMembers = membersData?.data?.filter(member =>
    `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

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
              <button
                onClick={() => setShowBoardView(true)}
                className="inline-flex items-center px-3 py-2 border border-white/20 shadow-sm text-sm leading-4 font-medium rounded-lg text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200"
              >
                <PresentationChartLineIcon className="h-4 w-4 mr-2" />
                Board View
              </button>
              <button
                onClick={handleDownloadTemplate}
                className="inline-flex items-center px-3 py-2 border border-white/20 shadow-sm text-sm leading-4 font-medium rounded-lg text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Template
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center px-3 py-2 border border-white/20 shadow-sm text-sm leading-4 font-medium rounded-lg text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200"
              >
                <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                Upload
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-lg text-sukut-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200 transform hover:scale-105"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Member
              </button>
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

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estimated %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Final %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capital Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
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
                          onClick={() => setSelectedMember(member)}
                          className="p-2 text-sukut-600 hover:text-sukut-700 hover:bg-sukut-50 rounded-lg transition-all duration-200"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button 
                          className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200"
                          title="Edit Member"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {membersData && membersData.totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(membersData.totalPages, currentPage + 1))}
                    disabled={currentPage === membersData.totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">{(currentPage - 1) * 10 + 1}</span>
                      {' '}to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * 10, membersData.total)}
                      </span>
                      {' '}of{' '}
                      <span className="font-medium">{membersData.total}</span>
                      {' '}results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      {[...Array(membersData.totalPages)].map((_, index) => (
                        <button
                          key={index + 1}
                          onClick={() => setCurrentPage(index + 1)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === index + 1
                              ? 'z-10 bg-sukut-50 border-sukut-500 text-sukut-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {index + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(Math.min(membersData.totalPages, currentPage + 1))}
                        disabled={currentPage === membersData.totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
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
    </div>
  )
}