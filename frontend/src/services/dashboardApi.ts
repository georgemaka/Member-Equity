import {
  DashboardData,
  DashboardFilters,
  DashboardApiResponse,
  MemberDetailDashboard,
  MemberDetailApiResponse,
  ExecutiveSummary,
  YearOverYearComparison,
  GroupAnalysis,
  TrendAnalysis,
  AdvancedAnalytics,
  ReportConfig
} from '@/types/dashboard'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

class DashboardApiService {
  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    // For now using mock token - later integrate with actual auth
    const token = 'mock-token-for-development'
    
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Main Dashboard Data
  async getDashboardData(filters: DashboardFilters): Promise<DashboardData> {
    return this.fetchWithAuth('/dashboard', {
      method: 'POST',
      body: JSON.stringify(filters),
    })
  }

  // Executive Summary
  async getExecutiveSummary(fiscalYear: number): Promise<ExecutiveSummary> {
    return this.fetchWithAuth(`/dashboard/executive-summary?fiscalYear=${fiscalYear}`)
  }

  // Year-over-Year Comparison
  async getYearOverYearComparison(fiscalYears: number[]): Promise<YearOverYearComparison[]> {
    const params = new URLSearchParams()
    fiscalYears.forEach(year => params.append('fiscalYear', year.toString()))
    
    return this.fetchWithAuth(`/dashboard/year-over-year?${params.toString()}`)
  }

  // Group Analysis
  async getGroupAnalysis(filters: DashboardFilters): Promise<GroupAnalysis[]> {
    return this.fetchWithAuth('/dashboard/group-analysis', {
      method: 'POST',
      body: JSON.stringify(filters),
    })
  }

  // Trend Analysis
  async getTrendAnalysis(fiscalYears: number[]): Promise<TrendAnalysis> {
    const params = new URLSearchParams()
    fiscalYears.forEach(year => params.append('fiscalYear', year.toString()))
    
    return this.fetchWithAuth(`/dashboard/trends?${params.toString()}`)
  }

  // Advanced Analytics
  async getAdvancedAnalytics(fiscalYear: number): Promise<AdvancedAnalytics> {
    return this.fetchWithAuth(`/dashboard/advanced-analytics?fiscalYear=${fiscalYear}`)
  }

  // Member Detail Dashboard
  async getMemberDetailDashboard(memberId: string, fiscalYears?: number[]): Promise<MemberDetailDashboard> {
    const params = new URLSearchParams({ memberId })
    if (fiscalYears) {
      fiscalYears.forEach(year => params.append('fiscalYear', year.toString()))
    }
    
    return this.fetchWithAuth(`/dashboard/member-detail?${params.toString()}`)
  }

  // Member Comparison
  async compareMemberDetails(memberIds: string[], fiscalYear: number): Promise<{
    members: MemberDetailDashboard[]
    comparison: {
      equityComparison: Array<{ memberId: string, memberName: string, equityPercentage: number }>
      capitalComparison: Array<{ memberId: string, memberName: string, capitalBalance: number }>
      performanceComparison: Array<{ memberId: string, memberName: string, metrics: any }>
    }
  }> {
    return this.fetchWithAuth('/dashboard/member-comparison', {
      method: 'POST',
      body: JSON.stringify({ memberIds, fiscalYear }),
    })
  }

  // Activity Timeline
  async getActivityTimeline(filters: {
    fiscalYear: number
    memberIds?: string[]
    activityTypes?: string[]
    limit?: number
  }): Promise<Array<{
    id: string
    type: string
    date: string
    description: string
    memberName?: string
    amount?: number
    details: any
  }>> {
    return this.fetchWithAuth('/dashboard/activity-timeline', {
      method: 'POST',
      body: JSON.stringify(filters),
    })
  }

  // Compliance Dashboard
  async getComplianceDashboard(fiscalYear: number): Promise<{
    taxPaymentCompliance: {
      onTime: number
      late: number
      upcoming: Array<{
        memberId: string
        memberName: string
        dueDate: string
        amount: number
        type: string
      }>
    }
    filingCompliance: {
      completed: number
      pending: number
      overdue: number
    }
    auditTrail: Array<{
      action: string
      user: string
      timestamp: string
      details: string
    }>
  }> {
    return this.fetchWithAuth(`/dashboard/compliance?fiscalYear=${fiscalYear}`)
  }

