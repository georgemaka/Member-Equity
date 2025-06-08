import { Member } from '@/types/member'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { useState } from 'react'
import { ChartPieIcon, ChartBarIcon } from '@heroicons/react/24/outline'

interface EquityDistributionChartProps {
  members: Member[]
}

interface EquityDataPoint {
  name: string
  value: number
  color: string
  members?: number
}

const COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
]

export default function EquityDistributionChart({ members }: EquityDistributionChartProps) {
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie')

  // Filter active members and prepare data
  const activeMembers = members.filter(m => m.currentStatus?.status === 'active')
  
  // Group members by equity ranges
  const equityRanges = [
    { min: 0, max: 1, label: '< 1%', color: COLORS[0] },
    { min: 1, max: 2.5, label: '1-2.5%', color: COLORS[1] },
    { min: 2.5, max: 5, label: '2.5-5%', color: COLORS[2] },
    { min: 5, max: 10, label: '5-10%', color: COLORS[3] },
    { min: 10, max: 100, label: '> 10%', color: COLORS[4] }
  ]

  const rangeData = equityRanges.map(range => {
    const membersInRange = activeMembers.filter(m => {
      const equity = m.currentEquity?.finalPercentage || m.currentEquity?.estimatedPercentage || 0
      return equity >= range.min && equity < range.max
    })
    
    const totalEquity = membersInRange.reduce((sum, m) => 
      sum + (m.currentEquity?.finalPercentage || m.currentEquity?.estimatedPercentage || 0), 0
    )

    return {
      name: range.label,
      value: totalEquity,
      color: range.color,
      members: membersInRange.length
    }
  }).filter(range => range.value > 0) // Only show ranges with members

  // Individual member data for detailed view
  const individualData = activeMembers
    .map(m => ({
      name: `${m.firstName} ${m.lastName}`,
      value: m.currentEquity?.finalPercentage || m.currentEquity?.estimatedPercentage || 0,
      jobTitle: m.jobTitle
    }))
    .filter(m => m.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 15) // Top 15 members

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{`${data.name}`}</p>
          <p className="text-sm text-gray-600">{`Equity: ${data.value.toFixed(2)}%`}</p>
          {data.members !== undefined && (
            <p className="text-sm text-gray-600">{`Members: ${data.members}`}</p>
          )}
          {data.jobTitle && (
            <p className="text-sm text-gray-500">{data.jobTitle}</p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Equity Distribution</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setChartType('pie')}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              chartType === 'pie' 
                ? 'bg-indigo-100 text-indigo-600' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ChartPieIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              chartType === 'bar' 
                ? 'bg-indigo-100 text-indigo-600' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ChartBarIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'pie' ? (
            <PieChart>
              <Pie
                data={rangeData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                labelLine={false}
              >
                {rangeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          ) : (
            <BarChart data={individualData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={100}
                fontSize={12}
              />
              <YAxis 
                label={{ value: 'Equity %', angle: -90, position: 'insideLeft' }}
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Summary Statistics */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {activeMembers.length}
            </div>
            <div className="text-sm text-gray-500">Active Members</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {rangeData.reduce((sum, range) => sum + range.value, 0).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">Total Allocated</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {individualData.length > 0 ? individualData[0].value.toFixed(2) : 0}%
            </div>
            <div className="text-sm text-gray-500">Highest Individual</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {(rangeData.reduce((sum, range) => sum + range.value, 0) / activeMembers.length).toFixed(2)}%
            </div>
            <div className="text-sm text-gray-500">Average per Member</div>
          </div>
        </div>
      </div>

      {chartType === 'pie' && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Range Breakdown</h4>
          <div className="space-y-2">
            {rangeData.map((range, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: range.color }}
                  />
                  <span className="text-gray-700">{range.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-gray-900">{range.value.toFixed(1)}%</span>
                  <span className="text-gray-500 ml-2">({range.members} members)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}