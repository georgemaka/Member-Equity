import { useState, useMemo } from 'react'
import { Member } from '@/types/member'
import { memberApi } from '@/services/memberApi'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/react/24/solid'

interface YearOverYearComparisonProps {
  currentYear: number
  compareYear: number
}

export default function YearOverYearComparison({ 
  currentYear, 
  compareYear 
}: YearOverYearComparisonProps) {
  // Fetch data for both years
  const { data: currentYearData } = useQuery({
    queryKey: ['members', currentYear],
    queryFn: () => memberApi.getMembersForYear(currentYear),
  })
  
  const { data: compareYearData } = useQuery({
    queryKey: ['members', compareYear],
    queryFn: () => memberApi.getMembersForYear(compareYear),
  })

  const comparison = useMemo(() => {
    if (!currentYearData?.data || !compareYearData?.data) return []
    
    const currentMembers = currentYearData.data
    const compareMembers = compareYearData.data
    
    // Create a map for easy lookup
    const compareMemberMap = new Map(
      compareMembers.map(m => [m.id, m])
    )
    
    // Compare members
    const results = currentMembers.map(currentMember => {
      const compareMember = compareMemberMap.get(currentMember.id)
      const currentEquity = parseFloat(currentMember.equityPercentage || '0')
      const compareEquity = compareMember ? parseFloat(compareMember.equityPercentage || '0') : 0
      const change = currentEquity - compareEquity
      
      return {
        member: currentMember,
        currentEquity,
        compareEquity,
        change,
        changePercent: compareEquity > 0 ? (change / compareEquity) * 100 : 0,
        isNew: !compareMember,
        status: {
          current: currentMember.currentStatus?.status || 'unknown',
          compare: compareMember?.currentStatus?.status || 'unknown'
        }
      }
    })
    
    // Find members who left
    const leftMembers = compareMembers
      .filter(m => !currentMembers.find(cm => cm.id === m.id))
      .map(m => ({
        member: m,
        currentEquity: 0,
        compareEquity: parseFloat(m.equityPercentage || '0'),
        change: -parseFloat(m.equityPercentage || '0'),
        changePercent: -100,
        isNew: false,
        isRemoved: true,
        status: {
          current: 'removed',
          compare: m.currentStatus?.status || 'unknown'
        }
      }))
    
    return [...results, ...leftMembers].sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
  }, [currentYearData, compareYearData])

  if (!currentYearData || !compareYearData) {
    return <div>Loading comparison data...</div>
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Year-over-Year Comparison: {compareYear} → {currentYear}
      </h3>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">Total Members</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{currentYearData.data.length}</span>
            <span className={`text-sm ${
              currentYearData.data.length > compareYearData.data.length ? 'text-green-600' : 'text-red-600'
            }`}>
              {currentYearData.data.length > compareYearData.data.length ? '+' : ''}
              {currentYearData.data.length - compareYearData.data.length}
            </span>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">New Members</p>
          <p className="text-2xl font-bold text-green-600">
            {comparison.filter(c => c.isNew).length}
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">Members Left</p>
          <p className="text-2xl font-bold text-red-600">
            {comparison.filter(c => c.isRemoved).length}
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">Equity Changes</p>
          <p className="text-2xl font-bold text-blue-600">
            {comparison.filter(c => Math.abs(c.change) > 0.001).length}
          </p>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Member
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {compareYear} Equity
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {currentYear} Equity
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Change
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {comparison.map((item, index) => (
              <tr key={item.member.id} className={item.isRemoved ? 'bg-red-50' : item.isNew ? 'bg-green-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {item.member.firstName} {item.member.lastName}
                  </div>
                  <div className="text-sm text-gray-500">{item.member.jobTitle}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    {item.isNew && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">New</span>
                    )}
                    {item.isRemoved && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Left</span>
                    )}
                    {!item.isNew && !item.isRemoved && item.status.current !== item.status.compare && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        {item.status.compare} → {item.status.current}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                  {item.compareEquity.toFixed(3)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                  {item.currentEquity.toFixed(3)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end">
                    {item.change > 0.001 && (
                      <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
                    )}
                    {item.change < -0.001 && (
                      <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    {Math.abs(item.change) <= 0.001 && (
                      <MinusIcon className="h-4 w-4 text-gray-400 mr-1" />
                    )}
                    <span className={`text-sm font-medium ${
                      item.change > 0.001 ? 'text-green-600' : 
                      item.change < -0.001 ? 'text-red-600' : 
                      'text-gray-500'
                    }`}>
                      {item.change > 0 ? '+' : ''}{item.change.toFixed(3)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}