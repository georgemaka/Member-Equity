import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { memberApi } from '@/services/memberApi'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/ui/use-toast'
import * as XLSX from 'xlsx'

interface ValidationError {
  row: number
  field: string
  message: string
}

interface PreviewData {
  memberId: string
  memberName: string
  currentPercentage: number
  newPercentage: number
  change: number
  hasWarning: boolean
  warningMessage?: string
}

export default function EquityExcelUpdate() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [step, setStep] = useState(1) // 1: Download, 2: Upload, 3: Preview, 4: Confirm
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<PreviewData[]>([])
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [notes, setNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const { data: membersData } = useQuery({
    queryKey: ['members', { page: 1, limit: 100 }],
    queryFn: () => memberApi.getMembers({ page: 1, limit: 100 })
  })

  const downloadTemplateMutation = useMutation({
    mutationFn: () => memberApi.exportEquityTemplate(),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `equity-update-template-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: 'Template Downloaded',
        description: 'Fill in the new equity percentages and upload the file',
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to download template',
        variant: 'destructive',
      })
    }
  })

  const createBulkUpdateMutation = useMutation({
    mutationFn: (data: { updates: any[], notes: string }) => 
      memberApi.createBulkEquityUpdate(data.updates, data.notes),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Equity update created successfully',
      })
      queryClient.invalidateQueries({ queryKey: ['members'] })
      navigate('/equity')
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create equity update',
        variant: 'destructive',
      })
    }
  })

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0]
    if (!uploadedFile) return

    setFile(uploadedFile)
    setIsProcessing(true)
    setValidationErrors([])
    setPreviewData([])

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        // Process and validate data
        const errors: ValidationError[] = []
        const preview: PreviewData[] = []
        const memberMap = new Map(membersData?.data.map(m => [m.id, m]))

        jsonData.forEach((row: any, index) => {
          const rowNum = index + 2 // Excel rows start at 1, plus header row
          
          if (!row['Member ID']) {
            errors.push({ row: rowNum, field: 'Member ID', message: 'Member ID is required' })
            return
          }

          const member = memberMap.get(row['Member ID'])
          if (!member) {
            errors.push({ row: rowNum, field: 'Member ID', message: 'Member not found' })
            return
          }

          const newPercentage = parseFloat(row['New Equity %']) || 0
          if (newPercentage < 0 || newPercentage > 100) {
            errors.push({ row: rowNum, field: 'New Equity %', message: 'Percentage must be between 0 and 100' })
            return
          }

          const currentPercentage = parseFloat(member.equityPercentage || '0')
          const change = newPercentage - currentPercentage
          const hasWarning = Math.abs(change) > 10

          preview.push({
            memberId: member.id,
            memberName: `${member.firstName} ${member.lastName}`,
            currentPercentage,
            newPercentage,
            change,
            hasWarning,
            warningMessage: hasWarning ? `Large change of ${change.toFixed(2)}%` : undefined
          })
        })

        setValidationErrors(errors)
        setPreviewData(preview)
        setStep(3) // Move to preview step
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to parse Excel file',
          variant: 'destructive',
        })
      } finally {
        setIsProcessing(false)
      }
    }
    reader.readAsBinaryString(uploadedFile)
  }

  const handleConfirm = () => {
    const updates = previewData.map(p => ({
      memberId: p.memberId,
      estimatedPercentage: p.newPercentage,
      capitalBalance: 0
    }))

    createBulkUpdateMutation.mutate({ updates, notes })
  }

  const totalNew = previewData.reduce((sum, p) => sum + p.newPercentage, 0)
  const hasValidationErrors = validationErrors.length > 0
  const totalWarning = Math.abs(totalNew - 100) > 0.01

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/equity')}
          className="mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Equity Dashboard
        </Button>
        
        <h1 className="text-3xl font-bold text-gray-900">Excel Equity Update</h1>
        <p className="mt-2 text-gray-600">Update member equity percentages using Excel</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <Progress value={(step / 4) * 100} className="mb-4" />
        <div className="flex justify-between text-sm">
          <span className={step >= 1 ? 'text-blue-600 font-medium' : 'text-gray-500'}>1. Download Template</span>
          <span className={step >= 2 ? 'text-blue-600 font-medium' : 'text-gray-500'}>2. Upload File</span>
          <span className={step >= 3 ? 'text-blue-600 font-medium' : 'text-gray-500'}>3. Preview Changes</span>
          <span className={step >= 4 ? 'text-blue-600 font-medium' : 'text-gray-500'}>4. Confirm</span>
        </div>
      </div>

      {/* Step 1: Download Template */}
      {step === 1 && (
        <Card className="p-8 text-center">
          <ArrowDownTrayIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Download Template</h2>
          <p className="text-gray-600 mb-6">
            Download the Excel template with current member equity percentages
          </p>
          <Button 
            onClick={() => {
              downloadTemplateMutation.mutate()
              setStep(2)
            }}
            disabled={downloadTemplateMutation.isPending}
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            {downloadTemplateMutation.isPending ? 'Downloading...' : 'Download Template'}
          </Button>
        </Card>
      )}

      {/* Step 2: Upload File */}
      {step === 2 && (
        <Card className="p-8 text-center">
          <ArrowUpTrayIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Upload Completed Template</h2>
          <p className="text-gray-600 mb-6">
            Upload the Excel file with updated equity percentages
          </p>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button as="span" disabled={isProcessing}>
              <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
              {isProcessing ? 'Processing...' : 'Upload File'}
            </Button>
          </label>
        </Card>
      )}

      {/* Step 3: Preview Changes */}
      {step === 3 && (
        <>
          {hasValidationErrors ? (
            <Alert className="mb-6" variant="destructive">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <div className="ml-3">
                <h3 className="text-sm font-medium">Validation Errors</h3>
                <ul className="mt-2 text-sm list-disc list-inside">
                  {validationErrors.map((error, index) => (
                    <li key={index}>Row {error.row}: {error.field} - {error.message}</li>
                  ))}
                </ul>
              </div>
            </Alert>
          ) : (
            <>
              {totalWarning && (
                <Alert className="mb-6">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium">Total does not equal 100%</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      The new total is {totalNew.toFixed(2)}%. Consider adjusting the values or using pro-rata distribution.
                    </p>
                  </div>
                </Alert>
              )}

              <Card className="mb-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Member
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Current %
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          New %
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Change
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewData.map((item) => (
                        <tr key={item.memberId} className={item.hasWarning ? 'bg-yellow-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{item.memberName}</div>
                            {item.warningMessage && (
                              <div className="text-sm text-yellow-600">{item.warningMessage}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.currentPercentage.toFixed(3)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.newPercentage.toFixed(3)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={item.change > 0 ? 'text-green-600' : item.change < 0 ? 'text-red-600' : 'text-gray-900'}>
                              {item.change > 0 ? '+' : ''}{item.change.toFixed(3)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td className="px-6 py-3 text-sm font-medium text-gray-900">Total</td>
                        <td className="px-6 py-3 text-sm text-gray-900">-</td>
                        <td className="px-6 py-3 text-sm font-medium text-gray-900">{totalNew.toFixed(3)}%</td>
                        <td className="px-6 py-3 text-sm text-gray-900">-</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Card>

              {/* Notes Section */}
              <Card className="p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Board Approval Notes</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter notes about this equity update (e.g., board meeting date, approval details)..."
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </Card>
            </>
          )}

          <div className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => setStep(2)}
            >
              Back
            </Button>
            {!hasValidationErrors && (
              <Button
                onClick={handleConfirm}
                disabled={createBulkUpdateMutation.isPending}
              >
                {createBulkUpdateMutation.isPending ? 'Creating...' : 'Confirm Update'}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  )
}