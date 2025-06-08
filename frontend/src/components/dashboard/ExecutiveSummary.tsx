import { ExecutiveSummary, YearOverYearComparison } from '@/types/dashboard'
import {
  UsersIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  UserMinusIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'

interface ExecutiveSummaryProps {
  summary: ExecutiveSummary
  comparison?: YearOverYearComparison
  loading?: boolean
}

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  change?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
    label: string
  }
  color: 'blue' | 'green' | 'purple' | 'orange' | 'indigo' | 'red'
}

const colorClasses = {
  blue: {
    bg: 'from-blue-500 to-blue-600',
    text: 'text-blue-600',
    lightBg: 'bg-blue-50',
    ring: 'ring-blue-500'
  },
  green: {
    bg: 'from-green-500 to-green-600',
    text: 'text-green-600',
    lightBg: 'bg-green-50',
    ring: 'ring-green-500'
  },
  purple: {
    bg: 'from-purple-500 to-purple-600',
    text: 'text-purple-600',
    lightBg: 'bg-purple-50',
    ring: 'ring-purple-500'
  },
  orange: {
    bg: 'from-orange-500 to-orange-600',
    text: 'text-orange-600',
    lightBg: 'bg-orange-50',
    ring: 'ring-orange-500'
  },
  indigo: {
    bg: 'from-indigo-500 to-indigo-600',
    text: 'text-indigo-600',
    lightBg: 'bg-indigo-50',
    ring: 'ring-indigo-500'
  },
  red: {
    bg: 'from-red-500 to-red-600',
    text: 'text-red-600',
    lightBg: 'bg-red-50',
    ring: 'ring-red-500'
  }
}

function StatCard({ title, value, subtitle, icon: Icon, change, color }: StatCardProps) {
  const colors = colorClasses[color]

  return (
    <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-all duration-200 transform hover:scale-105">
      <div className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`w-12 h-12 bg-gradient-to-r ${colors.bg} rounded-xl flex items-center justify-center shadow-lg`}>
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
                {change && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    change.direction === 'up' ? 'text-green-600' :
                    change.direction === 'down' ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {change.direction === 'up' && <ArrowUpIcon className="self-center flex-shrink-0 h-4 w-4" />}
                    {change.direction === 'down' && <ArrowDownIcon className="self-center flex-shrink-0 h-4 w-4" />}
                    <span className="sr-only">
                      {change.direction === 'up' ? 'Increased' : change.direction === 'down' ? 'Decreased' : 'No change'}
                    </span>
                    {Math.abs(change.value)}%
                  </div>
                )}
              </dd>
              {subtitle && (
                <dd className="text-xs text-gray-500 mt-1">{subtitle}</dd>
              )}
              {change && (
                <dd className="text-xs text-gray-500 mt-1">{change.label}</dd>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white shadow-lg rounded-xl border border-gray-100 p-6">
          <div className="animate-pulse">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
              <div className="ml-4 flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ExecutiveSummaryComponent({ summary, comparison, loading }: ExecutiveSummaryProps) {
  if (loading) {
    return <LoadingSkeleton />
  }

  const getChangeData = (current: number, previous?: number) => {
    if (!previous || previous === 0) return undefined
    
    const change = ((current - previous) / previous) * 100
    return {
      value: Math.abs(change),
      direction: change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'neutral' as const,
      label: `vs. FY ${summary.fiscalYear - 1}`
    }
  }

  const activeMembersChange = getChangeData(summary.activeMembers, comparison?.previousYear?.activeMembers)
  const retiredMembersChange = getChangeData(summary.retiredMembers, comparison?.previousYear?.retiredMembers)
  const distributionsChange = getChangeData(summary.totalDistributions, comparison?.previousYear?.totalDistributions)
  const taxDistributionsChange = getChangeData(summary.taxDistributions, comparison?.previousYear?.taxDistributions)
  const equityChange = getChangeData(summary.totalEquityPercentage, comparison?.previousYear?.totalEquityPercentage)

  return (
    <div className="space-y-6">
      {/* Primary KPIs - The 5 requested metrics */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Key Performance Indicators - FY {summary.fiscalYear}</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Active Members"
            value={summary.activeMembers}
            subtitle={`${summary.totalMembers} total members`}
            icon={UsersIcon}
            change={activeMembersChange}
            color="blue"
          />
          
          <StatCard
            title="Retired Members"
            value={summary.retiredMembers}
            subtitle={`${((summary.retiredMembers / summary.totalMembers) * 100).toFixed(1)}% of total`}
            icon={UserMinusIcon}
            change={retiredMembersChange}
            color="purple"
          />
          
          <StatCard
            title="Total Distributions"
            value={`$${(summary.totalDistributions / 1000).toFixed(0)}K`}
            subtitle={`$${(summary.totalDistributions / summary.activeMembers / 1000).toFixed(0)}K avg per active member`}
            icon={BanknotesIcon}
            change={distributionsChange}
            color="green"
          />
          
          <StatCard
            title="Tax Distributions"
            value={`$${(summary.taxDistributions / 1000).toFixed(0)}K`}
            subtitle={`${((summary.taxDistributions / summary.totalDistributions) * 100).toFixed(1)}% of total distributions`}
            icon={CurrencyDollarIcon}
            change={taxDistributionsChange}
            color="orange"
          />
          
          <StatCard
            title="Total Equity"
            value={`${summary.totalEquityPercentage.toFixed(1)}%`}
            subtitle={`Avg: ${summary.averageEquityPerMember.toFixed(2)}% per member`}
            icon={ChartBarIcon}
            change={equityChange}
            color="indigo"
          />
        </div>
      </div>

      {/* Year-over-Year Summary */}
      {comparison && (
        <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Year-over-Year Changes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {comparison.changes.memberGrowth > 0 ? '+' : ''}{comparison.changes.memberGrowth}
              </div>
              <div className="text-sm text-gray-500">Member Growth</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {comparison.changes.capitalGrowth > 0 ? '+' : ''}${(comparison.changes.capitalGrowth / 1000).toFixed(0)}K
              </div>
              <div className="text-sm text-gray-500">Capital Growth</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {comparison.changes.equityConcentrationChange > 0 ? '+' : ''}{comparison.changes.equityConcentrationChange.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">Equity Concentration</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {comparison.changes.retentionRateChange > 0 ? '+' : ''}{comparison.changes.retentionRateChange.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">Retention Rate</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}