import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { ArrowTrendingUpIcon, CalendarDaysIcon } from '@heroicons/react/24/outline'

interface EquityTrendChartProps {
  currentYear: number
  comparisonYear: number
  onComparisonYearChange: (year: number) => void
  expanded?: boolean
}

interface TrendDataPoint {
  fiscalYear: number
  totalEquityAllocated: number
  averageEquityPerMember: number
  memberCount: number
  totalCapitalAccounts: number
  giniCoefficient: number
}

export default function EquityTrendChart({ 
  currentYear, 
  comparisonYear, 
  onComparisonYearChange, 
  expanded = false 
}: EquityTrendChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<'equity' | 'capital' | 'members' | 'concentration'>('equity')
  const [chartType, setChartType] = useState<'line' | 'area'>('line')

  // Mock historical data
  const trendData: TrendDataPoint[] = [
    {
      fiscalYear: 2021,
      totalEquityAllocated: 98.5,
      averageEquityPerMember: 2.18,
      memberCount: 45,
      totalCapitalAccounts: 11200000,
      giniCoefficient: 0.42
    },
    {
      fiscalYear: 2022,
      totalEquityAllocated: 99.2,
      averageEquityPerMember: 2.15,
      memberCount: 46,
      totalCapitalAccounts: 11850000,
      giniCoefficient: 0.44
    },
    {
      fiscalYear: 2023,
      totalEquityAllocated: 99.8,
      averageEquityPerMember: 2.12,
      memberCount: 47,
      totalCapitalAccounts: 12100000,
      giniCoefficient: 0.43
    },
    {
      fiscalYear: 2024,
      totalEquityAllocated: 100.0,
      averageEquityPerMember: 2.08,
      memberCount: 48,
      totalCapitalAccounts: 12350000,
      giniCoefficient: 0.45
    },
    {
      fiscalYear: 2025,
      totalEquityAllocated: 99.7,
      averageEquityPerMember: 2.04,
      memberCount: 49,
      totalCapitalAccounts: 12750000,
      giniCoefficient: 0.46
    }
  ]

  const metrics = {
    equity: {
      label: 'Total Equity Allocated (%)',
      dataKey: 'totalEquityAllocated',
      color: '#3B82F6',
      format: (value: number) => `${value.toFixed(1)}%`
    },
    capital: {
      label: 'Total Capital Accounts ($M)',
      dataKey: 'totalCapitalAccounts',
      color: '#10B981',
      format: (value: number) => `$${(value / 1000000).toFixed(1)}M`
    },
    members: {
      label: 'Member Count',
      dataKey: 'memberCount',
      color: '#F59E0B',
      format: (value: number) => value.toString()
    },
    concentration: {
      label: 'Inequality (Gini)',
      dataKey: 'giniCoefficient',
      color: '#8B5CF6',
      format: (value: number) => value.toFixed(3)
    }
  }

  const currentMetric = metrics[selectedMetric]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{`FY ${label}`}</p>
          <p className="text-sm" style={{ color: currentMetric.color }}>
            {`${currentMetric.label}: ${currentMetric.format(data[currentMetric.dataKey])}`}
          </p>
          <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
            <p className="text-xs text-gray-600">Total Equity: {data.totalEquityAllocated.toFixed(1)}%</p>
            <p className="text-xs text-gray-600">Members: {data.memberCount}</p>
            <p className="text-xs text-gray-600">Capital: ${(data.totalCapitalAccounts / 1000000).toFixed(1)}M</p>
          </div>
        </div>
      )
    }
    return null
  }

  const calculateTrend = (metric: keyof TrendDataPoint) => {
    const current = trendData.find(d => d.fiscalYear === currentYear)?.[metric] as number
    const previous = trendData.find(d => d.fiscalYear === currentYear - 1)?.[metric] as number
    
    if (current && previous) {
      const change = ((current - previous) / previous) * 100
      return {
        value: Math.abs(change),
        direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
      }
    }
    return null
  }

  const availableYears = trendData.map(d => d.fiscalYear)

  return (
    <div className={`bg-white p-6 rounded-xl border border-gray-100 shadow-lg ${expanded ? '' : ''}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <ArrowTrendingUpIcon className="h-6 w-6 text-indigo-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            {expanded ? 'Detailed Equity Trends' : 'Equity Trends'}
          </h3>
        </div>
        
        {expanded && (
          <div className="flex items-center space-x-4">
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="equity">Total Equity %</option>
              <option value="capital">Capital Accounts</option>
              <option value="members">Member Count</option>
              <option value="concentration">Inequality Index</option>
            </select>
            
            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setChartType('line')}
                className={`px-3 py-2 text-sm rounded-l-lg ${
                  chartType === 'line' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Line
              </button>
              <button
                onClick={() => setChartType('area')}
                className={`px-3 py-2 text-sm rounded-r-lg ${
                  chartType === 'area' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Area
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Metric Selection for Compact View */}
      {!expanded && (
        <div className="mb-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(metrics).map(([key, metric]) => {
              const trend = calculateTrend(metric.dataKey as keyof TrendDataPoint)
              return (
                <button
                  key={key}
                  onClick={() => setSelectedMetric(key as any)}
                  className={`p-3 text-left rounded-lg border transition-all duration-200 ${
                    selectedMetric === key
                      ? 'border-indigo-300 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900">{metric.label}</div>
                  <div className="text-lg font-bold" style={{ color: metric.color }}>
                    {metric.format(trendData.find(d => d.fiscalYear === currentYear)?.[metric.dataKey as keyof TrendDataPoint] as number || 0)}
                  </div>
                  {trend && (
                    <div className={`text-xs flex items-center mt-1 ${
                      trend.direction === 'up' ? 'text-green-600' : 
                      trend.direction === 'down' ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {trend.direction === 'up' ? '↗' : trend.direction === 'down' ? '↘' : '→'}
                      <span className="ml-1">{trend.value.toFixed(1)}% YoY</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Chart */}
      <div className={expanded ? "h-96" : "h-64"}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="fiscalYear" 
                tickFormatter={(value) => `FY ${value}`}
              />
              <YAxis 
                tickFormatter={currentMetric.format}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey={currentMetric.dataKey}
                stroke={currentMetric.color}
                fill={currentMetric.color}
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </AreaChart>
          ) : (
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="fiscalYear" 
                tickFormatter={(value) => `FY ${value}`}
              />
              <YAxis 
                tickFormatter={currentMetric.format}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey={currentMetric.dataKey}
                stroke={currentMetric.color}
                strokeWidth={3}
                dot={{ fill: currentMetric.color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: currentMetric.color, strokeWidth: 2 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Year-over-Year Comparison */}
      {expanded && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-semibold text-gray-900">Year-over-Year Analysis</h4>
            <div className="flex items-center space-x-2">
              <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
              <select
                value={comparisonYear}
                onChange={(e) => onComparisonYearChange(Number(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                {availableYears.filter(year => year !== currentYear).map(year => (
                  <option key={year} value={year}>FY {year}</option>
                ))}
              </select>
              <span className="text-sm text-gray-500">vs</span>
              <span className="text-sm font-medium text-gray-900">FY {currentYear}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(metrics).map(([key, metric]) => {
              const current = trendData.find(d => d.fiscalYear === currentYear)?.[metric.dataKey as keyof TrendDataPoint] as number
              const comparison = trendData.find(d => d.fiscalYear === comparisonYear)?.[metric.dataKey as keyof TrendDataPoint] as number
              const change = current && comparison ? ((current - comparison) / comparison) * 100 : 0
              
              return (
                <div key={key} className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">{metric.label}</div>
                  <div className="text-lg font-bold text-gray-900">
                    {metric.format(current || 0)}
                  </div>
                  <div className={`text-sm flex items-center ${
                    change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {change > 0 ? '↗' : change < 0 ? '↘' : '→'}
                    <span className="ml-1">{Math.abs(change).toFixed(1)}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}