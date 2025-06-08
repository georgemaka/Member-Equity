export type TaxPaymentType = 'federal_estimated' | 'state_estimated' | 'local' | 'federal_extension' | 'state_extension' | 'penalty_interest' | 'other'

export type PaymentFrequency = 'monthly' | 'quarterly' | 'annually' | 'one_time'

export type TaxYear = number

export interface TaxPayment {
  id: string
  memberId?: string // null for company-wide payments
  fiscalYear: number
  taxYear: number // tax year the payment applies to (might differ from fiscal year)
  paymentType: TaxPaymentType
  paymentDate: string
  amount: number
  frequency: PaymentFrequency
  quarter?: number // 1-4 for quarterly payments
  month?: number // 1-12 for monthly payments
  description?: string
  notes?: string
  jurisdiction?: string // e.g., "California", "Los Angeles County"
  isEstimated: boolean
  paidBy?: string // who made the payment
  checkNumber?: string
  confirmationNumber?: string
  createdAt: string
  updatedAt: string
}

export interface CreateTaxPaymentDto {
  memberId?: string
  fiscalYear: number
  taxYear: number
  paymentType: TaxPaymentType
  paymentDate: string
  amount: number
  frequency: PaymentFrequency
  quarter?: number
  month?: number
  description?: string
  notes?: string
  jurisdiction?: string
  isEstimated: boolean
  checkNumber?: string
  confirmationNumber?: string
}

export interface TaxPaymentSummary {
  memberId?: string
  memberName?: string
  fiscalYear: number
  taxYear: number
  totalPayments: number
  paymentsByType: Record<TaxPaymentType, number>
  paymentsByQuarter: Record<string, number> // Q1, Q2, Q3, Q4
  paymentsByMonth: Record<string, number> // Jan, Feb, etc.
  lastPaymentDate?: string
  estimatedAnnualLiability?: number
  remainingEstimatedPayments?: number
}

export interface TaxDashboardData {
  currentFiscalYear: number
  currentTaxYear: number
  totalCompanyPayments: number
  totalMemberPayments: number
  memberSummaries: TaxPaymentSummary[]
  upcomingPayments: TaxPayment[]
  recentPayments: TaxPayment[]
  paymentsByType: Record<TaxPaymentType, number>
  quarterlyTotals: Record<string, number>
}

export interface BulkTaxPaymentDto {
  payments: CreateTaxPaymentDto[]
  applyToAllMembers?: boolean
  distributionMethod?: 'equal' | 'by_equity' | 'custom'
}

export const TAX_PAYMENT_TYPE_LABELS: Record<TaxPaymentType, string> = {
  federal_estimated: 'Federal Estimated Tax',
  state_estimated: 'State Estimated Tax',
  local: 'Local Tax',
  federal_extension: 'Federal Extension Payment',
  state_extension: 'State Extension Payment',
  penalty_interest: 'Penalty & Interest',
  other: 'Other Tax Payment'
}

export const PAYMENT_FREQUENCY_LABELS: Record<PaymentFrequency, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annually: 'Annually',
  one_time: 'One-time'
}

export const QUARTER_LABELS = {
  1: 'Q1 (Jan-Mar)',
  2: 'Q2 (Apr-Jun)', 
  3: 'Q3 (Jul-Sep)',
  4: 'Q4 (Oct-Dec)'
}

export const MONTH_LABELS = {
  1: 'January', 2: 'February', 3: 'March', 4: 'April',
  5: 'May', 6: 'June', 7: 'July', 8: 'August',
  9: 'September', 10: 'October', 11: 'November', 12: 'December'
}

// Excel Upload Types
export interface TaxPaymentUploadRow {
  memberIdentifier: string // SSN, Tax ID, or Employee ID
  identifierType: 'ssn' | 'taxId' | 'employeeId'
  firstName?: string // optional for verification
  lastName?: string // optional for verification
  paymentType: TaxPaymentType
  paymentDate: string
  amount: number
  frequency: PaymentFrequency
  quarter?: number
  month?: number
  description?: string
  notes?: string
  jurisdiction?: string
  isEstimated: boolean
  checkNumber?: string
  confirmationNumber?: string
  taxYear: number
}

export interface TaxPaymentUploadResult {
  success: boolean
  totalRows: number
  successfulRows: number
  failedRows: number
  warnings: Array<{
    row: number
    message: string
    data?: any
  }>
  errors: Array<{
    row: number
    message: string
    data?: any
  }>
  createdPayments: TaxPayment[]
  duplicatePayments: Array<{
    row: number
    existingPayment: TaxPayment
    message: string
  }>
}