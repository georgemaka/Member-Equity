import { useState, useEffect } from 'react'
import { useFiscalYear } from '@/contexts/FiscalYearContext'
import { useToast } from '@/contexts/ToastContext'
import PageContainer from '@/components/PageContainer'
import { 
  useMockCompanyFinancials,
  useMockAllocationPreview,
  useMockBalanceSheetReconciliation,
  useMockHistoricalFinancials,
  useMockAllocationSummary
} from '@/hooks/useMockFinancialsData'
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
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  InformationCircleIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  PresentationChartLineIcon,
  ScaleIcon,
  BanknotesIcon,
  UserGroupIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart
} from 'recharts'

type AllocationStep = 'setup' | 'preview' | 'allocate' | 'reconcile' | 'complete'

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444']

export default function YearEndAllocation() {
  const { currentFiscalYear } = useFiscalYear()
  const { success, error: showError, warning, info } = useToast()
  
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
  const [showHistoricalComparison, setShowHistoricalComparison] = useState(false)
  const [showBulkAdjustments, setShowBulkAdjustments] = useState(false)
  const [selectedMembersForAdjustment, setSelectedMembersForAdjustment] = useState<Set<string>>(new Set())
  const [adjustmentPercentage, setAdjustmentPercentage] = useState('')

  // Fetch mock data
  const { data: existingFinancials, isLoading: loadingFinancials } = useMockCompanyFinancials(currentFiscalYear)
  const { data: historicalFinancials } = useMockHistoricalFinancials(5)
  const { data: allocationPreview, isLoading: loadingPreview } = useMockAllocationPreview(
    currentFiscalYear, 
    currentStep === 'preview' && (!!existingFinancials || (formData.netIncome && formData.accruals && formData.adjustments && formData.sofrRate))
  )
  const { data: reconciliation, isLoading: loadingReconciliation } = useMockBalanceSheetReconciliation(
    currentFiscalYear,
    currentStep === 'reconcile'
  )
  const { data: allocationSummary } = useMockAllocationSummary(currentFiscalYear)

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
    } else {
      // No existing financials - ensure we start at setup step
      setCurrentStep('setup')
      
      // Initialize form with default values if not already set
      setFormData(prev => ({
        netIncome: prev.netIncome || '',
        accruals: prev.accruals || '',
        adjustments: prev.adjustments || '',
        sofrRate: prev.sofrRate || '',
        sofrSource: prev.sofrSource || 'Federal Reserve Bank of New York',
        sofrPeriod: prev.sofrPeriod || `FY ${currentFiscalYear} Annual Average`,
        totalEquityBalanceSheet: prev.totalEquityBalanceSheet || '',
        notes: prev.notes || ''
      }))
    }
  }, [existingFinancials, currentFiscalYear])

  const validateSetupForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Parse numeric values by removing commas first
    const netIncome = parseFormattedNumber(formData.netIncome)
    const accruals = parseFormattedNumber(formData.accruals)
    const adjustments = parseFormattedNumber(formData.adjustments)
    const totalEquity = parseFormattedNumber(formData.totalEquityBalanceSheet)

    if (!formData.netIncome.trim()) {
      newErrors.netIncome = 'Net income is required'
    } else if (isNaN(parseFloat(netIncome))) {
      newErrors.netIncome = 'Net income must be a valid number'
    }

    if (!formData.accruals.trim()) {
      newErrors.accruals = 'Accruals amount is required'
    } else if (isNaN(parseFloat(accruals))) {
      newErrors.accruals = 'Accruals must be a valid number'
    }

    if (!formData.adjustments.trim()) {
      newErrors.adjustments = 'Adjustments amount is required'
    } else if (isNaN(parseFloat(adjustments))) {
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
    } else if (isNaN(parseFloat(totalEquity))) {
      newErrors.totalEquityBalanceSheet = 'Total equity must be a valid number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveFinancials = () => {
    if (!validateSetupForm()) return
    
    // Simulate saving
    success('Financial Data Saved', 'Company financial data has been saved successfully')
    setCurrentStep('preview')
  }

  const handleProcessAllocation = () => {
    // Simulate processing
    success('Allocation Complete', `${allocationPreview?.length || 0} member allocations have been processed`)
    setCurrentStep('reconcile')
  }

  const handleReconcile = () => {
    // Simulate reconciliation
    if (reconciliation?.isReconciled) {
      success('Reconciliation Complete', 'Balance sheet has been successfully reconciled')
      setCurrentStep('complete')
    } else {
      warning('Reconciliation Issues', 'There are differences that need to be resolved')
    }
  }

  const handleBulkAdjustment = () => {
    if (!adjustmentPercentage || selectedMembersForAdjustment.size === 0) {
      showError('Invalid Adjustment', 'Please select members and enter an adjustment percentage')
      return
    }
    
    const adjustment = parseFloat(adjustmentPercentage)
    info('Bulk Adjustment Applied', `${selectedMembersForAdjustment.size} members adjusted by ${adjustment}%`)
    setShowBulkAdjustments(false)
    setSelectedMembersForAdjustment(new Set())
    setAdjustmentPercentage('')
  }

  // Helper functions for number formatting
  const formatNumberWithCommas = (value: string): string => {
    // Remove existing commas and non-numeric characters except decimal point
    const numericValue = value.replace(/[^\d.-]/g, '')
    
    // Split by decimal point
    const parts = numericValue.split('.')
    
    // Add commas to the integer part
    if (parts[0]) {
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }
    
    // Rejoin with decimal if it exists
    return parts.join('.')
  }

  const parseFormattedNumber = (value: string): string => {
    // Remove commas for calculation purposes
    return value.replace(/,/g, '')
  }

  const handleNumberInput = (field: string, value: string) => {
    // Store the raw value (without commas) for calculations
    const rawValue = parseFormattedNumber(value)
    setFormData(prev => ({ ...prev, [field]: rawValue }))
  }

  const finalAllocableAmount = formData.netIncome && formData.accruals && formData.adjustments
    ? parseFloat(parseFormattedNumber(formData.netIncome)) + parseFloat(parseFormattedNumber(formData.accruals)) + parseFloat(parseFormattedNumber(formData.adjustments))
    : 0

  const stepIndex = ALLOCATION_STEPS.findIndex(step => step.key === currentStep)

  const handleExportAllocation = async () => {
    // Simulate export
    success('Export Complete', 'Year-end allocation report downloaded successfully')
  }

  const handleStartNewAllocation = () => {
    // Reset form data to initial state
    setFormData({
      netIncome: '',
      accruals: '',
      adjustments: '',
      sofrRate: '',
      sofrSource: 'Federal Reserve Bank of New York',
      sofrPeriod: `FY ${currentFiscalYear} Annual Average`,
      totalEquityBalanceSheet: '',
      notes: ''
    })
    
    // Clear any errors
    setErrors({})
    
    // Reset to setup step
    setCurrentStep('setup')
    
    // Clear any bulk adjustment selections
    setSelectedMembersForAdjustment(new Set())
    setAdjustmentPercentage('')
    setShowBulkAdjustments(false)
    setShowHistoricalComparison(false)
    
    success('New Allocation Started', 'Form has been reset for a new allocation process')
  }

  const handleStepNavigation = (step: AllocationStep) => {
    // Determine if step is accessible based on current progress
    const targetStepIndex = ALLOCATION_STEPS.findIndex(s => s.key === step)
    const currentStepIndex = ALLOCATION_STEPS.findIndex(s => s.key === currentStep)
    
    // Always allow going back to previous steps
    if (targetStepIndex <= currentStepIndex) {
      setCurrentStep(step)
      return
    }
    
    // For forward navigation, check prerequisites
    switch (step) {
      case 'preview':
        if (!formData.netIncome || !formData.accruals || !formData.adjustments || !formData.sofrRate) {
          showError('Missing Data', 'Please complete the setup step before proceeding to preview')
          return
        }
        break
      case 'reconcile':
        if (!allocationPreview || allocationPreview.length === 0) {
          showError('No Allocations', 'Please process allocations before proceeding to reconciliation')
          return
        }
        break
      case 'complete':
        if (!reconciliation?.isReconciled) {
          showError('Not Reconciled', 'Please complete reconciliation before finishing the process')
          return
        }
        break
    }
    
    setCurrentStep(step)
    info('Step Navigation', `Navigated to ${ALLOCATION_STEPS.find(s => s.key === step)?.label}`)
  }

  // Prepare historical comparison data
  const historicalComparisonData = historicalFinancials.map(f => ({
    year: f.fiscalYear,
    netIncome: f.netIncome,
    allocableAmount: f.finalAllocableAmount,
    sofrRate: f.sofrRate
  }))

  // Prepare allocation distribution data for pie chart
  const allocationDistributionData = allocationPreview?.slice(0, 7).map(a => ({
    name: `${a.member.firstName} ${a.member.lastName}`,
    value: a.allocationAmount,
    percentage: a.member.equityPercentage
  })) || []

  if (allocationPreview && allocationPreview.length > 7) {
    const othersAmount = allocationPreview.slice(7).reduce((sum, a) => sum + a.allocationAmount, 0)
    const othersPercentage = allocationPreview.slice(7).reduce((sum, a) => sum + a.member.equityPercentage, 0)
    allocationDistributionData.push({
      name: 'Others',
      value: othersAmount,
      percentage: othersPercentage
    })
  }

  // Prepare reconciliation comparison data
  const reconciliationData = reconciliation ? [
    {
      name: 'Member Capital',
      balanceSheet: reconciliation.memberCapitalAccounts,
      system: reconciliation.calculatedMemberCapitalTotal,
      difference: reconciliation.capitalAccountsDifference
    },
    {
      name: 'Retained Earnings',
      balanceSheet: reconciliation.retainedEarnings,
      system: reconciliation.systemRetainedEarnings,
      difference: reconciliation.retainedEarningsDifference
    },
    {
      name: 'Additional Capital',
      balanceSheet: reconciliation.additionalPaidInCapital,
      system: reconciliation.systemAdditionalCapital,
      difference: 0
    }
  ] : []

  return (
    <PageContainer fullWidth>
      {/* Header with gradient background */}
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
              <button
                onClick={() => setShowHistoricalComparison(!showHistoricalComparison)}
                className="inline-flex items-center px-3 py-2 border border-white/20 shadow-sm text-sm leading-4 font-medium rounded-lg text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200"
              >
                <ChartBarIcon className="h-4 w-4 mr-2" />
                Historical View
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Comparison Panel */}
      {showHistoricalComparison && historicalFinancials.length > 0 && (
        <div className="bg-white shadow-xl rounded-xl border border-gray-100 mb-8 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Historical Comparison</h3>
            <p className="text-sm text-gray-600">Net income and allocation trends over the past 5 years</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Net Income & Allocable Amount Trend</h4>
              <ResponsiveContainer width="100%" height={250}>
                <ComposedChart data={historicalComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="year" stroke="#6b7280" />
                  <YAxis yAxisId="left" stroke="#6b7280" tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                  <YAxis yAxisId="right" orientation="right" stroke="#6b7280" tickFormatter={(value) => `${value}%`} />
                  <Tooltip 
                    formatter={(value: any, name: string) => {
                      if (name === 'SOFR Rate') return `${value}%`
                      return `$${value.toLocaleString()}`
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="netIncome" fill="#6366f1" name="Net Income" />
                  <Bar yAxisId="left" dataKey="allocableAmount" fill="#8b5cf6" name="Allocable Amount" />
                  <Line yAxisId="right" type="monotone" dataKey="sofrRate" stroke="#ec4899" name="SOFR Rate" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700">Key Metrics</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-indigo-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-indigo-900">
                    {historicalFinancials.length > 1 ? (
                      `${(((historicalFinancials[0].netIncome - historicalFinancials[1].netIncome) / historicalFinancials[1].netIncome) * 100).toFixed(1)}%`
                    ) : 'N/A'}
                  </div>
                  <div className="text-sm text-indigo-700">YoY Growth</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-900">
                    ${(historicalFinancials.reduce((sum, f) => sum + f.netIncome, 0) / historicalFinancials.length / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-sm text-purple-700">5-Year Average</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          {ALLOCATION_STEPS.map((step, index) => (
            <div key={step.key} className="flex items-center">
              <button
                onClick={() => handleStepNavigation(step.key as AllocationStep)}
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  index <= stepIndex 
                    ? 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700' 
                    : 'bg-white border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600'
                }`}
                title={`Go to ${step.label}`}
              >
                {index < stepIndex ? (
                  <CheckCircleIcon className="h-6 w-6" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </button>
              <button
                onClick={() => handleStepNavigation(step.key as AllocationStep)}
                className="ml-3 text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded p-1 hover:bg-gray-50 transition-colors"
                title={`Go to ${step.label}`}
              >
                <div className={`text-sm font-medium ${
                  index <= stepIndex ? 'text-indigo-600' : 'text-gray-500'
                }`}>
                  {step.label}
                </div>
                <div className="text-xs text-gray-500">{step.description}</div>
              </button>
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
                      type="text"
                      value={formatNumberWithCommas(formData.netIncome)}
                      onChange={(e) => handleNumberInput('netIncome', e.target.value)}
                      className={`block w-full border rounded-lg pl-8 pr-3 py-3 text-sm focus:outline-none focus:ring-2 ${
                        errors.netIncome
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                      }`}
                      placeholder="1,000,000.00"
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
                      type="text"
                      value={formatNumberWithCommas(formData.accruals)}
                      onChange={(e) => handleNumberInput('accruals', e.target.value)}
                      className={`block w-full border rounded-lg pl-8 pr-3 py-3 text-sm focus:outline-none focus:ring-2 ${
                        errors.accruals
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                      }`}
                      placeholder="1,000,000.00"
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
                      type="text"
                      value={formatNumberWithCommas(formData.adjustments)}
                      onChange={(e) => handleNumberInput('adjustments', e.target.value)}
                      className={`block w-full border rounded-lg pl-8 pr-3 py-3 text-sm focus:outline-none focus:ring-2 ${
                        errors.adjustments
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                      }`}
                      placeholder="1,000,000.00"
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
                      type="text"
                      value={formatNumberWithCommas(formData.totalEquityBalanceSheet)}
                      onChange={(e) => handleNumberInput('totalEquityBalanceSheet', e.target.value)}
                      className={`block w-full border rounded-lg pl-8 pr-3 py-3 text-sm focus:outline-none focus:ring-2 ${
                        errors.totalEquityBalanceSheet
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                      }`}
                      placeholder="1,000,000.00"
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
                    <button
                      type="button"
                      className="ml-2 text-gray-400 hover:text-gray-600"
                      title="Secured Overnight Financing Rate - The benchmark interest rate for dollar-denominated derivatives and loans"
                    >
                      <InformationCircleIcon className="h-4 w-4 inline" />
                    </button>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="20"
                      value={formData.sofrRate}
                      onChange={(e) => {
                        const value = e.target.value
                        // For number inputs, the browser handles decimal places based on step
                        // Just update the value directly
                        setFormData(prev => ({ ...prev, sofrRate: value }))
                      }}
                      onBlur={(e) => {
                        // Round to 2 decimal places on blur
                        const value = parseFloat(e.target.value)
                        if (!isNaN(value)) {
                          setFormData(prev => ({ ...prev, sofrRate: (Math.round(value * 100) / 100).toString() }))
                        }
                      }}
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
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <CalculatorIcon className="h-5 w-5 text-indigo-600 mr-2" />
                      <h4 className="text-sm font-medium text-indigo-900">Final Allocable Amount</h4>
                    </div>
                    <div className="space-y-1 text-sm text-indigo-700">
                      <div className="flex justify-between">
                        <span>Net Income:</span>
                        <span className="font-medium">${parseFloat(parseFormattedNumber(formData.netIncome) || '0').toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Accruals:</span>
                        <span className="font-medium">${parseFloat(parseFormattedNumber(formData.accruals) || '0').toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Adjustments:</span>
                        <span className="font-medium">${parseFloat(parseFormattedNumber(formData.adjustments) || '0').toLocaleString()}</span>
                      </div>
                      <hr className="border-indigo-300 my-2" />
                      <div className="flex justify-between text-base">
                        <span className="font-semibold">Total to Allocate:</span>
                        <span className="font-bold text-indigo-900">${finalAllocableAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Insights */}
                {existingFinancials && historicalFinancials.length > 1 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <PresentationChartLineIcon className="h-5 w-5 text-blue-600 mr-2" />
                      <h4 className="text-sm font-medium text-blue-900">Quick Insights</h4>
                    </div>
                    <div className="space-y-2 text-sm text-blue-700">
                      <div className="flex items-center">
                        {parseFloat(parseFormattedNumber(formData.netIncome) || '0') > historicalFinancials[1].netIncome ? (
                          <ArrowTrendingUpIcon className="h-4 w-4 text-green-600 mr-1" />
                        ) : (
                          <ArrowTrendingDownIcon className="h-4 w-4 text-red-600 mr-1" />
                        )}
                        <span>
                          Net income is {parseFloat(parseFormattedNumber(formData.netIncome) || '0') > historicalFinancials[1].netIncome ? 'up' : 'down'} {' '}
                          {Math.abs(((parseFloat(parseFormattedNumber(formData.netIncome) || '0') - historicalFinancials[1].netIncome) / historicalFinancials[1].netIncome) * 100).toFixed(1)}% YoY
                        </span>
                      </div>
                      <div>
                        Average allocation per member: ${Math.floor(finalAllocableAmount / 10).toLocaleString()}
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
                className="px-6 py-3 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
              >
                Save & Continue to Preview
              </button>
            </div>
          </div>
        )}

        {/* Preview Step */}
        {currentStep === 'preview' && (
          <div className="p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Allocation Preview</h3>
                <p className="text-sm text-gray-600">
                  Review how the final allocable amount will be distributed to each member based on their equity percentage
                </p>
              </div>
              <button
                onClick={() => setShowBulkAdjustments(!showBulkAdjustments)}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center"
              >
                <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
                Bulk Adjustments
              </button>
            </div>

            {/* Summary Cards */}
            {(existingFinancials || finalAllocableAmount > 0) && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-indigo-900">
                          ${(existingFinancials?.finalAllocableAmount || finalAllocableAmount).toLocaleString()}
                        </div>
                        <div className="text-sm text-indigo-700">Total to Allocate</div>
                      </div>
                      <BanknotesIcon className="h-8 w-8 text-indigo-500" />
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-purple-900">
                          {allocationPreview?.length || 0}
                        </div>
                        <div className="text-sm text-purple-700">Members</div>
                      </div>
                      <UserGroupIcon className="h-8 w-8 text-purple-500" />
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-green-900">
                          {existingFinancials?.sofrRate || parseFloat(formData.sofrRate || '0')}%
                        </div>
                        <div className="text-sm text-green-700">SOFR Rate</div>
                      </div>
                      <ChartBarIcon className="h-8 w-8 text-green-500" />
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-amber-900">
                          {allocationPreview?.[0]?.effectiveReturnRate.toFixed(2) || Math.min(parseFloat(formData.sofrRate || '0') + 5, 10).toFixed(2)}%
                        </div>
                        <div className="text-sm text-amber-700">Effective Return Rate</div>
                      </div>
                      <ScaleIcon className="h-8 w-8 text-amber-500" />
                    </div>
                  </div>
                </div>

                {/* Allocation Breakdown Summary */}
                {allocationPreview && allocationPreview.length > 0 && (
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6 mb-6 border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Allocation Breakdown</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Total Balance Incentive Returns</div>
                        <div className="text-2xl font-bold text-blue-600">
                          ${allocationPreview.reduce((sum, a) => sum + a.balanceIncentiveReturn, 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Min(SOFR + 5%, 10%) × Member Balances
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Remaining for Equity Allocation</div>
                        <div className="text-2xl font-bold text-purple-600">
                          ${allocationPreview.reduce((sum, a) => sum + a.equityBasedAllocation, 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Net Income - Balance Incentive Returns
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Total Allocated</div>
                        <div className="text-2xl font-bold text-green-600">
                          ${allocationPreview.reduce((sum, a) => sum + a.allocationAmount, 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Balance Incentive + Equity-Based
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bulk Adjustments Panel */}
            {showBulkAdjustments && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900">Apply Bulk Adjustments</h4>
                  <button
                    onClick={() => setShowBulkAdjustments(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <input
                      type="number"
                      step="0.1"
                      value={adjustmentPercentage}
                      onChange={(e) => setAdjustmentPercentage(e.target.value)}
                      placeholder="Adjustment percentage (e.g., -5 or +10)"
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <button
                    onClick={handleBulkAdjustment}
                    disabled={selectedMembersForAdjustment.size === 0}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Apply to {selectedMembersForAdjustment.size} Members
                  </button>
                </div>
              </div>
            )}

            {/* Distribution Visualization */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Allocation Distribution</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={allocationDistributionData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={(entry) => `${entry.percentage}%`}
                    >
                      {allocationDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Top 5 Allocations</h4>
                <div className="space-y-3">
                  {allocationPreview?.slice(0, 5).map((allocation, index) => (
                    <div key={allocation.member.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3`} style={{ backgroundColor: CHART_COLORS[index] }}></div>
                        <span className="text-sm text-gray-700">
                          {allocation.member.firstName} {allocation.member.lastName}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          ${allocation.allocationAmount.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {allocation.member.equityPercentage}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Allocation Table */}
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
                      {showBulkAdjustments && (
                        <th className="px-6 py-3 text-left">
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedMembersForAdjustment(new Set(allocationPreview.map(a => a.member.id)))
                              } else {
                                setSelectedMembersForAdjustment(new Set())
                              }
                            }}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                        </th>
                      )}
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
                        Balance Incentive Return
                        <br />
                        <span className="text-xs font-normal text-gray-400">
                          ({allocationPreview[0]?.effectiveReturnRate.toFixed(2)}% of Balance)
                        </span>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Equity-Based Allocation
                        <br />
                        <span className="text-xs font-normal text-gray-400">
                          (% of Remaining Income)
                        </span>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Allocation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        New Capital Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allocationPreview.map((allocation) => {
                      const percentChange = ((allocation.allocationAmount / allocation.member.currentCapitalBalance) * 100).toFixed(1)
                      return (
                        <tr key={allocation.member.id} className="hover:bg-gray-50">
                          {showBulkAdjustments && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedMembersForAdjustment.has(allocation.member.id)}
                                onChange={(e) => {
                                  const newSelected = new Set(selectedMembersForAdjustment)
                                  if (e.target.checked) {
                                    newSelected.add(allocation.member.id)
                                  } else {
                                    newSelected.delete(allocation.member.id)
                                  }
                                  setSelectedMembersForAdjustment(newSelected)
                                }}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {allocation.member.firstName} {allocation.member.lastName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-16 mr-2">
                                <div 
                                  className="bg-indigo-600 h-2 rounded-full"
                                  style={{ width: `${Math.min(allocation.member.equityPercentage, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-900">{allocation.member.equityPercentage.toFixed(2)}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${allocation.member.currentCapitalBalance.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <span className="text-sm font-semibold text-blue-600">
                                ${allocation.balanceIncentiveReturn.toLocaleString()}
                              </span>
                              <div className="text-xs text-gray-500">
                                {((allocation.balanceIncentiveReturn / allocation.allocationAmount) * 100).toFixed(1)}% of total
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <span className="text-sm font-semibold text-purple-600">
                                ${allocation.equityBasedAllocation.toLocaleString()}
                              </span>
                              <div className="text-xs text-gray-500">
                                {((allocation.equityBasedAllocation / allocation.allocationAmount) * 100).toFixed(1)}% of total
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <span className="text-sm font-bold text-green-600">
                                +${allocation.allocationAmount.toLocaleString()}
                              </span>
                              <div className="text-xs text-gray-500">
                                {percentChange}% increase
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            ${allocation.newCapitalBalance.toLocaleString()}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={showBulkAdjustments ? 4 : 3} className="px-6 py-3 text-sm font-medium text-gray-900 text-right">
                        Totals:
                      </td>
                      <td className="px-6 py-3 text-sm font-bold text-blue-600">
                        ${allocationPreview.reduce((sum, a) => sum + a.balanceIncentiveReturn, 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-sm font-bold text-purple-600">
                        ${allocationPreview.reduce((sum, a) => sum + a.equityBasedAllocation, 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-sm font-bold text-green-600">
                        ${allocationPreview.reduce((sum, a) => sum + a.allocationAmount, 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-3"></td>
                    </tr>
                  </tfoot>
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
                onClick={handleProcessAllocation}
                disabled={!allocationPreview?.length}
                className="px-6 py-3 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Process Allocation
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
                {/* Reconciliation Status Banner */}
                <div className={`rounded-lg p-4 ${
                  reconciliation.isReconciled 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-amber-50 border border-amber-200'
                }`}>
                  <div className="flex items-center">
                    {reconciliation.isReconciled ? (
                      <>
                        <CheckCircleIcon className="h-6 w-6 text-green-600 mr-3" />
                        <div>
                          <h4 className="text-sm font-medium text-green-900">Fully Reconciled</h4>
                          <p className="text-sm text-green-700 mt-1">
                            System balances match the balance sheet within acceptable tolerance
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 mr-3" />
                        <div>
                          <h4 className="text-sm font-medium text-amber-900">Reconciliation Required</h4>
                          <p className="text-sm text-amber-700 mt-1">
                            There are differences between system and balance sheet totals
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Comparison Chart */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Balance Sheet vs System Comparison</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reconciliationData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                      <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="balanceSheet" fill="#6366f1" name="Balance Sheet" />
                      <Bar dataKey="system" fill="#8b5cf6" name="System Calculated" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Detailed Comparison */}
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
                      <div className="flex justify-between">
                        <span className="text-blue-700">Additional Capital:</span>
                        <span className="font-semibold text-blue-900">
                          ${reconciliation.additionalPaidInCapital.toLocaleString()}
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
                      <hr className="border-green-300 my-2" />
                      <div className="flex justify-between">
                        <span className="text-green-700 font-medium">System Total:</span>
                        <span className="font-bold text-green-900">
                          ${(reconciliation.calculatedMemberCapitalTotal + reconciliation.systemRetainedEarnings + reconciliation.systemAdditionalCapital).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Differences Summary */}
                <div className={`border rounded-lg p-4 ${
                  reconciliation.isReconciled 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <h4 className={`text-sm font-medium mb-3 ${
                    reconciliation.isReconciled ? 'text-green-900' : 'text-red-900'
                  }`}>
                    Reconciliation Differences
                  </h4>

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

                  {!reconciliation.isReconciled && (
                    <div className="mt-4 p-3 bg-white rounded border border-gray-200">
                      <h5 className="text-xs font-medium text-gray-700 mb-2">Recommended Actions:</h5>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li>• Review member capital account transactions for the period</li>
                        <li>• Verify all distributions and contributions are recorded</li>
                        <li>• Check for any pending adjustments or corrections</li>
                        <li>• Ensure all year-end entries are properly posted</li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Reconciliation Actions */}
                {!reconciliation.isReconciled && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h4>
                    <div className="flex space-x-3">
                      <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                        <ArrowPathIcon className="h-4 w-4 mr-2" />
                        Refresh Data
                      </button>
                      <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                        <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                        Export Details
                      </button>
                      <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                        <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
                        Manual Adjustments
                      </button>
                    </div>
                  </div>
                )}
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
                onClick={handleReconcile}
                className="px-6 py-3 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
              >
                {reconciliation?.isReconciled ? 'Complete Process' : 'Mark as Reconciled'}
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
              <div className="max-w-2xl mx-auto">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <CurrencyDollarIcon className="h-10 w-10 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-900">
                        ${existingFinancials.finalAllocableAmount.toLocaleString()}
                      </div>
                      <div className="text-sm text-green-700">Total Allocated</div>
                    </div>
                    <div>
                      <UserGroupIcon className="h-10 w-10 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-900">
                        {allocationPreview?.length || 0}
                      </div>
                      <div className="text-sm text-green-700">Members</div>
                    </div>
                    <div>
                      <ChartBarIcon className="h-10 w-10 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-900">
                        {existingFinancials.sofrRate}%
                      </div>
                      <div className="text-sm text-green-700">SOFR Rate</div>
                    </div>
                  </div>
                </div>

                {/* Summary Details */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 text-left">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Allocation Summary</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Process Date:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date().toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Fiscal Year:</span>
                      <span className="text-sm font-medium text-gray-900">{currentFiscalYear}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Net Income:</span>
                      <span className="text-sm font-medium text-gray-900">
                        ${existingFinancials.netIncome.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Reconciliation Status:</span>
                      <span className="text-sm font-medium text-green-600">Reconciled</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-sm text-gray-600">Average per Member:</span>
                      <span className="text-sm font-medium text-gray-900">
                        ${Math.floor(existingFinancials.finalAllocableAmount / (allocationPreview?.length || 1)).toLocaleString()}
                      </span>
                    </div>
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
              <button
                onClick={handleStartNewAllocation}
                className="px-6 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
              >
                Start New Allocation
              </button>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  )
}