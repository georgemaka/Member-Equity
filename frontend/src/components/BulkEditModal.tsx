import { useState } from 'react'
import { XMarkIcon, CheckIcon, UsersIcon } from '@heroicons/react/24/outline'
import { useToast } from '@/contexts/ToastContext'
import FormField from '@/components/FormField'
import { useFormValidation, memberValidationSchema } from '@/utils/validation'

interface BulkEditModalProps {
  memberIds: string[]
  isOpen: boolean
  onClose: () => void
  onSave: (updates: BulkEditData) => void
}

interface BulkEditData {
  jobTitle?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  status?: string
}

export default function BulkEditModal({ memberIds, isOpen, onClose, onSave }: BulkEditModalProps) {
  const { success } = useToast()
  const [formData, setFormData] = useState<BulkEditData>({})
  const [enabledFields, setEnabledFields] = useState<Set<string>>(new Set())

  const handleFieldToggle = (field: string) => {
    setEnabledFields(prev => {
      const newSet = new Set(prev)
      if (newSet.has(field)) {
        newSet.delete(field)
        setFormData(prev => {
          const newData = { ...prev }
          delete newData[field as keyof BulkEditData]
          return newData
        })
      } else {
        newSet.add(field)
      }
      return newSet
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = () => {
    const updates = Object.fromEntries(
      Object.entries(formData).filter(([key]) => enabledFields.has(key))
    )
    
    onSave(updates)
    success('Bulk Update', `Updated ${memberIds.length} members successfully`)
    onClose()
    
    // Reset form
    setFormData({})
    setEnabledFields(new Set())
  }

  const handleCancel = () => {
    onClose()
    setFormData({})
    setEnabledFields(new Set())
  }

  if (!isOpen) return null

  const fields = [
    { key: 'jobTitle', label: 'Job Title', type: 'text' },
    { key: 'phone', label: 'Phone', type: 'tel' },
    { key: 'address', label: 'Address', type: 'text' },
    { key: 'city', label: 'City', type: 'text' },
    { key: 'state', label: 'State', type: 'text' },
    { key: 'zipCode', label: 'Zip Code', type: 'text' },
    { 
      key: 'status', 
      label: 'Status', 
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'retired', label: 'Retired' },
        { value: 'resigned', label: 'Resigned' },
        { value: 'terminated', label: 'Terminated' },
        { value: 'suspended', label: 'Suspended' },
        { value: 'probationary', label: 'Probationary' }
      ]
    }
  ]

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
              <UsersIcon className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Bulk Edit Members</h3>
              <p className="text-sm text-gray-500">Update {memberIds.length} selected members</p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Select the fields you want to update. Only checked fields will be modified for all selected members.
            </p>
          </div>

          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.key} className="flex items-start space-x-3">
                <div className="flex items-center h-9">
                  <input
                    type="checkbox"
                    checked={enabledFields.has(field.key)}
                    onChange={() => handleFieldToggle(field.key)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      value={formData[field.key as keyof BulkEditData] || ''}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      disabled={!enabledFields.has(field.key)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                    >
                      <option value="">Select {field.label}</option>
                      {field.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={formData[field.key as keyof BulkEditData] || ''}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      disabled={!enabledFields.has(field.key)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                      placeholder={enabledFields.has(field.key) ? `Enter ${field.label.toLowerCase()}` : `Select to enable ${field.label.toLowerCase()}`}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={enabledFields.size === 0}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <CheckIcon className="h-4 w-4 mr-2" />
            Update {memberIds.length} Members
          </button>
        </div>
      </div>
    </div>
  )
}