  // Predictive Analytics
  async getPredictiveAnalytics(fiscalYear: number): Promise<{
    memberRetentionRisk: Array<{
      memberId: string
      memberName: string
      riskScore: number
      riskFactors: string[]
    }>
    equityAdjustmentCandidates: Array<{
      memberId: string
      memberName: string
      suggestedAction: string
      reasoning: string[]
    }>
    performanceTrends: Array<{
      memberId: string
      memberName: string
      trendDirection: 'up' | 'down' | 'stable'
      keyMetrics: any
    }>
  }> {
    return this.fetchWithAuth(`/dashboard/predictive-analytics?fiscalYear=${fiscalYear}`)
  }

  // Board Meeting Preparation
  async getBoardMeetingPrep(fiscalYear: number): Promise<{
    memberEquityReview: Array<{
      memberId: string
      memberName: string
      currentEquity: number
      suggestedEquity: number
      reasoning: string[]
      requiresAttention: boolean
    }>
    financialSummary: {
      totalAllocations: number
      projectedDistributions: number
      capitalChanges: number
      taxLiabilities: number
    }
    actionItems: Array<{
      priority: 'high' | 'medium' | 'low'
      description: string
      assignedTo?: string
      dueDate?: string
    }>
    equityRecommendations: Array<{
      memberId: string
      currentPercentage: number
      recommendedPercentage: number
      rationale: string
    }>
  }> {
    return this.fetchWithAuth(`/dashboard/board-meeting-prep?fiscalYear=${fiscalYear}`)
  }

  // Export Reports
  async exportDashboardReport(config: ReportConfig): Promise<Blob> {
    const token = 'mock-token-for-development'
    
    const response = await fetch(`${API_BASE_URL}/dashboard/export`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return response.blob()
  }

  // Member Directory Export
  async exportMemberDirectory(filters: DashboardFilters): Promise<Blob> {
    const token = 'mock-token-for-development'
    
    const response = await fetch(`${API_BASE_URL}/dashboard/export/member-directory`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(filters),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return response.blob()
  }

  // Financial Summary Export
  async exportFinancialSummary(fiscalYears: number[]): Promise<Blob> {
    const token = 'mock-token-for-development'
    
    const params = new URLSearchParams()
    fiscalYears.forEach(year => params.append('fiscalYear', year.toString()))
    
    const response = await fetch(`${API_BASE_URL}/dashboard/export/financial-summary?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return response.blob()
  }

  // Search Members
  async searchMembers(query: string, filters?: Partial<DashboardFilters>): Promise<Array<{
    member: any
    relevanceScore: number
    matchedFields: string[]
  }>> {
    return this.fetchWithAuth('/dashboard/search/members', {
      method: 'POST',
      body: JSON.stringify({ query, filters }),
    })
  }

  // Quick Stats for Widget Cards
  async getQuickStats(fiscalYear: number): Promise<{
    memberCount: number
    totalCapital: number
    totalTaxPayments: number
    pendingActions: number
    monthlyGrowth: number
    equityConcentration: number
    averageEquity: number
    retentionRate: number
  }> {
    return this.fetchWithAuth(`/dashboard/quick-stats?fiscalYear=${fiscalYear}`)
  }

  // Recent Activities for Dashboard Widget
  async getRecentActivities(limit: number = 10): Promise<Array<{
    id: string
    type: string
    description: string
    timestamp: string
    memberName?: string
    amount?: number
    priority?: 'high' | 'medium' | 'low'
  }>> {
    return this.fetchWithAuth(`/dashboard/recent-activities?limit=${limit}`)
  }

  // Upcoming Deadlines
  async getUpcomingDeadlines(fiscalYear: number): Promise<Array<{
    id: string
    type: 'tax_payment' | 'filing' | 'board_meeting' | 'equity_review'
    description: string
    dueDate: string
    priority: 'high' | 'medium' | 'low'
    memberName?: string
    amount?: number
    status: 'pending' | 'in_progress' | 'completed'
  }>> {
    return this.fetchWithAuth(`/dashboard/upcoming-deadlines?fiscalYear=${fiscalYear}`)
  }
}

export const dashboardApi = new DashboardApiService()