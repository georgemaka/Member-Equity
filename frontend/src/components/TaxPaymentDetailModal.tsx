import { useState, useEffect } from 'react'
import { Member } from '@/types/member'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import {
  XMarkIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  PlusIcon,
  EyeIcon,
  ArrowLeftIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

interface TaxPaymentDetailModalProps {
  isOpen: boolean
  onClose: () => void
  member: Member | null
  allMembers?: Member[]
  onMemberChange?: (member: Member) => void
}

interface TaxPaymentRecord {
  id: string
  date: string
  quarter: string
  federalAmount: number
  stateAmount: number
  estimatedAmount: number
  actualAmount: number
  paymentMethod: string
  status: 'paid' | 'pending' | 'overdue'
  notes?: string
}

export default function TaxPaymentDetailModal({ 
  isOpen, 
  onClose, 
  member,
  allMembers = [],
  onMemberChange
}: TaxPaymentDetailModalProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  
  useEscapeKey(onClose, isOpen)

  // Mock tax payment data - in production this would come from an API
  const generateTaxPayments = (memberId: string): TaxPaymentRecord[] => {
    const hash = memberId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    
    const baseAmount = Math.abs(hash % 30000) + 5000
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4']
    
    return quarters.map((quarter, index) => {
      const quarterMultiplier = 1 + (index * 0.1)
      const federalAmount = baseAmount * quarterMultiplier * 0.7
      const stateAmount = baseAmount * quarterMultiplier * 0.3
      const estimatedAmount = federalAmount + stateAmount
      const actualAmount = estimatedAmount * (0.95 + Math.random() * 0.1) // Slight variance
      
      return {
        id: `${memberId}-${selectedYear}-${quarter}`,
        date: `${selectedYear}-${(index + 1) * 3}-15`, // Mid-quarter dates
        quarter,
        federalAmount,
        stateAmount,
        estimatedAmount,
        actualAmount,
        paymentMethod: index % 2 === 0 ? 'ACH Transfer' : 'Check',
        status: index < 2 ? 'paid' : index === 2 ? 'pending' : 'overdue' as const,
        notes: index === 3 ? 'Awaiting final calculation' : undefined
      }
    })
  }

  const taxPayments = member ? generateTaxPayments(member.id) : []
  
  const totals = taxPayments.reduce((acc, payment) => ({
    estimated: acc.estimated + payment.estimatedAmount,
    actual: acc.actual + payment.actualAmount,
    federal: acc.federal + payment.federalAmount,
    state: acc.state + payment.stateAmount
  }), { estimated: 0, actual: 0, federal: 0, state: 0 })

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
      case 'paid': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'overdue': return 'bg-red-100 text-red-800'
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
        
        <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <CurrencyDollarIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Tax Payments - {member.firstName} {member.lastName}
                  </h3>
                  <p className="text-blue-100 text-sm">
                    {member.jobTitle} • {selectedYear} Tax Year
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
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {[2024, 2025, 2026].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                
                <div className="flex space-x-2">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                    <PlusIcon className="h-4 w-4" />
                    <span>Add Payment</span>
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2">
                    <EyeIcon className="h-4 w-4" />
                    <span>View Full History</span>
                  </button>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-sm font-medium text-blue-600">Total Estimated</div>
                  <div className="text-2xl font-bold text-blue-900">{formatCurrency(totals.estimated)}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-sm font-medium text-green-600">Total Actual</div>
                  <div className="text-2xl font-bold text-green-900">{formatCurrency(totals.actual)}</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="text-sm font-medium text-purple-600">Federal Total</div>
                  <div className="text-2xl font-bold text-purple-900">{formatCurrency(totals.federal)}</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="text-sm font-medium text-orange-600">State Total</div>
                  <div className="text-2xl font-bold text-orange-900">{formatCurrency(totals.state)}</div>
                </div>
              </div>
            </div>

            {/* Tax Payments Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900">Quarterly Tax Payments</h4>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quarter
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Federal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        State
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estimated
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actual
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Method
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {taxPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <CalendarDaysIcon className="h-5 w-5 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900">{payment.quarter}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(payment.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(payment.federalAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(payment.stateAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(payment.estimatedAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatCurrency(payment.actualAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.paymentMethod}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes Section */}
            <div className="mt-6 bg-gray-50 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                <DocumentTextIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-2">Notes & Reminders</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Q4 payment pending final calculation review</li>
                    <li>• State extension filed for additional time</li>
                    <li>• Consider quarterly payment adjustment for next year</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}