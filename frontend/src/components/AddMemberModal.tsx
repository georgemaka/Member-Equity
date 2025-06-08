import { useState, FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { CreateMemberDto } from '@/types/member'
import { useToast } from '@/contexts/ToastContext'
import { XMarkIcon } from '@heroicons/react/24/outline'
import FormField from '@/components/FormField'
import { useFormValidation, memberValidationSchema, equityValidationSchema } from '@/utils/validation'
import { useUniqueValidation } from '@/hooks/useUniqueValidation'

interface AddMemberModalProps {
  isOpen: boolean
  onClose: () => void
}

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  jobTitle: string
  socialSecurityNumber: string
  taxId: string
  employeeId: string
  joinDate: string
  hireDate: string
  estimatedPercentage: string
}


export default function AddMemberModal({ isOpen, onClose }: AddMemberModalProps) {
  // Combine member and equity validation schemas
  const validationSchema = { 
    ...memberValidationSchema, 
    estimatedPercentage: equityValidationSchema.estimatedPercentage 
  }
  
  const uniqueValidation = useUniqueValidation()
  
  const {
    errors,
    touched,
    validateField,
    touchField,
    validateAll,
    clearErrors,
    getFieldError,
    hasErrors
  } = useFormValidation(validationSchema)

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    jobTitle: '',
    socialSecurityNumber: '',
    taxId: '',
    employeeId: '',
    joinDate: new Date().toISOString().split('T')[0], // Today's date
    hireDate: '',
    estimatedPercentage: ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const queryClient = useQueryClient()
  const { success, error: showError } = useToast()

  // Mock mutation for development - in production this would call the API
  const createMemberMutation = {
    mutate: (memberData: CreateMemberDto) => {
      // Simulate API call delay
      setTimeout(() => {
        console.log('Mock member created:', memberData)
        success('Member Added', `${memberData.firstName} ${memberData.lastName} has been added successfully`)
        onClose()
        resetForm()
        setIsSubmitting(false)
      }, 1000)
    }
  }

  const [uniqueErrors, setUniqueErrors] = useState<Record<string, string>>({})

  const validateUniqueFields = (): Record<string, string> => {
    const errors: Record<string, string> = {}
    
    // Validate email uniqueness
    const emailError = uniqueValidation.validateUniqueEmail(formData.email)
    if (emailError) errors.email = emailError
    
    // Validate SSN uniqueness
    if (formData.socialSecurityNumber) {
      const ssnError = uniqueValidation.validateUniqueSSN(formData.socialSecurityNumber)
      if (ssnError) errors.socialSecurityNumber = ssnError
    }
    
    // Validate Tax ID uniqueness
    if (formData.taxId) {
      const taxIdError = uniqueValidation.validateUniqueTaxId(formData.taxId)
      if (taxIdError) errors.taxId = taxIdError
    }
    
    // Validate Employee ID uniqueness
    if (formData.employeeId) {
      const empIdError = uniqueValidation.validateUniqueEmployeeId(formData.employeeId)
      if (empIdError) errors.employeeId = empIdError
    }
    
    return errors
  }

  const validateForm = (): boolean => {
    const schemaResult = validateAll(formData)
    const uniqueErrors = validateUniqueFields()
    setUniqueErrors(uniqueErrors)
    
    return schemaResult.isValid && Object.keys(uniqueErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    const memberData: CreateMemberDto = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim() || undefined,
      address: formData.address.trim() || undefined,
      city: formData.city.trim() || undefined,
      state: formData.state.trim() || undefined,
      zipCode: formData.zipCode.trim() || undefined,
      jobTitle: formData.jobTitle.trim() || undefined,
      socialSecurityNumber: formData.socialSecurityNumber.trim() || undefined,
      taxId: formData.taxId.trim() || undefined,
      employeeId: formData.employeeId.trim() || undefined,
      joinDate: formData.joinDate,
      hireDate: formData.hireDate.trim() || undefined,
      estimatedPercentage: parseFloat(formData.estimatedPercentage)
    }

    createMemberMutation.mutate(memberData)
  }

  const getFieldErrorWithUnique = (fieldName: string): string => {
    return uniqueErrors[fieldName] || getFieldError(fieldName)
  }

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear unique error for this field when user starts typing
    if (uniqueErrors[name]) {
      setUniqueErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
    
    // Validate field in real-time
    validateField(name, value)
  }

  const handleFieldBlur = (name: string) => {
    touchField(name)
    validateField(name, formData[name as keyof FormData])
  }

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      jobTitle: '',
      socialSecurityNumber: '',
      taxId: '',
      employeeId: '',
      joinDate: new Date().toISOString().split('T')[0],
      hireDate: '',
      estimatedPercentage: ''
    })
    clearErrors()
    setUniqueErrors({})
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
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Add New Member</h3>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-500 disabled:opacity-50"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <FormField
              label="First Name"
              name="firstName"
              type="text"
              value={formData.firstName}
              onChange={handleInputChange}
              onBlur={handleFieldBlur}
              error={getFieldError('firstName')}
              required={true}
              disabled={isSubmitting}
            />

            <FormField
              label="Last Name"
              name="lastName"
              type="text"
              value={formData.lastName}
              onChange={handleInputChange}
              onBlur={handleFieldBlur}
              error={getFieldError('lastName')}
              required={true}
              disabled={isSubmitting}
            />
          </div>

          <FormField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            onBlur={handleFieldBlur}
            error={getFieldErrorWithUnique('email')}
            required={true}
            disabled={isSubmitting}
          />

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="(555) 123-4567"
              className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                errors.phone
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-sukut-500 focus:border-sukut-500'
              }`}
              disabled={isSubmitting}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
          </div>

          {/* Job Title */}
          <div>
            <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700">
              Job Title
            </label>
            <input
              type="text"
              id="jobTitle"
              value={formData.jobTitle}
              onChange={(e) => handleInputChange('jobTitle', e.target.value)}
              placeholder="e.g., Senior Project Manager"
              className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                errors.jobTitle
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-sukut-500 focus:border-sukut-500'
              }`}
              disabled={isSubmitting}
            />
            {errors.jobTitle && (
              <p className="mt-1 text-sm text-red-600">{errors.jobTitle}</p>
            )}
          </div>

          {/* Tax Payment Identifiers */}
          <div className="col-span-full">
            <h4 className="text-sm font-medium text-gray-900 mb-4 border-b border-gray-200 pb-2">
              Tax Payment Identifiers
              <span className="text-xs text-gray-500 ml-2 font-normal">
                (Used for Excel upload matching)
              </span>
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Social Security Number */}
              <div>
                <label htmlFor="socialSecurityNumber" className="block text-sm font-medium text-gray-700">
                  Social Security Number
                </label>
                <input
                  type="text"
                  id="socialSecurityNumber"
                  value={formData.socialSecurityNumber}
                  onChange={(e) => handleInputChange('socialSecurityNumber', e.target.value)}
                  placeholder="123-45-6789"
                  className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                    getFieldErrorWithUnique('socialSecurityNumber')
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-sukut-500 focus:border-sukut-500'
                  }`}
                  disabled={isSubmitting}
                />
                {getFieldErrorWithUnique('socialSecurityNumber') && (
                  <p className="mt-1 text-sm text-red-600">{getFieldErrorWithUnique('socialSecurityNumber')}</p>
                )}
              </div>

              {/* Tax ID */}
              <div>
                <label htmlFor="taxId" className="block text-sm font-medium text-gray-700">
                  Tax ID
                </label>
                <input
                  type="text"
                  id="taxId"
                  value={formData.taxId}
                  onChange={(e) => handleInputChange('taxId', e.target.value)}
                  placeholder="12-3456789"
                  className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                    getFieldErrorWithUnique('taxId')
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-sukut-500 focus:border-sukut-500'
                  }`}
                  disabled={isSubmitting}
                />
                {getFieldErrorWithUnique('taxId') && (
                  <p className="mt-1 text-sm text-red-600">{getFieldErrorWithUnique('taxId')}</p>
                )}
              </div>

              {/* Employee ID */}
              <div>
                <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700">
                  Employee ID
                </label>
                <input
                  type="text"
                  id="employeeId"
                  value={formData.employeeId}
                  onChange={(e) => handleInputChange('employeeId', e.target.value)}
                  placeholder="EMP001"
                  className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                    getFieldErrorWithUnique('employeeId')
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-sukut-500 focus:border-sukut-500'
                  }`}
                  disabled={isSubmitting}
                />
                {getFieldErrorWithUnique('employeeId') && (
                  <p className="mt-1 text-sm text-red-600">{getFieldErrorWithUnique('employeeId')}</p>
                )}
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Street Address
            </label>
            <input
              type="text"
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="123 Main Street"
              className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                errors.address
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-sukut-500 focus:border-sukut-500'
              }`}
              disabled={isSubmitting}
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">{errors.address}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {/* City */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                City
              </label>
              <input
                type="text"
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Los Angeles"
                className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                  errors.city
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-sukut-500 focus:border-sukut-500'
                }`}
                disabled={isSubmitting}
              />
              {errors.city && (
                <p className="mt-1 text-sm text-red-600">{errors.city}</p>
              )}
            </div>

            {/* State */}
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                State
              </label>
              <input
                type="text"
                id="state"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                placeholder="CA"
                maxLength={2}
                className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                  errors.state
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-sukut-500 focus:border-sukut-500'
                }`}
                disabled={isSubmitting}
              />
              {errors.state && (
                <p className="mt-1 text-sm text-red-600">{errors.state}</p>
              )}
            </div>

            {/* ZIP Code */}
            <div>
              <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                ZIP Code
              </label>
              <input
                type="text"
                id="zipCode"
                value={formData.zipCode}
                onChange={(e) => handleInputChange('zipCode', e.target.value)}
                placeholder="90210"
                className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                  errors.zipCode
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-sukut-500 focus:border-sukut-500'
                }`}
                disabled={isSubmitting}
              />
              {errors.zipCode && (
                <p className="mt-1 text-sm text-red-600">{errors.zipCode}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Join Date */}
            <div>
              <label htmlFor="joinDate" className="block text-sm font-medium text-gray-700">
                Join Date *
              </label>
              <input
                type="date"
                id="joinDate"
                value={formData.joinDate}
                onChange={(e) => handleInputChange('joinDate', e.target.value)}
                className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                  errors.joinDate
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-sukut-500 focus:border-sukut-500'
                }`}
                disabled={isSubmitting}
              />
              {errors.joinDate && (
                <p className="mt-1 text-sm text-red-600">{errors.joinDate}</p>
              )}
            </div>

            {/* Hire Date */}
            <div>
              <label htmlFor="hireDate" className="block text-sm font-medium text-gray-700">
                Hire Date
              </label>
              <input
                type="date"
                id="hireDate"
                value={formData.hireDate}
                onChange={(e) => handleInputChange('hireDate', e.target.value)}
                className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                  errors.hireDate
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-sukut-500 focus:border-sukut-500'
                }`}
                disabled={isSubmitting}
              />
              {errors.hireDate && (
                <p className="mt-1 text-sm text-red-600">{errors.hireDate}</p>
              )}
            </div>
          </div>

          {/* Estimated Equity Percentage */}
          <div>
            <label htmlFor="estimatedPercentage" className="block text-sm font-medium text-gray-700">
              Estimated Equity % *
            </label>
            <div className="mt-1 relative">
              <input
                type="number"
                id="estimatedPercentage"
                step="0.01"
                min="0"
                max="100"
                value={formData.estimatedPercentage}
                onChange={(e) => handleInputChange('estimatedPercentage', e.target.value)}
                placeholder="0.25"
                className={`block w-full border rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-1 ${
                  errors.estimatedPercentage
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-sukut-500 focus:border-sukut-500'
                }`}
                disabled={isSubmitting}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">%</span>
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Examples: 0.25 for quarter percent, 10.6 for ten point six percent
            </p>
            {errors.estimatedPercentage && (
              <p className="mt-1 text-sm text-red-600">{errors.estimatedPercentage}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sukut-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || hasErrors || Object.values(uniqueErrors).some(error => error !== '')}
              className="px-4 py-2 text-sm font-medium text-white bg-sukut-600 border border-transparent rounded-md hover:bg-sukut-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sukut-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding...
                </div>
              ) : (
                'Add Member'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}