import { useState, FormEvent } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { taxPaymentApi } from '@/services/taxPaymentApi'
import { memberApi } from '@/services/memberApi'
import { 
  CreateTaxPaymentDto, 
  TaxPaymentType, 
  PaymentFrequency,
  TAX_PAYMENT_TYPE_LABELS,
  PAYMENT_FREQUENCY_LABELS,
  QUARTER_LABELS 
} from '@/types/taxPayment'
import { useFiscalYear } from '@/contexts/FiscalYearContext'
import { useToast } from '@/contexts/ToastContext'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface AddTaxPaymentModalProps {
  isOpen: boolean
  onClose: () => void
}

interface FormData {
  paymentType: TaxPaymentType
  paymentDate: string
  amount: string
  frequency: PaymentFrequency
  quarter: string
  month: string
  description: string
  notes: string
  jurisdiction: string
  isEstimated: boolean
  checkNumber: string
  confirmationNumber: string
  memberId: string
  taxYear: string
  isBulkPayment: boolean
  distributionMethod: 'equal' | 'by_equity' | 'custom'
}

interface FormErrors {
  paymentType?: string
  paymentDate?: string
  amount?: string
  frequency?: string
  taxYear?: string
  [key: string]: string | undefined
}

export default function AddTaxPaymentModal({ isOpen, onClose }: AddTaxPaymentModalProps) {
  useEscapeKey(onClose, isOpen)
  const { currentFiscalYear } = useFiscalYear()
  const { success, error: showError } = useToast()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<FormData>({
    paymentType: 'federal_estimated',
    paymentDate: new Date().toISOString().split('T')[0],
    amount: '',
    frequency: 'quarterly',
    quarter: '1',
    month: '1',
    description: '',
    notes: '',
    jurisdiction: '',
    isEstimated: true,
    checkNumber: '',
    confirmationNumber: '',
    memberId: '',
    taxYear: new Date().getFullYear().toString(),
    isBulkPayment: false,
    distributionMethod: 'by_equity'
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get members for selection
  const { data: membersData } = useQuery({
    queryKey: ['members', currentFiscalYear],
    queryFn: () => memberApi.getMembersForYear(currentFiscalYear),
    enabled: isOpen
  })

  const createPaymentMutation = useMutation({
    mutationFn: (data: CreateTaxPaymentDto) => taxPaymentApi.createTaxPayment(data),
    onSuccess: (newPayment) => {
      queryClient.invalidateQueries({ queryKey: ['tax-dashboard'] })
      success('Payment Added', `Tax payment of $${newPayment.amount.toLocaleString()} added successfully`)
      onClose()
      resetForm()
    },
    onError: (error) => {
      showError('Failed to Add Payment', error.message)
    },
    onSettled: () => {
      setIsSubmitting(false)
    }
  })

  const createBulkPaymentMutation = useMutation({
    mutationFn: (data: any) => taxPaymentApi.createBulkTaxPayments(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['tax-dashboard'] })
      success('Bulk Payments Added', `${result.createdCount} tax payments added successfully`)
      onClose()
      resetForm()
    },
    onError: (error) => {
      showError('Failed to Add Bulk Payments', error.message)
    },
    onSettled: () => {
      setIsSubmitting(false)
    }
  })

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.paymentType) {
      newErrors.paymentType = 'Payment type is required'
    }
    if (!formData.paymentDate) {
      newErrors.paymentDate = 'Payment date is required'
    }
    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required'
    } else {
      const amount = parseFloat(formData.amount)
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = 'Amount must be a positive number'
      }
    }
    if (!formData.taxYear) {
      newErrors.taxYear = 'Tax year is required'
    }
    if (!formData.isBulkPayment && !formData.memberId) {
      newErrors.memberId = 'Member is required for individual payments'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    const basePayment: CreateTaxPaymentDto = {
      fiscalYear: currentFiscalYear,
      taxYear: parseInt(formData.taxYear),
      paymentType: formData.paymentType,
      paymentDate: formData.paymentDate,
      amount: parseFloat(formData.amount),
      frequency: formData.frequency,
      quarter: formData.frequency === 'quarterly' ? parseInt(formData.quarter) : undefined,
      month: formData.frequency === 'monthly' ? parseInt(formData.month) : undefined,
      description: formData.description.trim() || undefined,
      notes: formData.notes.trim() || undefined,
      jurisdiction: formData.jurisdiction.trim() || undefined,
      isEstimated: formData.isEstimated,
      checkNumber: formData.checkNumber.trim() || undefined,
      confirmationNumber: formData.confirmationNumber.trim() || undefined
    }

    if (formData.isBulkPayment) {
      // Create bulk payments for all active members
      const bulkData = {
        payments: [basePayment],
        applyToAllMembers: true,
        distributionMethod: formData.distributionMethod
      }
      createBulkPaymentMutation.mutate(bulkData)
    } else {
      // Create individual payment
      const paymentData = {
        ...basePayment,
        memberId: formData.memberId || undefined
      }
      createPaymentMutation.mutate(paymentData)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const resetForm = () => {
    setFormData({
      paymentType: 'federal_estimated',
      paymentDate: new Date().toISOString().split('T')[0],
      amount: '',
      frequency: 'quarterly',
      quarter: '1',
      month: '1',
      description: '',
      notes: '',
      jurisdiction: '',
      isEstimated: true,
      checkNumber: '',
      confirmationNumber: '',
      memberId: '',
      taxYear: new Date().getFullYear().toString(),
      isBulkPayment: false,
      distributionMethod: 'by_equity'
    })
    setErrors({})
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
      resetForm()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Add Tax Payment</h3>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-500 disabled:opacity-50 transition-colors duration-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Payment Scope */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Payment Scope
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="paymentScope"
                  checked={!formData.isBulkPayment}
                  onChange={() => handleInputChange('isBulkPayment', false)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                  disabled={isSubmitting}
                />
                <span className="ml-2 text-sm text-gray-700">Individual Member Payment</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="paymentScope"
                  checked={formData.isBulkPayment}
                  onChange={() => handleInputChange('isBulkPayment', true)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                  disabled={isSubmitting}
                />
                <span className="ml-2 text-sm text-gray-700">Company-wide Payment (All Members)</span>
              </label>
            </div>
          </div>

          {/* Member Selection (for individual payments) */}
          {!formData.isBulkPayment && (
            <div>
              <label htmlFor="memberId" className="block text-sm font-medium text-gray-700 mb-1">
                Member *
              </label>
              <select
                id="memberId"
                value={formData.memberId}
                onChange={(e) => handleInputChange('memberId', e.target.value)}
                className={`block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                  errors.memberId
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-emerald-500 focus:border-emerald-500'
                }`}
                disabled={isSubmitting}
              >
                <option value="">Select a member</option>
                {membersData?.data?.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.firstName} {member.lastName}
                  </option>
                ))}
              </select>
              {errors.memberId && (
                <p className="mt-1 text-sm text-red-600">{errors.memberId}</p>
              )}
            </div>
          )}

          {/* Distribution Method (for bulk payments) */}
          {formData.isBulkPayment && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Distribution Method
              </label>
              <select
                value={formData.distributionMethod}
                onChange={(e) => handleInputChange('distributionMethod', e.target.value)}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                disabled={isSubmitting}
              >
                <option value="by_equity">Distribute by Equity Percentage</option>
                <option value="equal">Equal Distribution</option>
                <option value="custom">Custom Distribution</option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Payment Type */}
            <div>
              <label htmlFor="paymentType" className="block text-sm font-medium text-gray-700 mb-1">
                Payment Type *
              </label>
              <select
                id="paymentType"
                value={formData.paymentType}
                onChange={(e) => handleInputChange('paymentType', e.target.value)}
                className={`block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                  errors.paymentType
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-emerald-500 focus:border-emerald-500'
                }`}
                disabled={isSubmitting}
              >
                {Object.entries(TAX_PAYMENT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {errors.paymentType && (
                <p className="mt-1 text-sm text-red-600">{errors.paymentType}</p>
              )}
            </div>

            {/* Tax Year */}
            <div>
              <label htmlFor="taxYear" className="block text-sm font-medium text-gray-700 mb-1">
                Tax Year *
              </label>
              <select
                id="taxYear"
                value={formData.taxYear}
                onChange={(e) => handleInputChange('taxYear', e.target.value)}
                className={`block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                  errors.taxYear
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-emerald-500 focus:border-emerald-500'
                }`}
                disabled={isSubmitting}
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - i
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  )
                })}
              </select>
              {errors.taxYear && (
                <p className="mt-1 text-sm text-red-600">{errors.taxYear}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Payment Date */}
            <div>
              <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                id="paymentDate"
                value={formData.paymentDate}
                onChange={(e) => handleInputChange('paymentDate', e.target.value)}
                className={`block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                  errors.paymentDate
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-emerald-500 focus:border-emerald-500'
                }`}
                disabled={isSubmitting}
              />
              {errors.paymentDate && (
                <p className="mt-1 text-sm text-red-600">{errors.paymentDate}</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">$</span>
                </div>
                <input
                  type="number"
                  id="amount"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="0.00"
                  className={`block w-full border rounded-md pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                    errors.amount
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-emerald-500 focus:border-emerald-500'
                  }`}
                  disabled={isSubmitting}
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {/* Frequency */}
            <div>
              <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">
                Frequency
              </label>
              <select
                id="frequency"
                value={formData.frequency}
                onChange={(e) => handleInputChange('frequency', e.target.value)}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                disabled={isSubmitting}
              >
                {Object.entries(PAYMENT_FREQUENCY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Quarter (if quarterly) */}
            {formData.frequency === 'quarterly' && (
              <div>
                <label htmlFor="quarter" className="block text-sm font-medium text-gray-700 mb-1">
                  Quarter
                </label>
                <select
                  id="quarter"
                  value={formData.quarter}
                  onChange={(e) => handleInputChange('quarter', e.target.value)}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                  disabled={isSubmitting}
                >
                  {Object.entries(QUARTER_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Month (if monthly) */}
            {formData.frequency === 'monthly' && (
              <div>
                <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">
                  Month
                </label>
                <select
                  id="month"
                  value={formData.month}
                  onChange={(e) => handleInputChange('month', e.target.value)}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                  disabled={isSubmitting}
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = i + 1
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                    return (
                      <option key={month} value={month}>
                        {monthNames[i]}
                      </option>
                    )
                  })}
                </select>
              </div>
            )}

            {/* Jurisdiction */}
            <div>
              <label htmlFor="jurisdiction" className="block text-sm font-medium text-gray-700 mb-1">
                Jurisdiction
              </label>
              <input
                type="text"
                id="jurisdiction"
                value={formData.jurisdiction}
                onChange={(e) => handleInputChange('jurisdiction', e.target.value)}
                placeholder="e.g., California, IRS"
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="e.g., Q1 2024 Federal Estimated Tax Payment"
              className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Check Number */}
            <div>
              <label htmlFor="checkNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Check Number
              </label>
              <input
                type="text"
                id="checkNumber"
                value={formData.checkNumber}
                onChange={(e) => handleInputChange('checkNumber', e.target.value)}
                placeholder="Check #"
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                disabled={isSubmitting}
              />
            </div>

            {/* Confirmation Number */}
            <div>
              <label htmlFor="confirmationNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmation Number
              </label>
              <input
                type="text"
                id="confirmationNumber"
                value={formData.confirmationNumber}
                onChange={(e) => handleInputChange('confirmationNumber', e.target.value)}
                placeholder="Confirmation #"
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes..."
              className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              disabled={isSubmitting}
            />
          </div>

          {/* Is Estimated */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isEstimated"
              checked={formData.isEstimated}
              onChange={(e) => handleInputChange('isEstimated', e.target.checked)}
              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              disabled={isSubmitting}
            />
            <label htmlFor="isEstimated" className="ml-2 text-sm text-gray-700">
              This is an estimated tax payment
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {formData.isBulkPayment ? 'Creating Bulk Payments...' : 'Adding Payment...'}
                </div>
              ) : (
                formData.isBulkPayment ? 'Create Bulk Payments' : 'Add Payment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}