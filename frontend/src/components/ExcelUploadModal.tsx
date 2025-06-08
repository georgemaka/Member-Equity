import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { UploadResult } from '@/types/member'
import { useToast } from '@/contexts/ToastContext'
import { 
  XMarkIcon, 
  CloudArrowUpIcon, 
  DocumentArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface ExcelUploadModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ExcelUploadModal({ isOpen, onClose }: ExcelUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [skipValidation, setSkipValidation] = useState(false)
  const [dryRun, setDryRun] = useState(true)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const { success, error: showError, warning } = useToast()

  // Mock upload mutation for development
  const uploadMutation = {
    mutate: ({ file, skipValidation, dryRun }: { file: File, skipValidation: boolean, dryRun: boolean }) => {
      // Simulate processing
      setTimeout(() => {
        const mockResult: UploadResult = {
          success: true,
          processedCount: 5,
          createdCount: dryRun ? 0 : 5,
          updatedCount: 0,
          skippedCount: 0,
          errors: [],
          warnings: [
            'Member John Smith already exists - would be updated',
            'Phone number format standardized for Sarah Johnson'
          ]
        }
        
        setUploadResult(mockResult)
        if (!dryRun && mockResult.success) {
          success('Upload Successful', `${mockResult.processedCount} members imported successfully`)
        } else if (dryRun && mockResult.success) {
          success('Validation Complete', `${mockResult.processedCount} members validated successfully`)
        }
        setIsUploading(false)
      }, 2000)
    }
  }

  const handleFileSelect = (selectedFile: File) => {
    // Validate file type
    if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
      showError('Invalid File Type', 'Please select an Excel file (.xlsx or .xls)')
      return
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      showError('File Too Large', 'File size must be less than 10MB')
      return
    }

    setFile(selectedFile)
    setUploadResult(null)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    uploadMutation.mutate({ file, skipValidation, dryRun })
  }

  const handleActualUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setDryRun(false)
    uploadMutation.mutate({ file, skipValidation, dryRun: false })
  }

  const resetModal = () => {
    setFile(null)
    setUploadResult(null)
    setSkipValidation(false)
    setDryRun(true)
    setIsDragOver(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClose = () => {
    if (!isUploading) {
      onClose()
      resetModal()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Upload Members from Excel</h3>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="text-gray-400 hover:text-gray-500 disabled:opacity-50 transition-colors duration-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Upload Area */}
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
              isDragOver
                ? 'border-sukut-400 bg-sukut-50'
                : file
                ? 'border-green-300 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />

            {file ? (
              <div className="space-y-3">
                <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-green-500" />
                <div>
                  <p className="text-lg font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    resetModal()
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                  disabled={isUploading}
                >
                  Choose different file
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Drop your Excel file here, or{' '}
                    <span className="text-sukut-600">browse</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports .xlsx and .xls files up to 10MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Options */}
          {file && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={dryRun}
                    onChange={(e) => setDryRun(e.target.checked)}
                    className="h-4 w-4 text-sukut-600 focus:ring-sukut-500 border-gray-300 rounded"
                    disabled={isUploading}
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Dry run (validate only, don't import)
                  </span>
                </label>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={skipValidation}
                    onChange={(e) => setSkipValidation(e.target.checked)}
                    className="h-4 w-4 text-sukut-600 focus:ring-sukut-500 border-gray-300 rounded"
                    disabled={isUploading}
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Skip validation (force import)
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Upload Result */}
          {uploadResult && (
            <div className={`rounded-lg p-4 border ${
              uploadResult.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {uploadResult.success ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-400" />
                  ) : (
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <h4 className={`text-sm font-medium ${
                    uploadResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {uploadResult.success ? 'Success' : 'Upload Failed'}
                  </h4>
                  <p className={`mt-1 text-sm ${
                    uploadResult.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {uploadResult.message}
                  </p>
                  
                  {uploadResult.processedCount > 0 && (
                    <p className={`mt-1 text-sm ${
                      uploadResult.success ? 'text-green-700' : 'text-red-700'
                    }`}>
                      Processed: {uploadResult.processedCount} members
                    </p>
                  )}

                  {uploadResult.errorCount > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-red-700">
                        Errors: {uploadResult.errorCount}
                      </p>
                      <ul className="mt-1 text-sm text-red-600 list-disc list-inside">
                        {uploadResult.errors.slice(0, 5).map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                        {uploadResult.errors.length > 5 && (
                          <li>... and {uploadResult.errors.length - 5} more errors</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {uploadResult.warnings.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-yellow-700">
                        Warnings: {uploadResult.warnings.length}
                      </p>
                      <ul className="mt-1 text-sm text-yellow-600 list-disc list-inside">
                        {uploadResult.warnings.slice(0, 3).map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                        {uploadResult.warnings.length > 3 && (
                          <li>... and {uploadResult.warnings.length - 3} more warnings</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sukut-500 disabled:opacity-50 transition-all duration-200"
          >
            Cancel
          </button>

          {uploadResult && uploadResult.success && dryRun && (
            <button
              onClick={handleActualUpload}
              disabled={isUploading || !file}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isUploading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Importing...
                </div>
              ) : (
                'Import Members'
              )}
            </button>
          )}

          <button
            onClick={handleUpload}
            disabled={isUploading || !file}
            className="px-4 py-2 text-sm font-medium text-white bg-sukut-600 border border-transparent rounded-lg hover:bg-sukut-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sukut-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isUploading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {dryRun ? 'Validating...' : 'Uploading...'}
              </div>
            ) : (
              dryRun ? 'Validate' : 'Upload'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}