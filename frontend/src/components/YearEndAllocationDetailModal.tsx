import { useState, useEffect } from 'react'
import { Member } from '@/types/member'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import {
  XMarkIcon,
  CalculatorIcon,
  ChartBarIcon,
  InformationCircleIcon,
  PlusIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  ScaleIcon
} from '@heroicons/react/24/outline'

interface YearEndAllocationDetailModalProps {
  isOpen: boolean
  onClose: () => void
  member: Member | null
  allMembers?: Member[]
  onMemberChange?: (member: Member) => void
}

interface AllocationBreakdown {
  preferredReturn: {
    rate: number
    capitalBase: number
    amount: number
    description: string
  }
  actualProfitsInterest: {
    totalProfits: number
    equityPercentage: number
    amount: number
    description: string
  }
  comparison: {
    previousYear: number
    percentChange: number
    peerAverage: number
  }
  methodology: {
    step: number
    description: string
    calculation: string
    result: number
  }[]
}

export default function YearEndAllocationDetailModal({ 
  isOpen, 
  onClose, 
  member,
  allMembers = [],
  onMemberChange
}: YearEndAllocationDetailModalProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [activeTab, setActiveTab] = useState<'breakdown' | 'methodology' | 'comparison'>('breakdown')
  
  useEscapeKey(onClose, isOpen)

  // Generate detailed allocation data
  const generateAllocationData = (memberId: string): AllocationBreakdown => {
    const hash = memberId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    
    const capitalBase = Math.abs(hash % 150000) + 50000
    const equityPercentage = (Math.abs(hash % 500) / 100) + 0.5 // 0.5% to 5.5%
    const totalCompanyProfits = 2500000 // Mock company profits
    const preferredRate = 0.08 // 8% preferred return
    
    const preferredReturn = {
      rate: preferredRate,
      capitalBase,
      amount: capitalBase * preferredRate,
      description: `${(preferredRate * 100)}% return on capital contribution of ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(capitalBase)}`
    }
    
    const actualProfitsInterest = {
      totalProfits: totalCompanyProfits,
      equityPercentage,
      amount: totalCompanyProfits * (equityPercentage / 100),
      description: `${equityPercentage.toFixed(3)}% share of company profits of ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalCompanyProfits)}`
    }
    
    const previousYearTotal = (preferredReturn.amount + actualProfitsInterest.amount) * (0.85 + Math.random() * 0.3)
    const currentTotal = preferredReturn.amount + actualProfitsInterest.amount
    
    return {
      preferredReturn,
      actualProfitsInterest,
      comparison: {
        previousYear: previousYearTotal,
        percentChange: ((currentTotal - previousYearTotal) / previousYearTotal) * 100,
        peerAverage: currentTotal * (0.9 + Math.random() * 0.2)
      },
      methodology: [
        {
          step: 1,
          description: 'Calculate Preferred Return',
          calculation: `${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(capitalBase)} × ${(preferredRate * 100)}%`,
          result: preferredReturn.amount
        },
        {
          step: 2,
          description: 'Determine Equity Percentage',
          calculation: `${equityPercentage.toFixed(3)}% equity ownership`,
          result: equityPercentage
        },
        {
          step: 3,
          description: 'Calculate Profits Interest',
          calculation: `${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalCompanyProfits)} × ${equityPercentage.toFixed(3)}%`,
          result: actualProfitsInterest.amount
        },
        {
          step: 4,
          description: 'Total Year-End Allocation',
          calculation: `Preferred Return + Profits Interest`,
          result: preferredReturn.amount + actualProfitsInterest.amount
        }
      ]
    }
  }

  const allocationData = member ? generateAllocationData(member.id) : null

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercent = (percent: number, decimals = 2) => {
    return `${percent.toFixed(decimals)}%`
  }

  if (!isOpen || !member || !allocationData) return null

  const totalAllocation = allocationData.preferredReturn.amount + allocationData.actualProfitsInterest.amount

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <CalculatorIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Year-End Allocation - {member.firstName} {member.lastName}
                  </h3>
                  <p className="text-purple-100 text-sm">
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
            {/* Year Selector & Total */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  {[2024, 2025, 2026].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                
                <div className="text-right">
                  <div className="text-sm text-gray-600">Total Year-End Allocation</div>
                  <div className="text-3xl font-bold text-purple-600">{formatCurrency(totalAllocation)}</div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <ScaleIcon className="h-8 w-8 text-blue-600" />
                    <div>
                      <div className="text-sm font-medium text-blue-600">Preferred Return</div>
                      <div className="text-2xl font-bold text-blue-900">
                        {formatCurrency(allocationData.preferredReturn.amount)}
                      </div>
                      <div className="text-xs text-blue-600">
                        {formatPercent(allocationData.preferredReturn.rate * 100)} on capital
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <ArrowTrendingUpIcon className="h-8 w-8 text-green-600" />
                    <div>
                      <div className="text-sm font-medium text-green-600">Profits Interest</div>
                      <div className="text-2xl font-bold text-green-900">
                        {formatCurrency(allocationData.actualProfitsInterest.amount)}
                      </div>
                      <div className="text-xs text-green-600">
                        {formatPercent(allocationData.actualProfitsInterest.equityPercentage, 3)} equity
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-3">
                    <ChartBarIcon className="h-8 w-8 text-purple-600" />
                    <div>
                      <div className="text-sm font-medium text-purple-600">YoY Change</div>
                      <div className={`text-2xl font-bold ${allocationData.comparison.percentChange >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                        {allocationData.comparison.percentChange >= 0 ? '+' : ''}{formatPercent(allocationData.comparison.percentChange)}
                      </div>
                      <div className="text-xs text-purple-600">vs. previous year</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  {[
                    { id: 'breakdown', label: 'Allocation Breakdown', icon: CurrencyDollarIcon },
                    { id: 'methodology', label: 'Calculation Methodology', icon: CalculatorIcon },
                    { id: 'comparison', label: 'Comparison Analysis', icon: ChartBarIcon }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-purple-500 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <tab.icon className="h-5 w-5" />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'breakdown' && (
              <div className="space-y-6">
                {/* Preferred Return Breakdown */}
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                      <ScaleIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-blue-900 mb-2">Preferred Return</h4>
                      <p className="text-blue-700 mb-4">{allocationData.preferredReturn.description}</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-blue-600">Capital Base</div>
                          <div className="text-xl font-bold text-blue-900">
                            {formatCurrency(allocationData.preferredReturn.capitalBase)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-blue-600">Return Rate</div>
                          <div className="text-xl font-bold text-blue-900">
                            {formatPercent(allocationData.preferredReturn.rate * 100)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-blue-600">Annual Return</div>
                          <div className="text-xl font-bold text-blue-900">
                            {formatCurrency(allocationData.preferredReturn.amount)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profits Interest Breakdown */}
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                      <ArrowTrendingUpIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-green-900 mb-2">Actual Profits Interest</h4>
                      <p className="text-green-700 mb-4">{allocationData.actualProfitsInterest.description}</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-green-600">Company Profits</div>
                          <div className="text-xl font-bold text-green-900">
                            {formatCurrency(allocationData.actualProfitsInterest.totalProfits)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-green-600">Equity Percentage</div>
                          <div className="text-xl font-bold text-green-900">
                            {formatPercent(allocationData.actualProfitsInterest.equityPercentage, 3)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-green-600">Profits Share</div>
                          <div className="text-xl font-bold text-green-900">
                            {formatCurrency(allocationData.actualProfitsInterest.amount)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'methodology' && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-4">
                    <InformationCircleIcon className="h-5 w-5 text-blue-600" />
                    <h4 className="text-lg font-semibold text-gray-900">Calculation Methodology</h4>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Year-end allocations are calculated using a two-tier structure: preferred returns on capital contributions 
                    followed by profit-sharing based on equity ownership percentages.
                  </p>
                </div>

                {allocationData.methodology.map((step) => (
                  <div key={step.step} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {step.step}
                      </div>
                      <div className="flex-1">
                        <h5 className="text-lg font-semibold text-gray-900 mb-2">{step.description}</h5>
                        <div className="bg-gray-50 p-3 rounded border mb-3">
                          <code className="text-sm text-gray-800">{step.calculation}</code>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">Result</div>
                          <div className="text-xl font-bold text-purple-600">
                            {typeof step.result === 'number' && step.result > 100 
                              ? formatCurrency(step.result) 
                              : step.result < 1 
                                ? formatPercent(step.result, 3)
                                : step.result.toFixed(2)
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'comparison' && (
              <div className="space-y-6">
                {/* Year-over-Year Comparison */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Year-over-Year Comparison</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Previous Year ({selectedYear - 1})</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(allocationData.comparison.previousYear)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Current Year ({selectedYear})</div>
                      <div className="text-2xl font-bold text-purple-600">
                        {formatCurrency(totalAllocation)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Change</div>
                      <div className={`text-2xl font-bold ${allocationData.comparison.percentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {allocationData.comparison.percentChange >= 0 ? '+' : ''}{formatPercent(allocationData.comparison.percentChange)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Peer Comparison */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Peer Comparison</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Your Allocation</div>
                      <div className="text-2xl font-bold text-purple-600">
                        {formatCurrency(totalAllocation)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Peer Average</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(allocationData.comparison.peerAverage)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <div className="text-sm text-gray-600">vs. Peer Average</div>
                    <div className={`text-lg font-semibold ${totalAllocation >= allocationData.comparison.peerAverage ? 'text-green-600' : 'text-red-600'}`}>
                      {totalAllocation >= allocationData.comparison.peerAverage ? '+' : ''}
                      {formatPercent(((totalAllocation - allocationData.comparison.peerAverage) / allocationData.comparison.peerAverage) * 100)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 flex justify-between items-center pt-6 border-t border-gray-200">
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2">
                <PlusIcon className="h-4 w-4" />
                <span>Request Adjustment</span>
              </button>
              
              <div className="flex space-x-2">
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2">
                  <DocumentTextIcon className="h-4 w-4" />
                  <span>Export Report</span>
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  View Full Page
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}