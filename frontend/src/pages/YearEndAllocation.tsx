import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { financialsApi } from '@/services/financialsApi'
import { memberApi } from '@/services/memberApi'
import { useFiscalYear } from '@/contexts/FiscalYearContext'
import { useToast } from '@/contexts/ToastContext'
import { 
  CompanyFinancials,
  CreateCompanyFinancialsDto,
  UpdateCompanyFinancialsDto,
  AllocationPreview,
  BalanceSheetReconciliation,
  ALLOCATION_STEPS,
  SOFR_RATE_SOURCES
} from '@/types/financials'
import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  CalculatorIcon,
  DocumentArrowDownIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

type AllocationStep = 'setup' | 'preview' | 'allocate' | 'reconcile' | 'complete'

export default function YearEndAllocation() {
  const { currentFiscalYear } = useFiscalYear()
  const { success, error: showError, warning } = useToast()
  const queryClient = useQueryClient()
  
  const [currentStep, setCurrentStep] = useState<AllocationStep>('setup')
  const [formData, setFormData] = useState({
    netIncome: '',
    accruals: '',
    adjustments: '',
    sofrRate: '',
    sofrSource: 'Federal Reserve Bank of New York',
    sofrPeriod: `FY ${currentFiscalYear} Annual Average`,
    totalEquityBalanceSheet: '',
    notes: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch existing financial data
  const { data: existingFinancials, isLoading: loadingFinancials } = useQuery({
    queryKey: ['company-financials', currentFiscalYear],
    queryFn: () => financialsApi.getCompanyFinancials(currentFiscalYear)
  })

  // Fetch members for allocation preview
  const { data: membersData } = useQuery({
    queryKey: ['members', currentFiscalYear],
    queryFn: () => memberApi.getMembersForYear(currentFiscalYear)
  })

  // Fetch allocation preview
  const { data: allocationPreview, isLoading: loadingPreview } = useQuery({
    queryKey: ['allocation-preview', currentFiscalYear],
    queryFn: () => financialsApi.previewAllocation(currentFiscalYear),
    enabled: currentStep === 'preview' && !!existingFinancials
  })

  // Fetch balance sheet reconciliation
  const { data: reconciliation, isLoading: loadingReconciliation } = useQuery({
    queryKey: ['balance-sheet-reconciliation', currentFiscalYear],
    queryFn: () => financialsApi.getBalanceSheetReconciliation(currentFiscalYear),
    enabled: currentStep === 'reconcile'
  })

  // Create/Update financials mutation
  const saveFinancialsMutation = useMutation({
    mutationFn: (data: CreateCompanyFinancialsDto | UpdateCompanyFinancialsDto) => {
      if (existingFinancials) {
        return financialsApi.updateCompanyFinancials(currentFiscalYear, data)
      } else {
        return financialsApi.createCompanyFinancials(data as CreateCompanyFinancialsDto)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-financials', currentFiscalYear] })
      success('Financial Data Saved', 'Company financial data has been saved successfully')
      setCurrentStep('preview')
    },
    onError: (error) => {
      showError('Save Failed', error.message)
    }
  })

  // Process allocation mutation
  const processAllocationMutation = useMutation({
    mutationFn: () => financialsApi.processAllocation(currentFiscalYear),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      queryClient.invalidateQueries({ queryKey: ['company-financials'] })
      success('Allocation Complete', `${result.allocationsCreated} member allocations have been processed`)
      setCurrentStep('reconcile')
    },
    onError: (error) => {
      showError('Allocation Failed', error.message)
    }
  })

  // Perform reconciliation mutation
  const reconcileMutation = useMutation({
    mutationFn: () => financialsApi.performReconciliation(currentFiscalYear),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['balance-sheet-reconciliation', currentFiscalYear] })
      if (result.reconciliation.isReconciled) {
        success('Reconciliation Complete', 'Balance sheet has been successfully reconciled')
        setCurrentStep('complete')
      } else {
        warning('Reconciliation Issues', 'There are differences that need to be resolved')
      }
    },
    onError: (error) => {
      showError('Reconciliation Failed', error.message)
    }
  })

  // Initialize form data from existing financials
  useEffect(() => {
    if (existingFinancials) {
      setFormData({
        netIncome: existingFinancials.netIncome.toString(),
        accruals: existingFinancials.accruals.toString(),
        adjustments: existingFinancials.adjustments.toString(),
        sofrRate: existingFinancials.sofrRate.toString(),
        sofrSource: existingFinancials.sofrSource || 'Federal Reserve Bank of New York',
        sofrPeriod: existingFinancials.sofrPeriod || `FY ${currentFiscalYear} Annual Average`,
        totalEquityBalanceSheet: existingFinancials.totalEquityBalanceSheet.toString(),
        notes: existingFinancials.notes || ''
      })

      // Determine current step based on existing data
      if (existingFinancials.isAllocated && existingFinancials.isReconciled) {
        setCurrentStep('complete')
      } else if (existingFinancials.isAllocated) {
        setCurrentStep('reconcile')
      } else {
        setCurrentStep('preview')
      }
    }
  }, [existingFinancials, currentFiscalYear])

  const validateSetupForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.netIncome.trim()) {
      newErrors.netIncome = 'Net income is required'
    } else if (isNaN(parseFloat(formData.netIncome))) {
      newErrors.netIncome = 'Net income must be a valid number'
    }

    if (!formData.accruals.trim()) {
      newErrors.accruals = 'Accruals amount is required'
    } else if (isNaN(parseFloat(formData.accruals))) {
      newErrors.accruals = 'Accruals must be a valid number'
    }

    if (!formData.adjustments.trim()) {
      newErrors.adjustments = 'Adjustments amount is required'
    } else if (isNaN(parseFloat(formData.adjustments))) {
      newErrors.adjustments = 'Adjustments must be a valid number'
    }

    if (!formData.sofrRate.trim()) {
      newErrors.sofrRate = 'SOFR rate is required'
    } else {
      const rate = parseFloat(formData.sofrRate)
      if (isNaN(rate) || rate < 0 || rate > 20) {
        newErrors.sofrRate = 'SOFR rate must be between 0% and 20%'
      }
    }

    if (!formData.totalEquityBalanceSheet.trim()) {
      newErrors.totalEquityBalanceSheet = 'Total equity from balance sheet is required'
    } else if (isNaN(parseFloat(formData.totalEquityBalanceSheet))) {
      newErrors.totalEquityBalanceSheet = 'Total equity must be a valid number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveFinancials = () => {
    if (!validateSetupForm()) return

    const data = {
      fiscalYear: currentFiscalYear,
      netIncome: parseFloat(formData.netIncome),
      accruals: parseFloat(formData.accruals),
      adjustments: parseFloat(formData.adjustments),
      sofrRate: parseFloat(formData.sofrRate),
      sofrSource: formData.sofrSource,
      sofrPeriod: formData.sofrPeriod,
      totalEquityBalanceSheet: parseFloat(formData.totalEquityBalanceSheet),
      notes: formData.notes.trim() || undefined
    }

    saveFinancialsMutation.mutate(data)
  }

  const finalAllocableAmount = formData.netIncome && formData.accruals && formData.adjustments
    ? parseFloat(formData.netIncome) + parseFloat(formData.accruals) + parseFloat(formData.adjustments)
    : 0

  const stepIndex = ALLOCATION_STEPS.findIndex(step => step.key === currentStep)

  const handleExportAllocation = async () => {
    try {
      const blob = await financialsApi.exportAllocationReport(currentFiscalYear)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `year-end-allocation-fy${currentFiscalYear}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      success('Export Complete', 'Year-end allocation report downloaded successfully')
    } catch (error) {
      showError('Export Failed', 'Failed to download allocation report')
    }
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 px-6 py-8 mb-8">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:flex-auto">
              <h1 className="text-3xl font-bold text-white">Year-End Allocation</h1>
              <p className="mt-2 text-indigo-100">
                FY {currentFiscalYear} Net Income Allocation Process
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-2">
              {currentStep === 'complete' && (
                <button
                  onClick={handleExportAllocation}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-lg text-indigo-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200 transform hover:scale-105"
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  Export Report
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          {ALLOCATION_STEPS.map((step, index) => (
            <div key={step.key} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                index <= stepIndex 
                  ? 'bg-indigo-600 border-indigo-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-500'
              }`}>
                {index < stepIndex ? (
                  <CheckCircleIcon className="h-6 w-6" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <div className="ml-3">
                <div className={`text-sm font-medium ${
                  index <= stepIndex ? 'text-indigo-600' : 'text-gray-500'
                }`}>
                  {step.label}
                </div>
                <div className="text-xs text-gray-500">{step.description}</div>
              </div>
              {index < ALLOCATION_STEPS.length - 1 && (
                <div className={`mx-8 h-0.5 w-16 ${
                  index < stepIndex ? 'bg-indigo-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white shadow-xl rounded-xl border border-gray-100">
        {/* Setup Step */}
        {currentStep === 'setup' && (
          <div className="p-8">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Company Financial Data</h3>
              <p className="text-sm text-gray-600">
                Enter the net income, accruals, adjustments, and SOFR rate for FY {currentFiscalYear}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Financial Inputs */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Net Income *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.netIncome}
                      onChange={(e) => setFormData(prev => ({ ...prev, netIncome: e.target.value }))}
                      className={`block w-full border rounded-lg pl-8 pr-3 py-3 text-sm focus:outline-none focus:ring-2 ${
                        errors.netIncome
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.netIncome && (
                    <p className="mt-1 text-sm text-red-600">{errors.netIncome}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Accruals *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.accruals}
                      onChange={(e) => setFormData(prev => ({ ...prev, accruals: e.target.value }))}
                      className={`block w-full border rounded-lg pl-8 pr-3 py-3 text-sm focus:outline-none focus:ring-2 ${
                        errors.accruals
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.accruals && (
                    <p className="mt-1 text-sm text-red-600">{errors.accruals}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adjustments *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.adjustments}
                      onChange={(e) => setFormData(prev => ({ ...prev, adjustments: e.target.value }))}
                      className={`block w-full border rounded-lg pl-8 pr-3 py-3 text-sm focus:outline-none focus:ring-2 ${
                        errors.adjustments
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.adjustments && (
                    <p className="mt-1 text-sm text-red-600">{errors.adjustments}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Equity (Balance Sheet) *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.totalEquityBalanceSheet}
                      onChange={(e) => setFormData(prev => ({ ...prev, totalEquityBalanceSheet: e.target.value }))}
                      className={`block w-full border rounded-lg pl-8 pr-3 py-3 text-sm focus:outline-none focus:ring-2 ${
                        errors.totalEquityBalanceSheet
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.totalEquityBalanceSheet && (
                    <p className="mt-1 text-sm text-red-600">{errors.totalEquityBalanceSheet}</p>
                  )}
                </div>
              </div>

              {/* SOFR and Summary */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Annual Average SOFR Rate * (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      max="20"
                      value={formData.sofrRate}
                      onChange={(e) => setFormData(prev => ({ ...prev, sofrRate: e.target.value }))}
                      className={`block w-full border rounded-lg px-3 py-3 pr-8 text-sm focus:outline-none focus:ring-2 ${
                        errors.sofrRate
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                      }`}
                      placeholder="5.25"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">%</span>
                    </div>
                  </div>
                  {errors.sofrRate && (
                    <p className="mt-1 text-sm text-red-600">{errors.sofrRate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SOFR Rate Source
                  </label>
                  <select
                    value={formData.sofrSource}
                    onChange={(e) => setFormData(prev => ({ ...prev, sofrSource: e.target.value }))}
                    className="block w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {SOFR_RATE_SOURCES.map((source) => (
                      <option key={source} value={source}>
                        {source}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SOFR Period
                  </label>
                  <input
                    type="text"
                    value={formData.sofrPeriod}
                    onChange={(e) => setFormData(prev => ({ ...prev, sofrPeriod: e.target.value }))}
                    className="block w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="FY 2024 Annual Average"
                  />
                </div>

                {/* Calculation Summary */}
                {finalAllocableAmount > 0 && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <CalculatorIcon className="h-5 w-5 text-indigo-600 mr-2" />
                      <h4 className="text-sm font-medium text-indigo-900">Final Allocable Amount</h4>
                    </div>
                    <div className="space-y-1 text-sm text-indigo-700">
                      <div className="flex justify-between">
                        <span>Net Income:</span>
                        <span>${parseFloat(formData.netIncome || '0').toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Accruals:</span>
                        <span>${parseFloat(formData.accruals || '0').toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Adjustments:</span>
                        <span>${parseFloat(formData.adjustments || '0').toLocaleString()}</span>
                      </div>
                      <hr className="border-indigo-300" />
                      <div className="flex justify-between font-semibold">
                        <span>Total to Allocate:</span>
                        <span>${finalAllocableAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="block w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Additional notes about the year-end allocation..."
              />
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSaveFinancials}
                disabled={saveFinancialsMutation.isLoading}
                className="px-6 py-3 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {saveFinancialsMutation.isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  'Save & Continue to Preview'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Preview Step */}
        {currentStep === 'preview' && (
          <div className="p-8">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Allocation Preview</h3>
              <p className="text-sm text-gray-600">
                Review how the final allocable amount will be distributed to each member based on their equity percentage
              </p>
            </div>

            {existingFinancials && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      ${existingFinancials.finalAllocableAmount.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">Total to Allocate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {allocationPreview?.length || 0}
                    </div>
                    <div className="text-sm text-gray-500">Members</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {existingFinancials.sofrRate}%
                    </div>
                    <div className="text-sm text-gray-500">SOFR Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      ${(existingFinancials.finalAllocableAmount / (allocationPreview?.length || 1)).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">Average Allocation</div>
                  </div>
                </div>
              </div>
            )}

            {loadingPreview ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Calculating allocations...</p>
              </div>
            ) : allocationPreview && allocationPreview.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Member
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Equity %
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Capital Balance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Allocation Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        New Capital Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allocationPreview.map((allocation) => (
                      <tr key={allocation.member.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {allocation.member.firstName} {allocation.member.lastName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {allocation.member.equityPercentage}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${allocation.member.currentCapitalBalance.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-green-600">
                            +${allocation.allocationAmount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          ${allocation.newCapitalBalance.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-500">No allocation preview available</p>
              </div>
            )}

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setCurrentStep('setup')}
                className="px-6 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
              >
                Back to Setup
              </button>
              <button
                onClick={() => processAllocationMutation.mutate()}
                disabled={processAllocationMutation.isLoading || !allocationPreview?.length}
                className="px-6 py-3 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {processAllocationMutation.isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  'Process Allocation'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Reconcile Step */}
        {currentStep === 'reconcile' && (
          <div className="p-8">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Balance Sheet Reconciliation</h3>
              <p className="text-sm text-gray-600">
                Ensure the system capital account totals match your balance sheet equity amounts
              </p>
            </div>

            {loadingReconciliation ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading reconciliation data...</p>
              </div>
            ) : reconciliation ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-3">Balance Sheet</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Total Equity:</span>
                        <span className="font-semibold text-blue-900">
                          ${reconciliation.totalEquityPerBalanceSheet.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Member Capital:</span>
                        <span className="font-semibold text-blue-900">
                          ${reconciliation.memberCapitalAccounts.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Retained Earnings:</span>
                        <span className="font-semibold text-blue-900">
                          ${reconciliation.retainedEarnings.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-green-900 mb-3">System Calculated</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-green-700">Total Members Capital:</span>
                        <span className="font-semibold text-green-900">
                          ${reconciliation.calculatedMemberCapitalTotal.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">System Retained:</span>
                        <span className="font-semibold text-green-900">
                          ${reconciliation.systemRetainedEarnings.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Additional Capital:</span>
                        <span className="font-semibold text-green-900">
                          ${reconciliation.systemAdditionalCapital.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Differences */}
                <div className={`border rounded-lg p-4 ${
                  reconciliation.isReconciled 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center mb-3">
                    {reconciliation.isReconciled ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                    ) : (
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
                    )}
                    <h4 className={`text-sm font-medium ${
                      reconciliation.isReconciled ? 'text-green-900' : 'text-red-900'
                    }`}>
                      {reconciliation.isReconciled ? 'Reconciled' : 'Reconciliation Differences'}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Capital Accounts:</span>
                      <div className={`font-semibold ${
                        Math.abs(reconciliation.capitalAccountsDifference) < 0.01 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        ${reconciliation.capitalAccountsDifference.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Retained Earnings:</span>
                      <div className={`font-semibold ${
                        Math.abs(reconciliation.retainedEarningsDifference) < 0.01 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        ${reconciliation.retainedEarningsDifference.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Difference:</span>
                      <div className={`font-semibold ${
                        Math.abs(reconciliation.totalDifference) < 0.01 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        ${reconciliation.totalDifference.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-500">No reconciliation data available</p>
              </div>
            )}

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setCurrentStep('preview')}
                className="px-6 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
              >
                Back to Preview
              </button>
              <button
                onClick={() => reconcileMutation.mutate()}
                disabled={reconcileMutation.isLoading}
                className="px-6 py-3 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {reconcileMutation.isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Reconciling...
                  </div>
                ) : (
                  'Perform Reconciliation'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Complete Step */}
        {currentStep === 'complete' && (
          <div className="p-8 text-center">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              Year-End Allocation Complete
            </h3>
            <p className="text-gray-600 mb-8">
              FY {currentFiscalYear} net income allocation has been successfully processed and reconciled.
            </p>

            {existingFinancials && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-green-900">
                      ${existingFinancials.finalAllocableAmount.toLocaleString()}
                    </div>
                    <div className="text-sm text-green-700">Total Allocated</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-900">
                      {membersData?.data?.length || 0}
                    </div>
                    <div className="text-sm text-green-700">Members</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-900">
                      {existingFinancials.sofrRate}%
                    </div>
                    <div className="text-sm text-green-700">SOFR Rate</div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-center space-x-4">
              <button
                onClick={handleExportAllocation}
                className="px-6 py-3 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
              >
                <DocumentArrowDownIcon className="h-5 w-5 mr-2 inline" />
                Export Allocation Report
              </button>
              <button
                onClick={() => setCurrentStep('setup')}
                className="px-6 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
              >
                View Setup Details
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}