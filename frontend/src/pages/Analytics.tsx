import { useState } from 'react'
import { useMockMembersData } from '@/hooks/useMockMembersData'
import { useMockDistributionsData } from '@/hooks/useMockDistributionsData'
import { useMockTaxPaymentsData } from '@/hooks/useMockTaxPaymentsData'
import { useFiscalYear } from '@/contexts/FiscalYearContext'
import { useToast } from '@/contexts/ToastContext'
import PermissionGuard from '@/components/PermissionGuard'
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  UsersIcon,
  CalendarDaysIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
  ChartPieIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface AnalyticsMetric {
  title: string
  value: string | number
  change: number
  changeType: 'increase' | 'decrease' | 'neutral'
  icon: any
  color: string
}

interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string[]
    borderColor?: string
    fill?: boolean
  }[]
}

export default function Analytics() {
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('year')
  const [selectedMetric, setSelectedMetric] = useState<'equity' | 'distributions' | 'tax'>('equity')
  const [showExportModal, setShowExportModal] = useState(false)
  
  const { currentFiscalYear } = useFiscalYear()
  const { success } = useToast()
  
  // Get data
  const { data: membersData } = useMockMembersData(1, 100)
  const { data: distributionsData } = useMockDistributionsData()
  const { data: taxData } = useMockTaxPaymentsData()

  // Calculate metrics
  const totalMembers = membersData?.total || 0
  const activeMembers = membersData?.data?.filter(m => m.currentStatus?.status === 'active').length || 0
  const totalEstimatedEquity = membersData?.data?.reduce((sum, m) => sum + (m.currentEquity?.estimatedPercentage || 0), 0) || 0
  const totalCapitalBalance = membersData?.data?.reduce((sum, m) => sum + (m.currentEquity?.capitalBalance || 0), 0) || 0
  
  const totalDistributionsAmount = distributionsData?.distributions?.reduce((sum: number, dist: any) => 
    sum + dist.distributions.reduce((distSum: number, d: any) => distSum + d.distributionAmount, 0), 0
  ) || 0
  
  const totalTaxPayments = taxData?.taxPayments?.reduce((sum: number, tax: any) => sum + tax.totalPaid, 0) || 0

  // Analytics metrics
  const metrics: AnalyticsMetric[] = [
    {
      title: 'Total Members',
      value: totalMembers,
      change: 12.5,
      changeType: 'increase',
      icon: UsersIcon,
      color: 'blue'
    },
    {
      title: 'Active Members',
      value: activeMembers,
      change: 8.2,
      changeType: 'increase',
      icon: UsersIcon,
      color: 'green'
    },
    {
      title: 'Total Equity %',
      value: `${totalEstimatedEquity.toFixed(2)}%`,
      change: 2.1,
      changeType: 'increase',
      icon: ChartPieIcon,
      color: 'purple'
    },
    {
      title: 'Capital Balance',
      value: `$${totalCapitalBalance.toLocaleString()}`,
      change: 15.3,
      changeType: 'increase',
      icon: CurrencyDollarIcon,
      color: 'indigo'
    },
    {
      title: 'Total Distributions',
      value: `$${totalDistributionsAmount.toLocaleString()}`,
      change: -5.2,
      changeType: 'decrease',
      icon: ArrowTrendingUpIcon,
      color: 'orange'
    },
    {
      title: 'Tax Payments',
      value: `$${totalTaxPayments.toLocaleString()}`,
      change: 18.7,
      changeType: 'increase',
      icon: CurrencyDollarIcon,
      color: 'red'
    }
  ]

  // Mock chart data
  const equityTrendData: ChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Total Equity %',
      data: [98.2, 98.7, 99.1, 99.3, 99.6, 99.8],
      borderColor: '#6366f1',
      fill: false
    }]
  }

  const distributionsByTypeData: ChartData = {
    labels: ['Quarterly', 'Annual', 'Special', 'Tax'],
    datasets: [{
      label: 'Distribution Amount',
      data: [125000, 85000, 25000, 15000],
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
    }]
  }

  const memberGrowthData: ChartData = {
    labels: ['2020', '2021', '2022', '2023', '2024'],
    datasets: [{
      label: 'Total Members',
      data: [8, 12, 15, 18, 22],
      borderColor: '#10b981',
      fill: false
    }]
  }

  const handleExportReport = (format: 'pdf' | 'excel' | 'csv') => {
    setShowExportModal(false)
    success('Export Started', `${format.toUpperCase()} report is being generated`)
  }

  const getMetricIcon = (metric: AnalyticsMetric) => {
    const IconComponent = metric.icon
    const colorClasses = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      indigo: 'bg-indigo-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500'
    }
    
    return (
      <div className={`w-10 h-10 ${colorClasses[metric.color as keyof typeof colorClasses]} rounded-lg flex items-center justify-center`}>
        <IconComponent className="h-6 w-6 text-white" />
      </div>
    )
  }

  const getChangeIndicator = (metric: AnalyticsMetric) => {
    const isPositive = metric.changeType === 'increase'
    const Icon = isPositive ? ArrowTrendingUpIcon : ArrowTrendingDownIcon
    const colorClass = isPositive ? 'text-green-600' : 'text-red-600'
    
    return (
      <div className={`flex items-center ${colorClass}`}>
        <Icon className="h-4 w-4 mr-1" />
        <span className="text-sm font-medium">{Math.abs(metric.change)}%</span>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 px-6 py-8 mb-8">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:flex-auto">
              <h1 className="text-3xl font-bold text-white">Analytics & Insights</h1>
              <p className="mt-2 text-purple-100">
                Comprehensive analytics and reporting for fiscal year {currentFiscalYear}
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-2">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as 'month' | 'quarter' | 'year')}
                className="px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <option value="month" className="text-gray-900">This Month</option>
                <option value="quarter" className="text-gray-900">This Quarter</option>
                <option value="year" className="text-gray-900">This Year</option>
              </select>
              <PermissionGuard permission="analytics:export" fallback={null}>
                <button
                  onClick={() => setShowExportModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-lg text-purple-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200 transform hover:scale-105"
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  Export Report
                </button>
              </PermissionGuard>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-shadow duration-200">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {getMetricIcon(metric)}
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{metric.title}</dt>
                    <dd className="text-lg font-bold text-gray-900">{metric.value}</dd>
                  </dl>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                {getChangeIndicator(metric)}
                <span className="text-xs text-gray-500">vs last period</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Equity Trend Chart */}
        <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Equity Distribution Trend</h3>
            <ChartBarIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Interactive equity trend chart</p>
              <p className="text-xs text-gray-400">Chart.js or D3.js integration</p>
            </div>
          </div>
        </div>

        {/* Distribution Types Chart */}
        <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Distributions by Type</h3>
            <ChartPieIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <ChartPieIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Distribution breakdown pie chart</p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                  <span>Quarterly: $125K</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                  <span>Annual: $85K</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
                  <span>Special: $25K</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
                  <span>Tax: $15K</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Member Growth Analysis */}
        <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Member Growth</h3>
            <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">New Members (YTD)</span>
              <span className="text-sm font-medium text-gray-900">4</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Retention Rate</span>
              <span className="text-sm font-medium text-green-600">95.5%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg. Equity per Member</span>
              <span className="text-sm font-medium text-gray-900">4.54%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Growth Rate (YoY)</span>
              <span className="text-sm font-medium text-green-600">+22.2%</span>
            </div>
          </div>
        </div>

        {/* Financial Performance */}
        <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Financial Performance</h3>
            <CurrencyDollarIcon className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Assets</span>
              <span className="text-sm font-medium text-gray-900">$12.5M</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">ROE (YTD)</span>
              <span className="text-sm font-medium text-green-600">18.3%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Distribution Ratio</span>
              <span className="text-sm font-medium text-gray-900">35.2%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Cash Flow</span>
              <span className="text-sm font-medium text-green-600">$2.1M</span>
            </div>
          </div>
        </div>

        {/* Compliance & Risk */}
        <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Compliance & Risk</h3>
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tax Compliance</span>
              <span className="text-sm font-medium text-green-600">100%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">K-1 Filed</span>
              <span className="text-sm font-medium text-green-600">22/22</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Audit Status</span>
              <span className="text-sm font-medium text-yellow-600">In Progress</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Risk Score</span>
              <span className="text-sm font-medium text-green-600">Low</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity & Insights */}
      <div className="mt-8 bg-white shadow-lg rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Key Insights & Recommendations</h3>
          <ClockIcon className="h-5 w-5 text-gray-400" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Equity Optimization</h4>
            <p className="text-sm text-blue-700">
              Current equity distribution is well-balanced. Consider reviewing allocations for new hires in Q4.
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="text-sm font-medium text-green-900 mb-2">Distribution Efficiency</h4>
            <p className="text-sm text-green-700">
              Distribution processing time has improved by 25%. Automated workflows are performing well.
            </p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h4 className="text-sm font-medium text-yellow-900 mb-2">Tax Planning</h4>
            <p className="text-sm text-yellow-700">
              Q4 tax payments are on track. Consider estimated payment adjustments for high-income members.
            </p>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Export Analytics Report</h3>
            <p className="text-sm text-gray-500 mb-6">Choose your preferred export format:</p>
            
            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleExportReport('pdf')}
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-center">
                  <DocumentArrowDownIcon className="h-5 w-5 text-red-500 mr-3" />
                  <span className="text-sm font-medium text-gray-900">PDF Report</span>
                </div>
                <span className="text-xs text-gray-500">Formatted for printing</span>
              </button>
              
              <button
                onClick={() => handleExportReport('excel')}
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-center">
                  <DocumentArrowDownIcon className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-sm font-medium text-gray-900">Excel Workbook</span>
                </div>
                <span className="text-xs text-gray-500">Detailed data analysis</span>
              </button>
              
              <button
                onClick={() => handleExportReport('csv')}
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-center">
                  <DocumentArrowDownIcon className="h-5 w-5 text-blue-500 mr-3" />
                  <span className="text-sm font-medium text-gray-900">CSV Data</span>
                </div>
                <span className="text-xs text-gray-500">Raw data export</span>
              </button>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}