import { useState, useMemo } from 'react'
import { Member } from '@/types/member'
import { MemberSummary } from '@/types/dashboard'
import { useToast } from '@/contexts/ToastContext'
import { useMembers, useCreateMember, useUpdateMember, useUpdateEquity, useRetireMember, useUploadMembers } from '@/hooks/useMembers'
import MemberOverviewEnhanced from '@/components/dashboard/MemberOverviewEnhanced'
import AddMemberModal from '@/components/AddMemberModal'
import ExcelUploadModal from '@/components/ExcelUploadModal'
import BoardEquityView from '@/components/BoardEquityView'
import PermissionGuard from '@/components/PermissionGuard'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorMessage from '@/components/ErrorMessage'
import PageHeader from '@/components/PageHeader'
import YearOverYearComparison from '@/components/YearOverYearComparison'
import { 
  PlusIcon, 
  ArrowUpTrayIcon, 
  ArrowDownTrayIcon,
  UsersIcon,
  ChartBarIcon,
  PresentationChartLineIcon,
  DocumentCheckIcon,
  CurrencyDollarIcon,
  TableCellsIcon
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

// Financial Summary Table Component (Excel-style)
function MemberFinancialSummaryTable({ members }: { members: MemberSummary[] }) {
  const [sortField, setSortField] = useState<string>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Mock financial data - in production this would come from actual financial APIs
  const getFinancialData = (memberId: string) => {
    // Use member ID hash for consistent data
    const hash = memberId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    const baseData = Math.abs(hash % 100000) + 10000
    
    return {
      estimatedProfitsInterest: baseData * 0.05,
      preferredReturn: baseData * 0.08,
      caPteeTaxCredit: baseData * 0.02,
      actualProfitsPercent: (Math.abs(hash % 500) / 100),
      actualProfitsAmount: baseData * 0.04,
      contributions: baseData * 0.3,
      distributions: baseData * 0.2,
      redemptions: baseData * 0.1,
      esPaymentsAccruals: baseData * 0.15,
      reclassificationOther: baseData * 0.05,
      balance: baseData,
      deferredTax: baseData * 0.12
    }
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercent = (percent: number) => {
    return `${percent.toFixed(2)}%`
  }

  // Calculate totals
  const totals = members.reduce((acc, member) => {
    const financialData = getFinancialData(member.member.id)
    return {
      estimatedProfitsInterest: acc.estimatedProfitsInterest + financialData.estimatedProfitsInterest,
      preferredReturn: acc.preferredReturn + financialData.preferredReturn,
      caPteeTaxCredit: acc.caPteeTaxCredit + financialData.caPteeTaxCredit,
      actualProfitsPercent: acc.actualProfitsPercent + financialData.actualProfitsPercent,
      actualProfitsAmount: acc.actualProfitsAmount + financialData.actualProfitsAmount,
      contributions: acc.contributions + financialData.contributions,
      distributions: acc.distributions + financialData.distributions,
      redemptions: acc.redemptions + financialData.redemptions,
      esPaymentsAccruals: acc.esPaymentsAccruals + financialData.esPaymentsAccruals,
      reclassificationOther: acc.reclassificationOther + financialData.reclassificationOther,
      balance: acc.balance + financialData.balance,
      deferredTax: acc.deferredTax + financialData.deferredTax
    }
  }, {
    estimatedProfitsInterest: 0,
    preferredReturn: 0,
    caPteeTaxCredit: 0,
    actualProfitsPercent: 0,
    actualProfitsAmount: 0,
    contributions: 0,
    distributions: 0,
    redemptions: 0,
    esPaymentsAccruals: 0,
    reclassificationOther: 0,
    balance: 0,
    deferredTax: 0
  })

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Member Financial Summary</h3>
        <p className="text-sm text-gray-600">Excel-style financial tracking for FY25</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                Member
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Est. Profits Interest
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Preferred Return
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                CA PTE Tax Credit
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actual Profits %
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actual Profits $
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contributions
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Distributions
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Redemptions
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                ES Payments
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reclassification
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Balance
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Deferred Tax
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {members.map((member) => {
              const financialData = getFinancialData(member.member.id)
              return (
                <tr key={member.member.id} className="hover:bg-gray-50">
                  <td className="px-3 py-4 whitespace-nowrap sticky left-0 bg-white z-10">
                    <div className="text-sm font-medium text-gray-900">
                      {member.member.firstName} {member.member.lastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {member.currentEquityPercentage.toFixed(3)}% equity
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {formatCurrency(financialData.estimatedProfitsInterest)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {formatCurrency(financialData.preferredReturn)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {formatCurrency(financialData.caPteeTaxCredit)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {formatPercent(financialData.actualProfitsPercent)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {formatCurrency(financialData.actualProfitsAmount)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {formatCurrency(financialData.contributions)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {formatCurrency(financialData.distributions)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {formatCurrency(financialData.redemptions)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {formatCurrency(financialData.esPaymentsAccruals)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {formatCurrency(financialData.reclassificationOther)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-center">
                    {formatCurrency(financialData.balance)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {formatCurrency(financialData.deferredTax)}
                  </td>
                </tr>
              )
            })}
            {/* Totals Row */}
            <tr className="bg-gray-100 font-semibold border-t-2 border-gray-300">
              <td className="px-3 py-4 whitespace-nowrap sticky left-0 bg-gray-100 z-10">
                <div className="text-sm font-bold text-gray-900">
                  TOTALS
                </div>
                <div className="text-sm text-gray-600">
                  {members.length} members
                </div>
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                {formatCurrency(totals.estimatedProfitsInterest)}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                {formatCurrency(totals.preferredReturn)}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                {formatCurrency(totals.caPteeTaxCredit)}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                {formatPercent(totals.actualProfitsPercent)}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                {formatCurrency(totals.actualProfitsAmount)}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                {formatCurrency(totals.contributions)}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                {formatCurrency(totals.distributions)}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                {formatCurrency(totals.redemptions)}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                {formatCurrency(totals.esPaymentsAccruals)}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                {formatCurrency(totals.reclassificationOther)}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-center bg-yellow-50">
                {formatCurrency(totals.balance)}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                {formatCurrency(totals.deferredTax)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function MembersEnhanced() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showBoardView, setShowBoardView] = useState(false)
  const [showFinancialSummary, setShowFinancialSummary] = useState(false)
  const [showYearOverYear, setShowYearOverYear] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  
  const { showToast } = useToast()
  
  // API hooks
  const { data: membersData, isLoading, error } = useMembers()
  const createMember = useCreateMember()
  const updateMember = useUpdateMember()
  const updateEquity = useUpdateEquity()
  const retireMember = useRetireMember()
  const uploadMembers = useUploadMembers()

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
    showToast(`Comparing ${memberIds.length} members`, 'info')
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
      showToast('Members data exported successfully', 'success')
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

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <ErrorMessage 
        title="Failed to load members"
        message={(error as Error).message || 'An unexpected error occurred'}
      />
    )
  }

  return (
    <div className="w-full">
      {/* Header */}
      <PageHeader
        title="Members"
        description="Manage member information, equity allocations, and view detailed member profiles"
        showFiscalYear={true}
      >
        <div className="flex items-center space-x-3">
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sukut-500 transition-colors flex items-center"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export
            </button>
            <button
              onClick={() => setShowFinancialSummary(!showFinancialSummary)}
              className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors flex items-center ${
                showFinancialSummary 
                  ? 'bg-green-50 text-green-700 border-green-300' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <CurrencyDollarIcon className="h-4 w-4 mr-2" />
              Financial Summary
            </button>
            <button
              onClick={() => setShowYearOverYear(!showYearOverYear)}
              className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors flex items-center ${
                showYearOverYear 
                  ? 'bg-blue-50 text-blue-700 border-blue-300' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <ChartBarIcon className="h-4 w-4 mr-2" />
              Year-over-Year
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
      </PageHeader>

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

      {/* Year-over-Year Comparison */}
      {showYearOverYear && (
        <div className="mb-8">
          <YearOverYearComparison members={memberSummaries} />
        </div>
      )}

      {/* Content Views */}
      {showBoardView ? (
        <BoardEquityView 
          isOpen={showBoardView} 
          onClose={() => setShowBoardView(false)} 
        />
      ) : showFinancialSummary ? (
        <MemberFinancialSummaryTable members={memberSummaries} />
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