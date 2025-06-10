import { useState, useEffect } from 'react'
import { Member } from '@/types/member'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import {
  XMarkIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  PlusIcon,
  DocumentCheckIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'

interface DistributionDetailModalProps {
  isOpen: boolean
  onClose: () => void
  member: Member | null
  allMembers?: Member[]
  onMemberChange?: (member: Member) => void
}

interface DistributionRecord {
  id: string
  date: string
  quarter: string
  type: 'regular' | 'special' | 'year-end'
  grossAmount: number
  taxWithholding: number
  netAmount: number
  equityPercentage: number
  method: string
  status: 'processed' | 'pending' | 'cancelled'
  description: string
  checkNumber?: string
}

export default function DistributionDetailModal({ 
  isOpen, 
  onClose, 
  member,
  allMembers = [],
  onMemberChange
}: DistributionDetailModalProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  
  useEscapeKey(onClose, isOpen)

  // Mock distribution data
  const generateDistributions = (memberId: string): DistributionRecord[] => {
    const hash = memberId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    
    const baseAmount = Math.abs(hash % 40000) + 15000
    const equityPercentage = (Math.abs(hash % 500) / 100) + 0.5 // 0.5% to 5.5%
    
    return [
      {
        id: `${memberId}-${selectedYear}-q1`,
        date: `${selectedYear}-03-31`,
        quarter: 'Q1',
        type: 'regular' as const,
        grossAmount: baseAmount * 0.8,
        taxWithholding: baseAmount * 0.8 * 0.25,
        netAmount: baseAmount * 0.8 * 0.75,
        equityPercentage,
        method: 'ACH Transfer',
        status: 'processed' as const,
        description: 'Q1 Regular Distribution',
        checkNumber: undefined
      },
      {
        id: `${memberId}-${selectedYear}-q2`,
        date: `${selectedYear}-06-30`,
        quarter: 'Q2',
        type: 'regular' as const,
        grossAmount: baseAmount * 0.9,
        taxWithholding: baseAmount * 0.9 * 0.25,
        netAmount: baseAmount * 0.9 * 0.75,
        equityPercentage,
        method: 'Check',
        status: 'processed' as const,
        description: 'Q2 Regular Distribution',
        checkNumber: `CHK-${Math.abs(hash % 9999) + 1000}`
      },
      {
        id: `${memberId}-${selectedYear}-special`,
        date: `${selectedYear}-08-15`,
        quarter: 'Q3',
        type: 'special' as const,
        grossAmount: baseAmount * 0.3,
        taxWithholding: baseAmount * 0.3 * 0.25,
        netAmount: baseAmount * 0.3 * 0.75,
        equityPercentage,
        method: 'ACH Transfer',
        status: 'processed' as const,
        description: 'Special Project Bonus Distribution'
      },
      {
        id: `${memberId}-${selectedYear}-q3`,
        date: `${selectedYear}-09-30`,
        quarter: 'Q3',
        type: 'regular' as const,
        grossAmount: baseAmount * 1.1,
        taxWithholding: baseAmount * 1.1 * 0.25,
        netAmount: baseAmount * 1.1 * 0.75,
        equityPercentage,
        method: 'ACH Transfer',
        status: 'pending' as const,
        description: 'Q3 Regular Distribution'
      },
      {
        id: `${memberId}-${selectedYear}-yearend`,
        date: `${selectedYear}-12-31`,
        quarter: 'Q4',
        type: 'year-end' as const,
        grossAmount: baseAmount * 1.5,
        taxWithholding: baseAmount * 1.5 * 0.28,
        netAmount: baseAmount * 1.5 * 0.72,
        equityPercentage,
        method: 'Check',
        status: 'pending' as const,
        description: 'Year-End Profit Distribution'
      }
    ]
  }

  const distributions = member ? generateDistributions(member.id) : []
  
  const totals = distributions.reduce((acc, dist) => ({
    gross: acc.gross + dist.grossAmount,
    tax: acc.tax + dist.taxWithholding,
    net: acc.net + dist.netAmount
  }), { gross: 0, tax: 0, net: 0 })

  const processedDistributions = distributions.filter(d => d.status === 'processed')
  const pendingDistributions = distributions.filter(d => d.status === 'pending')

  const handlePreviousMember = () => {
    if (!member || !allMembers.length || !onMemberChange) return
    const currentIndex = allMembers.findIndex(m => m.id === member.id)
    const previousIndex = currentIndex > 0 ? currentIndex - 1 : allMembers.length - 1
    onMemberChange(allMembers[previousIndex])
  }

  const handleNextMember = () => {
    if (!member || !allMembers.length || !onMemberChange) return
    const currentIndex = allMembers.findIndex(m => m.id === member.id)
    const nextIndex = currentIndex < allMembers.length - 1 ? currentIndex + 1 : 0
    onMemberChange(allMembers[nextIndex])
  }

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePreviousMember()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleNextMember()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, member, allMembers])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'regular': return 'bg-blue-100 text-blue-800'
      case 'special': return 'bg-purple-100 text-purple-800'
      case 'year-end': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
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

  if (!isOpen || !member) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <ArrowTrendingUpIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Distributions - {member.firstName} {member.lastName}
                  </h3>
                  <p className="text-green-100 text-sm">
                    {member.jobTitle} • {member.currentEquity?.finalPercentage?.toFixed(3)}% Equity • {selectedYear}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Member Navigation */}
                {allMembers.length > 1 && (
                  <>
                    <button
                      onClick={handlePreviousMember}
                      className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                      title="Previous member (←)"
                    >
                      <ArrowLeftIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleNextMember}
                      className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                      title="Next member (→)"
                    >
                      <ArrowRightIcon className="h-5 w-5" />
                    </button>
                  </>
                )}
                
                <button
                  onClick={onClose}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Year Selector & Summary Cards */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  {[2024, 2025, 2026].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                
                <div className="flex space-x-2">
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
                    <PlusIcon className="h-4 w-4" />
                    <span>Request Distribution</span>
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2">
                    <ChartBarIcon className="h-4 w-4" />
                    <span>View Analytics</span>
                  </button>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-sm font-medium text-blue-600">Total Gross</div>
                  <div className="text-2xl font-bold text-blue-900">{formatCurrency(totals.gross)}</div>
                  <div className="text-xs text-blue-600">{distributions.length} distributions</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="text-sm font-medium text-red-600">Tax Withholding</div>
                  <div className="text-2xl font-bold text-red-900">{formatCurrency(totals.tax)}</div>
                  <div className="text-xs text-red-600">{((totals.tax / totals.gross) * 100).toFixed(1)}% rate</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-sm font-medium text-green-600">Total Net</div>
                  <div className="text-2xl font-bold text-green-900">{formatCurrency(totals.net)}</div>
                  <div className="text-xs text-green-600">After taxes</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="text-sm font-medium text-purple-600">Next Distribution</div>
                  <div className="text-lg font-bold text-purple-900">
                    {pendingDistributions.length > 0 ? 
                      formatCurrency(pendingDistributions[0].netAmount) : 
                      'None scheduled'
                    }
                  </div>
                  <div className="text-xs text-purple-600">
                    {pendingDistributions.length > 0 && 
                      new Date(pendingDistributions[0].date).toLocaleDateString()
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Distributions Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900">Distribution History</h4>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gross Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tax Withholding
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Net Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {distributions.map((distribution) => (
                      <tr key={distribution.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <CalendarDaysIcon className="h-5 w-5 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900">
                              {new Date(distribution.date).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(distribution.type)}`}>
                            {distribution.type.charAt(0).toUpperCase() + distribution.type.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {distribution.description}
                          {distribution.checkNumber && (
                            <div className="text-xs text-gray-500">Check: {distribution.checkNumber}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(distribution.grossAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                          -{formatCurrency(distribution.taxWithholding)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                          {formatCurrency(distribution.netAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <BanknotesIcon className="h-4 w-4 text-gray-400 mr-1" />
                            {distribution.method}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(distribution.status)}`}>
                            {distribution.status.charAt(0).toUpperCase() + distribution.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <DocumentCheckIcon className="h-8 w-8 text-blue-600" />
                  <div>
                    <div className="text-sm font-medium text-blue-600">Processed Distributions</div>
                    <div className="text-xl font-bold text-blue-900">{processedDistributions.length}</div>
                    <div className="text-xs text-blue-600">
                      {formatCurrency(processedDistributions.reduce((sum, d) => sum + d.netAmount, 0))} total
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CurrencyDollarIcon className="h-8 w-8 text-yellow-600" />
                  <div>
                    <div className="text-sm font-medium text-yellow-600">Pending Distributions</div>
                    <div className="text-xl font-bold text-yellow-900">{pendingDistributions.length}</div>
                    <div className="text-xs text-yellow-600">
                      {formatCurrency(pendingDistributions.reduce((sum, d) => sum + d.netAmount, 0))} scheduled
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <ArrowTrendingUpIcon className="h-8 w-8 text-green-600" />
                  <div>
                    <div className="text-sm font-medium text-green-600">Avg. Distribution</div>
                    <div className="text-xl font-bold text-green-900">
                      {distributions.length > 0 ? formatCurrency(totals.net / distributions.length) : '$0'}
                    </div>
                    <div className="text-xs text-green-600">Per distribution</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}