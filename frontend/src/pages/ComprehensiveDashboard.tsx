import { useState } from 'react'
import { dashboardApi } from '@/services/dashboardApi'
import { useFiscalYear } from '@/contexts/FiscalYearContext'
import { useToast } from '@/contexts/ToastContext'
import { useMockDashboardData } from '@/hooks/useMockDashboardData'
import { DashboardFilters, DashboardGroupBy } from '@/types/dashboard'
import ExecutiveSummary from '@/components/dashboard/ExecutiveSummary'
import MemberOverview from '@/components/dashboard/MemberOverview'
import DashboardFiltersPanel from '@/components/dashboard/DashboardFilters'
import MemberDetailModal from '@/components/dashboard/MemberDetailModal'
import ExportModal from '@/components/ExportModal'
import {
  FunnelIcon,
  DocumentArrowDownIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  BellIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'

export default function ComprehensiveDashboard() {
  const { currentFiscalYear } = useFiscalYear()
  const { success, error: showError } = useToast()
  
  const [filters, setFilters] = useState<DashboardFilters>({
    fiscalYears: [currentFiscalYear],
    groupBy: 'none'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const [showExportModal, setShowExportModal] = useState(false)

  // Use mock data for now instead of API
  const { data: dashboardData, isLoading, error } = useMockDashboardData()
  
  const refetch = () => {
    // Mock refetch function
    console.log('Refetching dashboard data...')
  }

  // Use mock data from the dashboard for now
  const recentActivities = dashboardData?.recentActivities || []
  const upcomingDeadlines = dashboardData?.upcomingDeadlines || []

  const handleFiltersChange = (newFilters: DashboardFilters) => {
    setFilters(newFilters)
  }

  const handleResetFilters = () => {
    const defaultFilters: DashboardFilters = {
      fiscalYears: [currentFiscalYear],
      groupBy: 'none'
    }
    setFilters(defaultFilters)
  }

  const handleMemberSelect = (memberId: string) => {
    setSelectedMember(memberId)
  }

  const handleMemberCompare = (memberIds: string[]) => {
    console.log('Comparing members:', memberIds)
    // Here you would open a member comparison modal
  }

  const handleExportReport = async () => {
    try {
      const reportConfig = {
        title: `Dashboard Report - FY ${filters.fiscalYears.join(', ')}`,
        filters,
        includedSections: [
          'executive_summary',
          'member_list',
          'financial_summary',
          'group_analysis'
        ] as Array<'executive_summary' | 'member_list' | 'financial_summary' | 'trend_analysis' | 'group_analysis' | 'compliance_report'>,
        format: 'excel' as const
      }
      
      const blob = await dashboardApi.exportDashboardReport(reportConfig)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dashboard-report-${filters.fiscalYears.join('-')}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      success('Export Complete', 'Dashboard report downloaded successfully')
    } catch (error) {
      showError('Export Failed', 'Failed to download dashboard report')
    }
  }

  const getGroupByLabel = (groupBy: DashboardGroupBy): string => {
    const labels = {
      none: 'All Members',
      position: 'by Position',
      equity_range: 'by Equity Range',
      years_of_service: 'by Years of Service',
      member_status: 'by Status',
      join_date_cohort: 'by Join Date',
      hire_date_cohort: 'by Hire Date',
      capital_account_size: 'by Capital Size',
      tax_payment_frequency: 'by Tax Frequency'
    }
    return labels[groupBy]
  }

  if (error) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Dashboard</h3>
          <p className="text-sm text-gray-500 mb-4">{(error as Error).message}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 px-6 py-8 mb-8">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:flex-auto">
              <h1 className="text-3xl font-bold text-white">Executive Dashboard</h1>
              <p className="mt-2 text-indigo-100">
                Comprehensive member equity management overview
                {filters.fiscalYears.length === 1 
                  ? ` for FY ${filters.fiscalYears[0]}` 
                  : ` comparing FY ${filters.fiscalYears.join(', ')}`
                }
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-2">
              <button
                onClick={() => setShowFilters(true)}
                className="inline-flex items-center px-3 py-2 border border-white/20 shadow-sm text-sm leading-4 font-medium rounded-lg text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200"
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filters
              </button>
              <button
                onClick={() => setShowExportModal(true)}
                className="inline-flex items-center px-3 py-2 border border-white/20 shadow-sm text-sm leading-4 font-medium rounded-lg text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {(filters.groupBy !== 'none' || filters.fiscalYears.length > 1 || filters.memberStatuses) && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-sm font-medium text-blue-900">Active Filters:</span>
              {filters.fiscalYears.length > 1 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Multi-year: FY {filters.fiscalYears.join(', ')}
                </span>
              )}
              {filters.groupBy !== 'none' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Grouped {getGroupByLabel(filters.groupBy)}
                </span>
              )}
              {filters.memberStatuses && filters.memberStatuses.length > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Status: {filters.memberStatuses.join(', ')}
                </span>
              )}
            </div>
            <button
              onClick={handleResetFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Executive Summary */}
      {dashboardData && (
        <ExecutiveSummary
          summary={dashboardData.executiveSummary}
          comparison={dashboardData.yearOverYearComparison?.[0]}
          loading={isLoading}
        />
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Member Overview - Takes up 2 columns */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Member Overview {getGroupByLabel(filters.groupBy)}
              </h2>
              <ChartBarIcon className="h-6 w-6 text-gray-400" />
            </div>
            
            {dashboardData && (
              <MemberOverview
                members={dashboardData.memberSummaries}
                groupAnalyses={dashboardData.groupAnalyses}
                onMemberSelect={handleMemberSelect}
                onMemberCompare={handleMemberCompare}
                loading={isLoading}
              />
            )}
          </div>
        </div>

        {/* Sidebar - Activities and Deadlines */}
        <div className="space-y-6">
          {/* Recent Activities */}
          <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
              <ClockIcon className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="space-y-3">
              {recentActivities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 rounded-full mt-2 bg-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      <span>{new Date(activity.date).toLocaleDateString()}</span>
                      {activity.amount && (
                        <>
                          <span className="mx-1">•</span>
                          <span>${activity.amount.toLocaleString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Deadlines</h3>
              <BellIcon className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="space-y-3">
              {upcomingDeadlines.slice(0, 5).map((deadline, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      deadline.priority === 'high' ? 'bg-red-100 text-red-600' :
                      deadline.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      <CalendarDaysIcon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{deadline.description}</p>
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      <span>Due: {new Date(deadline.dueDate).toLocaleDateString()}</span>
                    </div>
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                      Pending
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors duration-200">
                <div className="flex items-center">
                  <ArrowTrendingUpIcon className="h-5 w-5 text-indigo-600 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-indigo-900">Board Meeting Prep</div>
                    <div className="text-xs text-indigo-600">Review equity adjustments</div>
                  </div>
                </div>
              </button>
              
              <button className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors duration-200">
                <div className="flex items-center">
                  <DocumentArrowDownIcon className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-green-900">Generate Reports</div>
                    <div className="text-xs text-green-600">Export comprehensive data</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Modal */}
      <DashboardFiltersPanel
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
        isOpen={showFilters}
        onToggle={() => setShowFilters(!showFilters)}
      />

      {/* Member Detail Modal */}
      <MemberDetailModal
        memberId={selectedMember}
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
      />

      {/* Export Modal */}
      <ExportModal
        data={dashboardData?.memberSummaries || []}
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Member Data"
        filename="member-equity-report"
      />
    </div>
  )
}