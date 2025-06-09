import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { taxPaymentApi } from '@/services/taxPaymentApi'
import { useFiscalYear } from '@/contexts/FiscalYearContext'
import { useToast } from '@/contexts/ToastContext'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { TaxPaymentUploadResult } from '@/types/taxPayment'
import { 
  XMarkIcon,
  CloudArrowUpIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

interface TaxPaymentUploadModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function TaxPaymentUploadModal({ isOpen, onClose }: TaxPaymentUploadModalProps) {
  useEscapeKey(onClose, isOpen)
  const { currentFiscalYear } = useFiscalYear()
  const { success, error: showError, warning } = useToast()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadResult, setUploadResult] = useState<TaxPaymentUploadResult | null>(null)
  const [showResults, setShowResults] = useState(false)

  const uploadMutation = useMutation({
    mutationFn: (file: File) => taxPaymentApi.uploadTaxPayments(file, currentFiscalYear),
    onSuccess: (result) => {
      setUploadResult(result)
      setShowResults(true)
      queryClient.invalidateQueries({ queryKey: ['tax-dashboard'] })
      
      if (result.success && result.failedRows === 0) {
        success('Upload Complete', `Successfully imported ${result.successfulRows} tax payments`)
      } else if (result.successfulRows > 0) {
        warning('Upload Completed with Issues', `Imported ${result.successfulRows} payments, ${result.failedRows} failed`)
      } else {
        showError('Upload Failed', 'No payments were imported. Please check the file format.')
      }
    },
    onError: (error) => {
      showError('Upload Failed', error.message)
    }
  })

  const downloadTemplateMutation = useMutation({
    mutationFn: () => taxPaymentApi.downloadUploadTemplate(),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'tax-payment-upload-template.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      success('Template Downloaded', 'Tax payment upload template has been downloaded')
    },
    onError: (error) => {
      showError('Download Failed', 'Failed to download template')
    }
  })

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
      handleFileSelection(files[0])
    }
  }

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelection(files[0])
    }
  }

  const handleFileSelection = (file: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ]
    
    if (!validTypes.includes(file.type)) {
      showError('Invalid File Type', 'Please select an Excel file (.xlsx, .xls) or CSV file')
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      showError('File Too Large', 'File size must be less than 10MB')
      return
    }

    setSelectedFile(file)
    setUploadResult(null)
    setShowResults(false)
  }

  const handleUpload = () => {
    if (!selectedFile) return
    uploadMutation.mutate(selectedFile)
  }

  const handleClose = () => {
    if (!uploadMutation.isLoading) {
      setSelectedFile(null)
      setUploadResult(null)
      setShowResults(false)
      onClose()
    }
  }

  const resetForm = () => {
    setSelectedFile(null)
    setUploadResult(null)
    setShowResults(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Upload Tax Payments</h3>
          <button
            onClick={handleClose}
            disabled={uploadMutation.isLoading}
            className="text-gray-400 hover:text-gray-500 disabled:opacity-50 transition-colors duration-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {!showResults ? (
            <>
              {/* Instructions */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-2">Upload Instructions:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Members will be identified by SSN, Tax ID, or Employee ID</li>
                      <li>Each row should contain a member identifier and payment details</li>
                      <li>Download the template below for the correct format</li>
                      <li>Supported formats: Excel (.xlsx, .xls) and CSV files</li>
                      <li>Duplicate payments will be detected and skipped</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Template Download */}
              <div className="mb-6">
                <button
                  onClick={() => downloadTemplateMutation.mutate()}
                  disabled={downloadTemplateMutation.isLoading}
                  className="inline-flex items-center px-4 py-2 border border-emerald-300 text-sm font-medium rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors duration-200"
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  {downloadTemplateMutation.isLoading ? 'Downloading...' : 'Download Template'}
                </button>
              </div>

              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-200 ${
                  isDragOver
                    ? 'border-emerald-400 bg-emerald-50'
                    : selectedFile
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileInput}
                  className="hidden"
                />
                
                <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                
                {selectedFile ? (
                  <div>
                    <p className="text-lg font-medium text-gray-900 mb-2">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500 mb-4">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type}
                    </p>
                    <div className="space-x-3">
                      <button
                        onClick={handleUpload}
                        disabled={uploadMutation.isLoading}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        {uploadMutation.isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          'Upload File'
                        )}
                      </button>
                      <button
                        onClick={resetForm}
                        disabled={uploadMutation.isLoading}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors duration-200"
                      >
                        Choose Different File
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      Drop your file here, or{' '}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-emerald-600 hover:text-emerald-500 underline"
                      >
                        browse
                      </button>
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports Excel (.xlsx, .xls) and CSV files up to 10MB
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Upload Results */
            <div className="space-y-6">
              {/* Summary */}
              <div className={`rounded-lg p-4 ${
                uploadResult?.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center mb-3">
                  {uploadResult?.success ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                  ) : (
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
                  )}
                  <h4 className={`text-sm font-medium ${
                    uploadResult?.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    Upload {uploadResult?.success ? 'Completed' : 'Failed'}
                  </h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Rows:</span>
                    <div className="font-semibold text-gray-900">{uploadResult?.totalRows || 0}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Successful:</span>
                    <div className="font-semibold text-green-600">{uploadResult?.successfulRows || 0}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Failed:</span>
                    <div className="font-semibold text-red-600">{uploadResult?.failedRows || 0}</div>
                  </div>
                </div>
              </div>

              {/* Errors */}
              {uploadResult?.errors && uploadResult.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-red-900 mb-3">Errors</h4>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {uploadResult.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-700">
                        <span className="font-medium">Row {error.row}:</span> {error.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {uploadResult?.warnings && uploadResult.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-yellow-900 mb-3">Warnings</h4>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {uploadResult.warnings.map((warning, index) => (
                      <div key={index} className="text-sm text-yellow-700">
                        <span className="font-medium">Row {warning.row}:</span> {warning.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Duplicates */}
              {uploadResult?.duplicatePayments && uploadResult.duplicatePayments.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-3">Duplicate Payments Skipped</h4>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {uploadResult.duplicatePayments.map((duplicate, index) => (
                      <div key={index} className="text-sm text-blue-700">
                        <span className="font-medium">Row {duplicate.row}:</span> {duplicate.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowResults(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200"
                >
                  Upload Another File
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}