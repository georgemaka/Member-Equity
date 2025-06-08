import { useMockDistributionRequests, useMockDistributionRequestSummary } from '@/hooks/useMockDistributionRequests'
import {
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CurrencyDollarIcon,
  TrendingUpIcon,
  TrendingDownIcon
} from '@heroicons/react/24/outline'

interface DistributionRequestChartProps {
  className?: string
}

export default function DistributionRequestChart({ className = '' }: DistributionRequestChartProps) {
  const { data: requests } = useMockDistributionRequests()
  const { data: summary } = useMockDistributionRequestSummary()

  if (!requests || !summary) {
    return (
      <div className={`bg-white shadow-lg rounded-xl border border-gray-100 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  // Calculate status distribution
  const statusCounts = requests.reduce((acc, request) => {
    acc[request.status] = (acc[request.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Calculate amount by month (mock data for trend)
  const monthlyData = [
    { month: 'Jan', amount: 45000, requests: 8 },
    { month: 'Feb', amount: 52000, requests: 12 },
    { month: 'Mar', amount: 48000, requests: 10 },
    { month: 'Apr', amount: 65000, requests: 15 },
    { month: 'May', amount: 58000, requests: 13 },
    { month: 'Jun', amount: 48000, requests: 11 }
  ]

  const maxAmount = Math.max(...monthlyData.map(d => d.amount))
  const maxRequests = Math.max(...monthlyData.map(d => d.requests))

  // Recent trend calculation
  const currentMonth = monthlyData[monthlyData.length - 1]
  const previousMonth = monthlyData[monthlyData.length - 2]
  const trendPercentage = ((currentMonth.amount - previousMonth.amount) / previousMonth.amount * 100)
  const isPositiveTrend = trendPercentage > 0

  return (
    <div className={`bg-white shadow-lg rounded-xl border border-gray-100 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Request Analytics</h3>
        <ChartBarIcon className="h-5 w-5 text-gray-400" />
      </div>

      {/* Status Overview */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Status Distribution</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
            <div className="flex items-center justify-between">
              <ClockIcon className="h-5 w-5 text-yellow-600" />
              <span className="text-lg font-semibold text-yellow-900">
                {statusCounts.pending_approval || 0}
              </span>
            </div>
            <p className="text-xs text-yellow-700 mt-1">Pending</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <div className="flex items-center justify-between">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              <span className="text-lg font-semibold text-green-900">
                {statusCounts.approved || 0}
              </span>
            </div>
            <p className="text-xs text-green-700 mt-1">Approved</p>
          </div>
          
          <div className="bg-red-50 rounded-lg p-3 border border-red-200">
            <div className="flex items-center justify-between">
              <XCircleIcon className="h-5 w-5 text-red-600" />
              <span className="text-lg font-semibold text-red-900">
                {statusCounts.rejected || 0}
              </span>
            </div>
            <p className="text-xs text-red-700 mt-1">Rejected</p>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="flex items-center justify-between">
              <CurrencyDollarIcon className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">
                ${(summary.totalAmount / 1000).toFixed(0)}K
              </span>
            </div>
            <p className="text-xs text-blue-700 mt-1">Total Value</p>
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700">Monthly Request Volume</h4>
          <div className="flex items-center text-xs">
            {isPositiveTrend ? (
              <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <TrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={isPositiveTrend ? 'text-green-600' : 'text-red-600'}>
              {Math.abs(trendPercentage).toFixed(1)}%
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          {monthlyData.map((data, index) => (
            <div key={data.month} className="flex items-center">
              <div className="w-8 text-xs text-gray-500">{data.month}</div>
              <div className="flex-1 mx-3">
                {/* Amount bar */}
                <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${(data.amount / maxAmount) * 100}%` }}
                  ></div>
                  {/* Request count overlay */}
                  <div
                    className="absolute inset-y-0 left-0 bg-green-400 opacity-60 rounded-full transition-all duration-300"
                    style={{ width: `${(data.requests / maxRequests) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-gray-700 w-10 text-right">{data.requests}</span>
                <span className="text-gray-500 w-12 text-right">${(data.amount / 1000).toFixed(0)}K</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex items-center justify-end space-x-4 mt-2 text-xs text-gray-500">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-400 rounded mr-1"></div>
            <span>Requests</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded mr-1"></div>
            <span>Amount</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">{summary.avgProcessingTime}h</p>
          <p className="text-xs text-gray-500">Avg Processing Time</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">{summary.upcomingPayments}</p>
          <p className="text-xs text-gray-500">Upcoming Payments</p>
        </div>
      </div>
    </div>
  )
}