import { useState, useEffect } from 'react'
import { useMockMembersData } from '@/hooks/useMockMembersData'
import { useCreateDistributionRequest } from '@/hooks/useMockDistributionRequests'
import { DistributionType, PayoutMethod, ApprovalStep } from '@/types/distributionRequest'
import { useToast } from '@/contexts/ToastContext'
import { useMockAuth } from '@/contexts/MockAuthContext'
import {
  XMarkIcon,
  CurrencyDollarIcon,
  UserIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  CreditCardIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

interface CreateDistributionRequestModalProps {
  isOpen: boolean
  onClose: () => void
  preselectedMemberId?: string
}

const distributionTypeLabels = {
  quarterly: 'Quarterly Distribution',
  annual: 'Annual Distribution',
  special: 'Special Distribution',
  tax: 'Tax Distribution',
  emergency: 'Emergency Distribution',
  bonus: 'Performance Bonus',
  return_of_capital: 'Return of Capital'
}

const payoutMethodLabels = {
  wire_transfer: 'Wire Transfer',
  check: 'Check',
  ach: 'ACH Transfer',
  direct_deposit: 'Direct Deposit'
}

// Mock GL accounts
const glAccounts = [
  { code: '7100-001', description: 'Member Distributions - Quarterly' },
  { code: '7200-001', description: 'Member Distributions - Annual' },
  { code: '7200-002', description: 'Special Member Distributions' },
  { code: '7300-001', description: 'Emergency Member Distributions' },
  { code: '7400-001', description: 'Performance Bonus Distributions' },
  { code: '7500-001', description: 'Tax Distributions' },
  { code: '3100-001', description: 'Return of Capital' }
]

// Mock approvers
const approvers = [
  { id: 'cfo@sukut.com', name: 'Chief Financial Officer', email: 'cfo@sukut.com', role: 'CFO' },
  { id: 'ceo@sukut.com', name: 'Chief Executive Officer', email: 'ceo@sukut.com', role: 'CEO' },
  { id: 'board@sukut.com', name: 'Board of Directors', email: 'board@sukut.com', role: 'Board' },
  { id: 'controller@sukut.com', name: 'Controller', email: 'controller@sukut.com', role: 'Controller' }
]

export default function CreateDistributionRequestModal({
  isOpen,
  onClose,
  preselectedMemberId
}: CreateDistributionRequestModalProps) {
  const { data: membersData } = useMockMembersData(1, 100)
  const createRequest = useCreateDistributionRequest()
  const { success, error } = useToast()
  const { user } = useMockAuth()

  const [formData, setFormData] = useState({
    memberId: preselectedMemberId || '',
    distributionType: 'quarterly' as DistributionType,
    amount: '',
    reason: '',
    description: '',
    payoutMethod: 'wire_transfer' as PayoutMethod,
    accountCode: '7100-001',
    requestedPaymentDate: '',
    approverId: 'cfo@sukut.com',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Update form when preselectedMemberId changes
  useEffect(() => {
    if (preselectedMemberId && preselectedMemberId !== formData.memberId) {
      setFormData(prev => ({
        ...prev,
        memberId: preselectedMemberId
      }))
    }
  }, [preselectedMemberId, formData.memberId])

  const selectedMember = membersData?.data?.find(m => m.id === formData.memberId)
  const selectedAccount = glAccounts.find(acc => acc.code === formData.accountCode)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.memberId) newErrors.memberId = 'Please select a member'
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Please enter a valid amount'
    if (!formData.reason.trim()) newErrors.reason = 'Please provide a reason'
    if (!formData.requestedPaymentDate) newErrors.requestedPaymentDate = 'Please select a payment date'
    if (!formData.approverId) newErrors.approverId = 'Please select an approver'

    // Business validations
    if (formData.amount && parseFloat(formData.amount) > 100000) {
      newErrors.amount = 'Amounts over $100,000 require special approval'
    }

    if (selectedMember && formData.amount) {
      const memberEquityValue = (selectedMember.currentEquity?.estimatedPercentage || 0) * 1000000 // Mock company value
      if (parseFloat(formData.amount) > memberEquityValue * 0.5) {
        newErrors.amount = 'Amount exceeds 50% of member equity value'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    const selectedApprover = approvers.find(a => a.id === formData.approverId)
    if (!selectedApprover || !selectedMember) return

    const approvalChain: ApprovalStep[] = [
      {
        id: `step-${Date.now()}`,
        approverId: selectedApprover.id,
        approverName: selectedApprover.name,
        approverEmail: selectedApprover.email,
        approverRole: selectedApprover.role,
        order: 1,
        status: 'pending',
        requiredApproval: true
      }
    ]

    // Add additional approval for high amounts
    if (parseFloat(formData.amount) > 25000) {
      approvalChain.push({
        id: `step-${Date.now() + 1}`,
        approverId: 'board@sukut.com',
        approverName: 'Board of Directors',
        approverEmail: 'board@sukut.com',
        approverRole: 'Board',
        order: 2,
        status: 'pending',
        requiredApproval: true
      })
    }

    try {
      await createRequest.mutateAsync({
        memberId: formData.memberId,
        memberName: selectedMember.firstName + ' ' + selectedMember.lastName,
        requestedBy: user?.email || '',
        requestedByEmail: user?.email || '',
        requestedDate: new Date().toISOString(),
        distributionType: formData.distributionType,
        amount: parseFloat(formData.amount),
        reason: formData.reason,
        description: formData.description,
        payoutMethod: formData.payoutMethod,
        accountCode: formData.accountCode,
        accountDescription: selectedAccount?.description || '',
        requestedPaymentDate: new Date(formData.requestedPaymentDate).toISOString(),
        currentApprover: selectedApprover.id,
        currentApproverEmail: selectedApprover.email,
        approvalChain,
        priority: formData.priority
      })

      success('Request Created', 'Distribution request submitted for approval')
      onClose()
      
      // Reset form
      setFormData({
        memberId: preselectedMemberId || '',
        distributionType: 'quarterly',
        amount: '',
        reason: '',
        description: '',
        payoutMethod: 'wire_transfer',
        accountCode: '7100-001',
        requestedPaymentDate: '',
        approverId: 'cfo@sukut.com',
        priority: 'normal'
      })
      setErrors({})
    } catch (err) {
      error('Request Failed', 'Failed to create distribution request')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center mr-4">
              <CurrencyDollarIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Create Distribution Request</h3>
              <p className="text-sm text-gray-500">Submit a new member distribution request for approval</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Member Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <UserIcon className="h-4 w-4 inline mr-1" />
                  Select Member *
                </label>
                <select
                  value={formData.memberId}
                  onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.memberId ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Choose a member...</option>
                  {membersData?.data?.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.firstName} {member.lastName} - {member.currentEquity?.estimatedPercentage?.toFixed(2)}%
                    </option>
                  ))}
                </select>
                {errors.memberId && <p className="mt-1 text-xs text-red-600">{errors.memberId}</p>}
                
                {selectedMember && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm">
                      <p><span className="font-medium">Equity:</span> {selectedMember.currentEquity?.estimatedPercentage?.toFixed(3)}%</p>
                      <p><span className="font-medium">Capital Balance:</span> ${selectedMember.currentEquity?.capitalBalance?.toLocaleString()}</p>
                      <p><span className="font-medium">Status:</span> {selectedMember.currentStatus?.status}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Distribution Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ChartBarIcon className="h-4 w-4 inline mr-1" />
                  Distribution Type *
                </label>
                <select
                  value={formData.distributionType}
                  onChange={(e) => setFormData({ ...formData, distributionType: e.target.value as DistributionType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {Object.entries(distributionTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
                  Amount *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className={`w-full pl-7 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.amount ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                </div>
                {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount}</p>}
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                  Reason *
                </label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.reason ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Q2 2024 Quarterly Distribution"
                />
                {errors.reason && <p className="mt-1 text-xs text-red-600">{errors.reason}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Additional details about this distribution..."
                />
              </div>

              {/* Payout Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CreditCardIcon className="h-4 w-4 inline mr-1" />
                  Payout Method *
                </label>
                <select
                  value={formData.payoutMethod}
                  onChange={(e) => setFormData({ ...formData, payoutMethod: e.target.value as PayoutMethod })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {Object.entries(payoutMethodLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Account Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">GL Account *</label>
                <select
                  value={formData.accountCode}
                  onChange={(e) => setFormData({ ...formData, accountCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {glAccounts.map(account => (
                    <option key={account.code} value={account.code}>
                      {account.code} - {account.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarDaysIcon className="h-4 w-4 inline mr-1" />
                  Requested Payment Date *
                </label>
                <input
                  type="date"
                  value={formData.requestedPaymentDate}
                  onChange={(e) => setFormData({ ...formData, requestedPaymentDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.requestedPaymentDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.requestedPaymentDate && <p className="mt-1 text-xs text-red-600">{errors.requestedPaymentDate}</p>}
              </div>

              {/* Approver */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Approver *</label>
                <select
                  value={formData.approverId}
                  onChange={(e) => setFormData({ ...formData, approverId: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.approverId ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  {approvers.map(approver => (
                    <option key={approver.id} value={approver.id}>
                      {approver.name} ({approver.role})
                    </option>
                  ))}
                </select>
                {errors.approverId && <p className="mt-1 text-xs text-red-600">{errors.approverId}</p>}
                
                {parseFloat(formData.amount) > 25000 && (
                  <p className="mt-1 text-xs text-blue-600">
                    ℹ️ Amounts over $25,000 require additional Board approval
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-6">
            <div className="text-sm text-gray-500">
              * Required fields
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createRequest.isPending}
                className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors duration-200"
              >
                {createRequest.isPending ? 'Creating...' : 'Create Request'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}