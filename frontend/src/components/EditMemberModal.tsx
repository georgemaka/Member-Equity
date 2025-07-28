import { useState, FormEvent, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Member, UpdateMemberDto } from '@/types/member'
import { memberApi } from '@/services/memberApi'
import { useToast } from '@/contexts/ToastContext'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useEscapeKey } from '@/hooks/useEscapeKey'

interface EditMemberModalProps {
  isOpen: boolean
  onClose: () => void
  member: Member | null
}

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  jobTitle: string
  address: any
}

export default function EditMemberModal({ isOpen, onClose, member }: EditMemberModalProps) {
  useEscapeKey(onClose, isOpen)
  const { success, error: showError } = useToast()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA'
    },
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize form data when member changes
  useEffect(() => {
    if (member) {
      setFormData({
        firstName: member.firstName || '',
        lastName: member.lastName || '',
        email: member.email || '',
        phone: member.phone || '',
        jobTitle: member.jobTitle || '',
        address: member.address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'USA'
        },
      })
    }
  }, [member])

  const updateMemberMutation = useMutation({
    mutationFn: (data: UpdateMemberDto) => memberApi.updateMember(member!.id, data),
    onSuccess: (updatedMember) => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      queryClient.invalidateQueries({ queryKey: ['member', member!.id] })
      success(
        'Member Updated',
        `${updatedMember.firstName} ${updatedMember.lastName} has been updated successfully`
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

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }


    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!member || !validateForm()) {
      return
    }

    const updateData: UpdateMemberDto = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || undefined,
      jobTitle: formData.jobTitle.trim() || undefined,
      address: formData.address,
    }

    updateMemberMutation.mutate(updateData)
  }

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      jobTitle: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'USA'
      },
      })
    setErrors({})
  }

  const handleClose = () => {
    if (!updateMemberMutation.isLoading) {
      onClose()
      resetForm()
    }
  }

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1]
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  if (!isOpen || !member) return null

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">Edit Member</h3>
          <button
            onClick={handleClose}
            disabled={updateMemberMutation.isLoading}
            className="text-gray-400 hover:text-gray-500 disabled:opacity-50 transition-colors duration-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Personal Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Personal Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={`block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 transition-colors duration-150 ${
                      errors.firstName
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-sukut-500 focus:border-sukut-500'
                    }`}
                    disabled={updateMemberMutation.isLoading}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={`block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 transition-colors duration-150 ${
                      errors.lastName
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-sukut-500 focus:border-sukut-500'
                    }`}
                    disabled={updateMemberMutation.isLoading}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Contact Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 transition-colors duration-150 ${
                      errors.email
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-sukut-500 focus:border-sukut-500'
                    }`}
                    disabled={updateMemberMutation.isLoading}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sukut-500 focus:border-sukut-500 transition-colors duration-150"
                    disabled={updateMemberMutation.isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Employment Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Employment Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    id="jobTitle"
                    value={formData.jobTitle}
                    onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sukut-500 focus:border-sukut-500 transition-colors duration-150"
                    disabled={updateMemberMutation.isLoading}
                  />
                </div>

              </div>
            </div>

            {/* Address Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Address</h4>
              <div className="space-y-4">
                <div>
                  <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    id="street"
                    value={formData.address.street}
                    onChange={(e) => handleInputChange('address.street', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sukut-500 focus:border-sukut-500 transition-colors duration-150"
                    disabled={updateMemberMutation.isLoading}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      value={formData.address.city}
                      onChange={(e) => handleInputChange('address.city', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sukut-500 focus:border-sukut-500 transition-colors duration-150"
                      disabled={updateMemberMutation.isLoading}
                    />
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      id="state"
                      value={formData.address.state}
                      onChange={(e) => handleInputChange('address.state', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sukut-500 focus:border-sukut-500 transition-colors duration-150"
                      disabled={updateMemberMutation.isLoading}
                    />
                  </div>

                  <div>
                    <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      id="zipCode"
                      value={formData.address.zipCode}
                      onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sukut-500 focus:border-sukut-500 transition-colors duration-150"
                      disabled={updateMemberMutation.isLoading}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 flex-shrink-0">
            <button
              type="button"
              onClick={handleClose}
              disabled={updateMemberMutation.isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sukut-500 disabled:opacity-50 transition-colors duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMemberMutation.isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-sukut-600 border border-transparent rounded-lg hover:bg-sukut-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sukut-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
            >
              {updateMemberMutation.isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </div>
              ) : (
                'Update Member'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}