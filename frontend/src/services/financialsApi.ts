import { 
  CompanyFinancials,
  CreateCompanyFinancialsDto,
  UpdateCompanyFinancialsDto,
  MemberAllocation,
  AllocationPreview,
  AllocationSummary,
  YearEndProcess,
  BalanceSheetReconciliation
} from '@/types/financials'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

class FinancialsApiService {
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

  // Company Financials CRUD
  async getCompanyFinancials(fiscalYear: number): Promise<CompanyFinancials | null> {
    try {
      return this.fetchWithAuth(`/financials/company/${fiscalYear}`)
    } catch (error: any) {
      if (error.message.includes('404')) {
        return null // No financials found for this year
      }
      throw error
    }
  }

  async createCompanyFinancials(data: CreateCompanyFinancialsDto): Promise<CompanyFinancials> {
    return this.fetchWithAuth('/financials/company', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateCompanyFinancials(fiscalYear: number, data: UpdateCompanyFinancialsDto): Promise<CompanyFinancials> {
    return this.fetchWithAuth(`/financials/company/${fiscalYear}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  // Year-End Allocation Process
  async getYearEndProcess(fiscalYear: number): Promise<YearEndProcess> {
    return this.fetchWithAuth(`/financials/year-end/${fiscalYear}`)
  }

  async previewAllocation(fiscalYear: number): Promise<AllocationPreview[]> {
    return this.fetchWithAuth(`/financials/allocation/preview/${fiscalYear}`)
  }

  async processAllocation(fiscalYear: number): Promise<{ 
    success: boolean, 
    allocationsCreated: number,
    memberAllocations: MemberAllocation[] 
  }> {
    return this.fetchWithAuth(`/financials/allocation/process/${fiscalYear}`, {
      method: 'POST',
    })
  }

  // Member Allocations
  async getMemberAllocations(fiscalYear: number, memberId?: string): Promise<MemberAllocation[]> {
    const params = new URLSearchParams({ fiscalYear: fiscalYear.toString() })
    if (memberId) params.append('memberId', memberId)
    
    return this.fetchWithAuth(`/financials/allocations?${params.toString()}`)
  }

  async updateMemberAllocation(
    allocationId: string, 
    data: Partial<MemberAllocation>
  ): Promise<MemberAllocation> {
    return this.fetchWithAuth(`/financials/allocations/${allocationId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  // Balance Sheet Reconciliation
  async getBalanceSheetReconciliation(fiscalYear: number): Promise<BalanceSheetReconciliation> {
    return this.fetchWithAuth(`/financials/reconciliation/${fiscalYear}`)
  }

  async updateBalanceSheetReconciliation(
    fiscalYear: number, 
    data: Partial<BalanceSheetReconciliation>
  ): Promise<BalanceSheetReconciliation> {
    return this.fetchWithAuth(`/financials/reconciliation/${fiscalYear}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async performReconciliation(fiscalYear: number): Promise<{ 
    success: boolean, 
    reconciliation: BalanceSheetReconciliation 
  }> {
    return this.fetchWithAuth(`/financials/reconciliation/${fiscalYear}/perform`, {
      method: 'POST',
    })
  }

  // Reporting and Analytics
  async getAllocationSummary(fiscalYear: number): Promise<AllocationSummary> {
    return this.fetchWithAuth(`/financials/summary/${fiscalYear}`)
  }

  async getAllocationHistory(memberId?: string): Promise<MemberAllocation[]> {
    const params = new URLSearchParams()
    if (memberId) params.append('memberId', memberId)
    
    return this.fetchWithAuth(`/financials/allocations/history?${params.toString()}`)
  }

  // SOFR Rate Management
  async getCurrentSOFRRate(): Promise<{ rate: number, date: string, source: string }> {
    return this.fetchWithAuth('/financials/sofr/current')
  }

  async getSOFRHistory(): Promise<Array<{ 
    fiscalYear: number, 
    rate: number, 
    source: string,
    period: string 
  }>> {
    return this.fetchWithAuth('/financials/sofr/history')
  }

  async updateSOFRRate(fiscalYear: number, data: {
    rate: number,
    source?: string,
    period?: string
  }): Promise<{ success: boolean }> {
    return this.fetchWithAuth(`/financials/sofr/${fiscalYear}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  // Export and Reporting
  async exportAllocationReport(fiscalYear: number): Promise<Blob> {
    const token = 'mock-token-for-development'
    
    const response = await fetch(`${API_BASE_URL}/financials/export/allocation/${fiscalYear}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return response.blob()
  }

  async exportCapitalAccountStatement(memberId: string, fiscalYear?: number): Promise<Blob> {
    const params = new URLSearchParams()
    if (fiscalYear) params.append('fiscalYear', fiscalYear.toString())
    
    const token = 'mock-token-for-development'
    
    const response = await fetch(`${API_BASE_URL}/financials/export/capital-statement/${memberId}?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return response.blob()
  }

  // Utilities
  async calculateFinalAllocableAmount(data: {
    netIncome: number,
    accruals: number,
    adjustments: number
  }): Promise<{ finalAmount: number }> {
    return this.fetchWithAuth('/financials/calculate/allocable-amount', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async validateAllocation(fiscalYear: number): Promise<{
    isValid: boolean,
    errors: string[],
    warnings: string[]
  }> {
    return this.fetchWithAuth(`/financials/validate/${fiscalYear}`)
  }
}

export const financialsApi = new FinancialsApiService()