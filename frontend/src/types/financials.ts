export interface CompanyFinancials {
  id: string
  companyId: string
  fiscalYear: number
  
  // Core Financial Data
  netIncome: number
  accruals: number
  adjustments: number
  finalAllocableAmount: number // netIncome + accruals + adjustments
  
  // SOFR Rate
  sofrRate: number // Annual average SOFR rate for the fiscal year
  sofrSource?: string // e.g., "Federal Reserve Bank of NY"
  sofrPeriod?: string // e.g., "FY 2024 Annual Average"
  
  // Balance Sheet Reconciliation
  totalEquityBalanceSheet: number // Total equity per balance sheet
  totalMemberCapitalAccounts: number // Sum of all member capital accounts
  reconciliationDifference: number // Should be zero when reconciled
  isReconciled: boolean
  
  // Allocation Status
  isAllocated: boolean
  allocationDate?: string
  allocatedBy?: string
  
  // Metadata
  notes?: string
  createdAt: string
  updatedAt: string
  createdBy?: string
  lastModifiedBy?: string
}

export interface MemberAllocation {
  id: string
  companyFinancialsId: string
  memberId: string
  fiscalYear: number
  
  // Allocation Details
  equityPercentage: number // Member's equity % at time of allocation
  allocationAmount: number // Their share of finalAllocableAmount
  
  // Capital Account Impact
  beginningCapitalBalance: number
  allocationCredit: number // Same as allocationAmount
  distributions: number // Any distributions during the year
  endingCapitalBalance: number // beginning + allocation - distributions
  
  // SOFR Interest (if applicable)
  sofrInterest?: number
  sofrInterestRate?: number
  
  // Metadata
  allocationDate: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CreateCompanyFinancialsDto {
  fiscalYear: number
  netIncome: number
  accruals: number
  adjustments: number
  sofrRate: number
  sofrSource?: string
  sofrPeriod?: string
  totalEquityBalanceSheet: number
  notes?: string
}

export interface UpdateCompanyFinancialsDto {
  netIncome?: number
  accruals?: number
  adjustments?: number
  sofrRate?: number
  sofrSource?: string
  sofrPeriod?: string
  totalEquityBalanceSheet?: number
  notes?: string
}

export interface AllocationPreview {
  member: {
    id: string
    firstName: string
    lastName: string
    equityPercentage: number
    currentCapitalBalance: number
  }
  allocationAmount: number
  newCapitalBalance: number
  distributionsToDate: number
}

export interface AllocationSummary {
  fiscalYear: number
  totalAllocableAmount: number
  totalAllocated: number
  memberCount: number
  averageAllocation: number
  largestAllocation: number
  smallestAllocation: number
  reconciliationStatus: 'reconciled' | 'difference' | 'not_reconciled'
  sofrRate: number
}

export interface YearEndProcess {
  step: 'setup' | 'preview' | 'allocate' | 'reconcile' | 'complete'
  fiscalYear: number
  companyFinancials?: CompanyFinancials
  allocationPreviews?: AllocationPreview[]
  memberAllocations?: MemberAllocation[]
  isComplete: boolean
  errors?: string[]
  warnings?: string[]
}

export interface BalanceSheetReconciliation {
  fiscalYear: number
  
  // Balance Sheet Side
  totalEquityPerBalanceSheet: number
  retainedEarnings: number
  additionalPaidInCapital: number
  memberCapitalAccounts: number
  
  // System Side
  calculatedMemberCapitalTotal: number
  systemRetainedEarnings: number
  systemAdditionalCapital: number
  
  // Differences
  capitalAccountsDifference: number
  retainedEarningsDifference: number
  totalDifference: number
  
  // Status
  isReconciled: boolean
  lastReconciledDate?: string
  reconciledBy?: string
  notes?: string
}

export const SOFR_RATE_SOURCES = [
  'Federal Reserve Bank of New York',
  'Federal Reserve Economic Data (FRED)',
  'Bloomberg Terminal',
  'Wall Street Journal',
  'Manual Entry'
] as const

export const ALLOCATION_STEPS = [
  { key: 'setup', label: 'Setup Financials', description: 'Enter net income, accruals, adjustments, and SOFR rate' },
  { key: 'preview', label: 'Preview Allocation', description: 'Review allocation amounts by member' },
  { key: 'allocate', label: 'Process Allocation', description: 'Create member allocations and update capital accounts' },
  { key: 'reconcile', label: 'Reconcile Balance Sheet', description: 'Ensure system matches balance sheet totals' },
  { key: 'complete', label: 'Complete', description: 'Year-end allocation process complete' }
] as const