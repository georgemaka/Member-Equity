import { Member, MemberStatus } from './member'
import { TaxPayment } from './taxPayment'
import { CompanyFinancials, MemberAllocation } from './financials'

// Dashboard Filter Types
export type DashboardGroupBy = 
  | 'none'
  | 'position' 
  | 'equity_range' 
  | 'years_of_service' 
  | 'member_status' 
  | 'join_date_cohort'
  | 'hire_date_cohort'
  | 'capital_account_size'
  | 'tax_payment_frequency'

export type DashboardTimeframe = 'current' | 'multi_year'

export type EquityRange = 'small' | 'medium' | 'large' // <1%, 1-5%, >5%
export type ServiceYears = 'new' | 'experienced' | 'veteran' // 0-2, 3-5, 5+
export type CapitalAccountSize = 'low' | 'medium' | 'high'

export interface DashboardFilters {
  fiscalYears: number[]
  memberIds?: string[]
  groupBy: DashboardGroupBy
  memberStatuses?: MemberStatus[]
  positions?: string[]
  equityRanges?: EquityRange[]
  serviceYearRanges?: ServiceYears[]
  joinDateRange?: {
    from: string
    to: string
  }
  hireDateRange?: {
    from: string
    to: string
  }
}

// Executive Summary KPIs
export interface ExecutiveSummary {
  fiscalYear: number
  activeMembers: number
  retiredMembers: number
  totalDistributions: number
  taxDistributions: number // Tax payments made on behalf of members
  totalEquityPercentage: number
  // Additional metrics for context
  totalMembers: number
  totalCapitalAccounts: number
  averageCapitalPerMember: number
  averageEquityPerMember: number
  memberRetentionRate: number
  newJoinersThisYear: number
  departuresThisYear: number
  averageYearsOfService: number
}

// Year-over-Year Comparison
export interface YearOverYearComparison {
  fiscalYear: number
  currentYear: ExecutiveSummary
  previousYear?: ExecutiveSummary
  changes: {
    memberGrowth: number
    capitalGrowth: number
    equityConcentrationChange: number
    retentionRateChange: number
  }
}

// Member Summary for Dashboard
export interface MemberSummary {
  member: Member
  yearsOfService: number
  currentEquityPercentage: number
  currentCapitalBalance: number
  totalTaxPaymentsThisYear: number
  totalDistributionsThisYear: number
  lastStatusChange?: {
    date: string
    fromStatus: MemberStatus
    toStatus: MemberStatus
  }
  lastEquityChange?: {
    date: string
    fromPercentage: number
    toPercentage: number
  }
  recentActivity: ActivitySummary[]
}

// Activity Timeline
export interface ActivitySummary {
  id: string
  type: 'status_change' | 'equity_adjustment' | 'tax_payment' | 'distribution' | 'allocation'
  date: string
  description: string
  amount?: number
  details: any
}

// Group Analysis
export interface GroupAnalysis {
  groupName: string
  groupType: DashboardGroupBy
  memberCount: number
  totalCapital: number
  totalEquity: number
  averageCapital: number
  averageEquity: number
  averageYearsOfService: number
  totalTaxPayments: number
  members: MemberSummary[]
}

// Trends and Analytics
export interface TrendAnalysis {
  fiscalYears: number[]
  memberCountTrend: number[]
  totalCapitalTrend: number[]
  averageEquityTrend: number[]
  retentionRateTrend: number[]
  newJoinersTrend: number[]
  departuresTrend: number[]
}

// Advanced Analytics
export interface AdvancedAnalytics {
  equityConcentrationIndex: number // Gini coefficient
  memberLifecycleMetrics: {
    averageTimeToFirstEquityIncrease: number
    averageTimeToRetirement: number
    promotionRate: number
  }
  complianceMetrics: {
    onTimeTaxPayments: number
    missedDeadlines: number
    pendingActions: number
  }
  predictiveIndicators: {
    membersLikelyToLeave: string[]
    membersLikelyForPromotion: string[]
    equityAdjustmentCandidates: string[]
  }
}

// Dashboard Data Structure
export interface DashboardData {
  executiveSummary: ExecutiveSummary
  yearOverYearComparison?: YearOverYearComparison[]
  memberSummaries: MemberSummary[]
  groupAnalyses: GroupAnalysis[]
  trendAnalysis?: TrendAnalysis
  advancedAnalytics?: AdvancedAnalytics
  recentActivities: ActivitySummary[]
  upcomingDeadlines: {
    type: string
    description: string
    dueDate: string
    priority: 'high' | 'medium' | 'low'
  }[]
}

// Member Detail Dashboard
export interface MemberDetailDashboard {
  member: Member
  memberSummary: MemberSummary
  equityHistory: Array<{
    fiscalYear: number
    estimatedPercentage: number
    finalPercentage?: number
    capitalBalance: number
    allocationAmount?: number
  }>
  statusHistory: Array<{
    fiscalYear: number
    status: MemberStatus
    effectiveDate: string
    reason?: string
  }>
  taxPaymentHistory: TaxPayment[]
  distributionHistory: Array<{
    id: string
    fiscalYear: number
    amount: number
    date: string
    type: string
  }>
  allocationHistory: MemberAllocation[]
  performanceMetrics: {
    capitalGrowthRate: number
    equityProgressionRate: number
    averageAnnualAllocation: number
    totalContributions: number
  }
  comparisonToPeers: {
    equityPercentile: number
    capitalPercentile: number
    serviceYearsPercentile: number
  }
}

// Report Configuration
export interface ReportConfig {
  title: string
  filters: DashboardFilters
  includedSections: Array<
    | 'executive_summary'
    | 'member_list'
    | 'financial_summary'
    | 'trend_analysis'
    | 'group_analysis'
    | 'compliance_report'
  >
  format: 'excel' | 'pdf' | 'csv'
}

// Dashboard API Response Types
export interface DashboardApiResponse {
  success: boolean
  data: DashboardData
  generatedAt: string
  filters: DashboardFilters
}

export interface MemberDetailApiResponse {
  success: boolean
  data: MemberDetailDashboard
  generatedAt: string
  memberId: string
}