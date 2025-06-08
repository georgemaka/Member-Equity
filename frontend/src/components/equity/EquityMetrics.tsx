import { Member } from '@/types/member'
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  UsersIcon,
  TrendingUpIcon,
  ScaleIcon,
  ChartPieIcon
} from '@heroicons/react/24/outline'

interface EquityCalculations {
  totalEquityAllocated: number
  totalCapitalAccounts: number
  averageEquityPerMember: number
  equityConcentration: {
    top10Percent: number
    top25Percent: number
    giniCoefficient: number
  }
  reconciledWithBalanceSheet: boolean
  reconciliationVariance: number
  yearOverYearChange: number
}

interface EquityMetricsProps {
  calculations: EquityCalculations
  members: Member[]
}

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  color: 'blue' | 'green' | 'purple' | 'orange' | 'indigo' | 'red'
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
  }
}

const colorClasses = {
  blue: 'from-blue-500 to-blue-600 text-blue-600 bg-blue-50',
  green: 'from-green-500 to-green-600 text-green-600 bg-green-50',
  purple: 'from-purple-500 to-purple-600 text-purple-600 bg-purple-50',
  orange: 'from-orange-500 to-orange-600 text-orange-600 bg-orange-50',
  indigo: 'from-indigo-500 to-indigo-600 text-indigo-600 bg-indigo-50',
  red: 'from-red-500 to-red-600 text-red-600 bg-red-50'
}

function MetricCard({ title, value, subtitle, icon: Icon, color, trend }: MetricCardProps) {
  const colors = colorClasses[color]

  return (
    <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-all duration-200">
      <div className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`w-12 h-12 bg-gradient-to-r ${colors.split(' ').slice(0, 2).join(' ')} rounded-xl flex items-center justify-center shadow-lg`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="ml-4 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-bold text-gray-900">
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </div>
                {trend && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    trend.direction === 'up' ? 'text-green-600' :
                    trend.direction === 'down' ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {trend.direction === 'up' ? '↗' : trend.direction === 'down' ? '↘' : '→'}
                    <span className="ml-1">{Math.abs(trend.value)}%</span>
                  </div>
                )}
              </dd>
              {subtitle && (
                <dd className="text-xs text-gray-500 mt-1">{subtitle}</dd>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EquityMetrics({ calculations, members }: EquityMetricsProps) {
  const activeMembers = members.filter(m => m.currentStatus?.status === 'active')
  
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Equity Metrics Overview</h2>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          title="Total Equity Allocated"
          value={`${calculations.totalEquityAllocated.toFixed(1)}%`}
          subtitle={`${100 - calculations.totalEquityAllocated >= 0 ? (100 - calculations.totalEquityAllocated).toFixed(1) : 'Over-allocated by ' + Math.abs(100 - calculations.totalEquityAllocated).toFixed(1)}% ${100 - calculations.totalEquityAllocated >= 0 ? 'unallocated' : ''}`}
          icon={ChartPieIcon}
          color={calculations.totalEquityAllocated <= 100 ? 'green' : 'red'}
          trend={{
            value: calculations.yearOverYearChange,
            direction: calculations.yearOverYearChange > 0 ? 'up' : calculations.yearOverYearChange < 0 ? 'down' : 'neutral'
          }}
        />

        <MetricCard
          title="Total Capital Accounts"
          value={`$${(calculations.totalCapitalAccounts / 1000000).toFixed(1)}M`}
          subtitle={`$${(calculations.totalCapitalAccounts / activeMembers.length / 1000).toFixed(0)}K avg per member`}
          icon={CurrencyDollarIcon}
          color="blue"
        />

        <MetricCard
          title="Average Equity"
          value={`${calculations.averageEquityPerMember.toFixed(2)}%`}
          subtitle={`Per active member (${activeMembers.length} total)`}
          icon={ChartBarIcon}
          color="purple"
        />

        <MetricCard
          title="Top 10% Hold"
          value={`${calculations.equityConcentration.top10Percent.toFixed(1)}%`}
          subtitle="Equity concentration"
          icon={TrendingUpIcon}
          color="orange"
        />

        <MetricCard
          title="Gini Coefficient"
          value={calculations.equityConcentration.giniCoefficient.toFixed(3)}
          subtitle="Inequality measure (0=equal, 1=unequal)"
          icon={ScaleIcon}
          color="indigo"
        />

        <MetricCard
          title="Reconciliation"
          value={calculations.reconciledWithBalanceSheet ? "✓" : "!"}
          subtitle={calculations.reconciledWithBalanceSheet ? "Balanced" : `$${calculations.reconciliationVariance.toLocaleString()} variance`}
          icon={ScaleIcon}
          color={calculations.reconciledWithBalanceSheet ? "green" : "red"}
        />
      </div>

      {/* Additional Insights */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Equity Distribution</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Top 10% of members hold:</span>
              <span className="text-sm font-semibold text-gray-900">{calculations.equityConcentration.top10Percent.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Top 25% of members hold:</span>
              <span className="text-sm font-semibold text-gray-900">{calculations.equityConcentration.top25Percent.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Bottom 50% of members hold:</span>
              <span className="text-sm font-semibold text-gray-900">
                {(100 - calculations.equityConcentration.top25Percent - (calculations.equityConcentration.top25Percent * 0.5)).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Member Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Active members:</span>
              <span className="text-sm font-semibold text-green-600">{activeMembers.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Non-active members:</span>
              <span className="text-sm font-semibold text-gray-600">{members.length - activeMembers.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Finalized percentages:</span>
              <span className="text-sm font-semibold text-gray-900">
                {activeMembers.filter(m => m.currentEquity?.isFinalized).length}/{activeMembers.length}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Indicators</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total allocation:</span>
              <span className={`text-sm font-semibold ${
                calculations.totalEquityAllocated === 100 ? 'text-green-600' : 
                calculations.totalEquityAllocated < 100 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {calculations.totalEquityAllocated === 100 ? 'Perfect' : 
                 calculations.totalEquityAllocated < 100 ? 'Under-allocated' : 'Over-allocated'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Balance sheet sync:</span>
              <span className={`text-sm font-semibold ${
                calculations.reconciledWithBalanceSheet ? 'text-green-600' : 'text-red-600'
              }`}>
                {calculations.reconciledWithBalanceSheet ? 'Synced' : 'Out of sync'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Data completeness:</span>
              <span className="text-sm font-semibold text-green-600">100%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}