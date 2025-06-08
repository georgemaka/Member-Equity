import { useState, FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { memberApi } from '@/services/memberApi'
import { Member, MemberStatus, UpdateMemberStatusDto } from '@/types/member'
import { useFiscalYear } from '@/contexts/FiscalYearContext'
import { useToast } from '@/contexts/ToastContext'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface UpdateStatusModalProps {
  isOpen: boolean
  onClose: () => void
  member: Member | null
}

const statusOptions: { value: MemberStatus; label: string; description: string; color: string }[] = [
  {
    value: 'active',
    label: 'Active',
    description: 'Currently participating member',
    color: 'bg-green-100 text-green-800 border-green-200'
  },
  {
    value: 'retired',
    label: 'Retired',
    description: 'Voluntary retirement from company',
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  {
    value: 'resigned',
    label: 'Resigned',
    description: 'Voluntary departure from company',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  {
    value: 'terminated',
    label: 'Terminated',
    description: 'Involuntary departure from company',
    color: 'bg-red-100 text-red-800 border-red-200'
  },
  {
    value: 'deceased',
    label: 'Deceased',
    description: 'Member has passed away',
    color: 'bg-gray-100 text-gray-800 border-gray-200'
  },
  {
    value: 'suspended',
    label: 'Suspended',
    description: 'Temporarily inactive (leave, disciplinary)',
    color: 'bg-orange-100 text-orange-800 border-orange-200'
  },
  {
    value: 'probationary',
    label: 'Probationary',
    description: 'New member during trial period',
    color: 'bg-purple-100 text-purple-800 border-purple-200'
  }
]

export default function UpdateStatusModal({ isOpen, onClose, member }: UpdateStatusModalProps) {
  const { currentFiscalYear } = useFiscalYear()
  const { success, error: showError } = useToast()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    status: (member?.currentStatus?.status || 'active') as MemberStatus,
    effectiveDate: new Date().toISOString().split('T')[0],
    reason: '',
    notes: ''
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})

  const updateStatusMutation = useMutation({
    mutationFn: (data: UpdateMemberStatusDto) => memberApi.updateStatus(member!.id, data),
    onSuccess: (updatedMember) => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      success(
        'Status Updated', 
        `${updatedMember.firstName} ${updatedMember.lastName} status updated to ${formData.status}`
      )
      onClose()
      resetForm()
    },
    onError: (error) => {
      showError('Update Failed', error.message)
    }
  })

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.status) {
      newErrors.status = 'Status is required'
    }
    if (!formData.effectiveDate) {
      newErrors.effectiveDate = 'Effective date is required'
    }
    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!member || !validateForm()) {
      return
    }

    const statusData: UpdateMemberStatusDto = {
      fiscalYear: currentFiscalYear,
      status: formData.status,
      effectiveDate: formData.effectiveDate,
      reason: formData.reason.trim(),
      notes: formData.notes.trim() || undefined
    }

    updateStatusMutation.mutate(statusData)
  }

  const resetForm = () => {
    setFormData({
      status: (member?.currentStatus?.status || 'active') as MemberStatus,
      effectiveDate: new Date().toISOString().split('T')[0],
      reason: '',
      notes: ''
    })
    setErrors({})
  }

  const handleClose = () => {
    if (!updateStatusMutation.isLoading) {
      onClose()
      resetForm()
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const selectedOption = statusOptions.find(option => option.value === formData.status)
  const currentOption = statusOptions.find(option => option.value === member?.currentStatus?.status)

  if (!isOpen || !member) return null

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Update Member Status</h3>
          <button
            onClick={handleClose}
            disabled={updateStatusMutation.isLoading}
            className="text-gray-400 hover:text-gray-500 disabled:opacity-50 transition-colors duration-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Member Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900">
              {member.firstName} {member.lastName}
            </h4>
            <p className="text-sm text-gray-500">{member.email}</p>
            {member.jobTitle && (
              <p className="text-sm text-gray-500">{member.jobTitle}</p>
            )}
            <div className="mt-2 flex items-center space-x-2">
              <span className="text-sm text-gray-500">Current Status:</span>
              {currentOption && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${currentOption.color}`}>
                  {currentOption.label}
                </span>
              )}
            </div>
          </div>

          {/* Fiscal Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fiscal Year
            </label>
            <input
              type="number"
              value={currentFiscalYear}
              disabled
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              New Status *
            </label>
            <div className="space-y-2">
              {statusOptions.map((option) => (
                <label
                  key={option.value}
                  className={`relative flex cursor-pointer rounded-lg p-3 border focus:outline-none transition-all duration-150 ${
                    formData.status === option.value
                      ? 'border-sukut-500 bg-sukut-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${updateStatusMutation.isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={option.value}
                    checked={formData.status === option.value}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="h-4 w-4 text-sukut-600 focus:ring-sukut-500 border-gray-300 mt-0.5"
                    disabled={updateStatusMutation.isLoading}
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{option.label}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${option.color}`}>
                        {option.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
            {errors.status && (
              <p className="mt-1 text-sm text-red-600">{errors.status}</p>
            )}
          </div>

          {/* Effective Date */}
          <div>
            <label htmlFor="effectiveDate" className="block text-sm font-medium text-gray-700 mb-1">
              Effective Date *
            </label>
            <input
              type="date"
              id="effectiveDate"
              value={formData.effectiveDate}
              onChange={(e) => handleInputChange('effectiveDate', e.target.value)}
              className={`block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 transition-colors duration-150 ${
                errors.effectiveDate
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-sukut-500 focus:border-sukut-500'
              }`}
              disabled={updateStatusMutation.isLoading}
            />
            {errors.effectiveDate && (
              <p className="mt-1 text-sm text-red-600">{errors.effectiveDate}</p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Status Change *
            </label>
            <textarea
              id="reason"
              rows={3}
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              placeholder="e.g., Voluntary retirement effective end of FY 2024"
              className={`block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 transition-colors duration-150 ${
                errors.reason
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-sukut-500 focus:border-sukut-500'
              }`}
              disabled={updateStatusMutation.isLoading}
            />
            {errors.reason && (
              <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              id="notes"
              rows={2}
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Optional additional notes..."
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sukut-500 focus:border-sukut-500 transition-colors duration-150"
              disabled={updateStatusMutation.isLoading}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={updateStatusMutation.isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sukut-500 disabled:opacity-50 transition-colors duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateStatusMutation.isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-sukut-600 border border-transparent rounded-lg hover:bg-sukut-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sukut-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
            >
              {updateStatusMutation.isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </div>
              ) : (
                'Update Status'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}