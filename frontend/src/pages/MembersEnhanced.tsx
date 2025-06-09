import { useState, useMemo } from 'react'
import { Member } from '@/types/member'
import { MemberSummary } from '@/types/dashboard'
import { useToast } from '@/contexts/ToastContext'
import { useMockMembersData } from '@/hooks/useMockMembersData'
import MemberOverviewEnhanced from '@/components/dashboard/MemberOverviewEnhanced'
import AddMemberModal from '@/components/AddMemberModal'
import ExcelUploadModal from '@/components/ExcelUploadModal'
import BoardEquityView from '@/components/BoardEquityView'
import PermissionGuard from '@/components/PermissionGuard'
import { 
  PlusIcon, 
  ArrowUpTrayIcon, 
  ArrowDownTrayIcon,
  UsersIcon,
  ChartBarIcon,
  PresentationChartLineIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline'

// Adapter function to convert Member to MemberSummary
const convertToMemberSummary = (member: Member): MemberSummary => {
  const joinDate = new Date(member.joinDate)
  const now = new Date()
  const yearsOfService = (now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 365)

  return {
    member,
    yearsOfService,
    currentEquityPercentage: member.currentEquity?.finalPercentage || member.currentEquity?.estimatedPercentage || 0,
    currentCapitalBalance: member.currentEquity?.capitalBalance || 0,
    totalTaxPaymentsThisYear: 0, // This would come from tax payments data
    totalDistributionsThisYear: 0, // This would come from distributions data
    lastStatusChange: member.currentStatus ? {
      date: member.currentStatus.effectiveDate,
      fromStatus: 'active' as const,
      toStatus: member.currentStatus.status
    } : undefined,
    lastEquityChange: member.currentEquity ? {
      date: member.currentEquity.effectiveDate || member.joinDate,
      fromPercentage: 0,
      toPercentage: member.currentEquity.finalPercentage || member.currentEquity.estimatedPercentage || 0
    } : undefined,
    recentActivity: []
  }
}

export default function MembersEnhanced() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showBoardView, setShowBoardView] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  
  const { success } = useToast()
  const { data: membersData, isLoading, error } = useMockMembersData(1, 100) // Get all members
  
  // Debug logging
  console.log('Members data:', membersData)
  console.log('Is loading:', isLoading)
  console.log('Error:', error)

  // Convert Member data to MemberSummary format
  const memberSummaries = useMemo(() => {
    if (!membersData?.data) return []
    return membersData.data.map(convertToMemberSummary)
  }, [membersData?.data])

  const handleMemberSelect = (memberId: string) => {
    const member = membersData?.data.find(m => m.id === memberId)
    if (member) {
      setSelectedMember(member)
    }
  }

  const handleMemberCompare = (memberIds: string[]) => {
    success('Member Comparison', `Comparing ${memberIds.length} members`)
  }

  const handleAddMember = () => {
    setShowAddModal(true)
  }

  const handleBulkUpload = () => {
    setShowUploadModal(true)
  }

  const handleExport = async () => {
    try {
      const headers = ['Name', 'Email', 'Job Title', 'Join Date', 'Status', 'Estimated %', 'Final %', 'Capital Balance', 'Years of Service']
      const rows = memberSummaries.map(summary => [
        `${summary.member.firstName} ${summary.member.lastName}`,
        summary.member.email,
        summary.member.jobTitle || '',
        new Date(summary.member.joinDate).toLocaleDateString(),
        summary.member.currentStatus?.status || 'active',
        (summary.member.currentEquity?.estimatedPercentage || 0).toFixed(3),
        summary.currentEquityPercentage.toFixed(3),
        summary.currentCapitalBalance,
        summary.yearsOfService.toFixed(1)
      ])

      const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `members-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      success('Export Complete', 'Members data exported successfully')
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (!memberSummaries.length) return null

    const totalEstimatedEquity = memberSummaries.reduce((sum, member) => 
      sum + (member.member.currentEquity?.estimatedPercentage || 0), 0)
    const totalFinalEquity = memberSummaries.reduce((sum, member) => 
      sum + member.currentEquityPercentage, 0)
    const totalCapital = memberSummaries.reduce((sum, member) => 
      sum + member.currentCapitalBalance, 0)

    return {
      totalMembers: memberSummaries.length,
      totalEstimatedEquity,
      totalFinalEquity,
      totalCapital
    }
  }, [memberSummaries])

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className="text-sm text-red-600">Failed to load members: {(error as Error).message}</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Members</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage member information, equity allocations, and view detailed member profiles
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sukut-500 transition-colors flex items-center"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export
            </button>
            <button
              onClick={() => setShowBoardView(!showBoardView)}
              className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors flex items-center ${
                showBoardView 
                  ? 'bg-sukut-50 text-sukut-700 border-sukut-300' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <PresentationChartLineIcon className="h-4 w-4 mr-2" />
              Board View
            </button>
            <PermissionGuard permission="members:write">
              <button
                onClick={handleBulkUpload}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors flex items-center"
              >
                <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                Bulk Upload
              </button>
              <button
                onClick={handleAddMember}
                className="px-4 py-2 bg-sukut-600 text-white rounded-lg text-sm font-medium hover:bg-sukut-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sukut-500 transition-colors flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Member
              </button>
            </PermissionGuard>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summaryMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-shadow duration-200">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-r from-sukut-500 to-sukut-600 rounded-lg flex items-center justify-center">
                    <UsersIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Members</dt>
                    <dd className="text-2xl font-bold text-gray-900">{summaryMetrics.totalMembers}</dd>
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Estimated Equity</dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {summaryMetrics.totalEstimatedEquity < 1 
                        ? summaryMetrics.totalEstimatedEquity.toFixed(3).replace(/\.?0+$/, '')
                        : summaryMetrics.totalEstimatedEquity.toFixed(2).replace(/\.?0+$/, '')
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
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <DocumentCheckIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Final Equity</dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {summaryMetrics.totalFinalEquity < 1 
                        ? summaryMetrics.totalFinalEquity.toFixed(3).replace(/\.?0+$/, '')
                        : summaryMetrics.totalFinalEquity.toFixed(2).replace(/\.?0+$/, '')
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
                    <dd className="text-2xl font-bold text-gray-900">${summaryMetrics.totalCapital.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Board View or Enhanced Table */}
      {showBoardView ? (
        <BoardEquityView />
      ) : (
        <MemberOverviewEnhanced
          members={memberSummaries}
          groupAnalyses={[]} // No grouping for now
          onMemberSelect={handleMemberSelect}
          onMemberCompare={handleMemberCompare}
          loading={isLoading}
          fullWidth={true}
        />
      )}

      {/* Modals */}
      <AddMemberModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />

      <ExcelUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
      />
    </div>
  )
}