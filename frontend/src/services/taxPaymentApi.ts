import { 
  TaxPayment,
  CreateTaxPaymentDto,
  BulkTaxPaymentDto,
  TaxPaymentSummary,
  TaxDashboardData,
  TaxPaymentUploadResult
} from '@/types/taxPayment'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

class TaxPaymentApiService {
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

  // Get all tax payments with filtering
  async getTaxPayments(
    fiscalYear?: number, 
    taxYear?: number, 
    memberId?: string, 
    paymentType?: string
  ): Promise<TaxPayment[]> {
    const params = new URLSearchParams()
    if (fiscalYear) params.append('fiscalYear', fiscalYear.toString())
    if (taxYear) params.append('taxYear', taxYear.toString())
    if (memberId) params.append('memberId', memberId)
    if (paymentType) params.append('paymentType', paymentType)
    
    return this.fetchWithAuth(`/tax-payments?${params.toString()}`)
  }

  // Get tax dashboard data
  async getTaxDashboard(fiscalYear: number): Promise<TaxDashboardData> {
    return this.fetchWithAuth(`/tax-payments/dashboard?fiscalYear=${fiscalYear}`)
  }

  // Get tax payment summaries by member
  async getTaxSummaries(fiscalYear: number, taxYear?: number): Promise<TaxPaymentSummary[]> {
    const params = new URLSearchParams({ fiscalYear: fiscalYear.toString() })
    if (taxYear) params.append('taxYear', taxYear.toString())
    
    return this.fetchWithAuth(`/tax-payments/summaries?${params.toString()}`)
  }

  // Get tax payments for a specific member
  async getMemberTaxPayments(memberId: string, fiscalYear?: number): Promise<TaxPayment[]> {
    const params = new URLSearchParams({ memberId })
    if (fiscalYear) params.append('fiscalYear', fiscalYear.toString())
    
    return this.fetchWithAuth(`/tax-payments/member?${params.toString()}`)
  }

  // Create a single tax payment
  async createTaxPayment(paymentData: CreateTaxPaymentDto): Promise<TaxPayment> {
    return this.fetchWithAuth('/tax-payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    })
  }

  // Create multiple tax payments (bulk)
  async createBulkTaxPayments(bulkData: BulkTaxPaymentDto): Promise<{ success: boolean, createdCount: number, payments: TaxPayment[] }> {
    return this.fetchWithAuth('/tax-payments/bulk', {
      method: 'POST',
      body: JSON.stringify(bulkData),
    })
  }

  // Update a tax payment
  async updateTaxPayment(id: string, paymentData: Partial<CreateTaxPaymentDto>): Promise<TaxPayment> {
    return this.fetchWithAuth(`/tax-payments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(paymentData),
    })
  }

  // Delete a tax payment
  async deleteTaxPayment(id: string): Promise<{ success: boolean }> {
    return this.fetchWithAuth(`/tax-payments/${id}`, {
      method: 'DELETE',
    })
  }

  // Get upcoming payment schedule
  async getUpcomingPayments(fiscalYear: number): Promise<TaxPayment[]> {
    return this.fetchWithAuth(`/tax-payments/upcoming?fiscalYear=${fiscalYear}`)
  }

  // Export tax payments to Excel
  async exportTaxPayments(fiscalYear: number, taxYear?: number): Promise<Blob> {
    const params = new URLSearchParams({ fiscalYear: fiscalYear.toString() })
    if (taxYear) params.append('taxYear', taxYear.toString())
    
    const token = 'mock-token-for-development'
    
    const response = await fetch(`${API_BASE_URL}/tax-payments/export?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return response.blob()
  }

  // Calculate estimated tax liability for member based on equity %
  async calculateEstimatedTax(memberId: string, fiscalYear: number): Promise<{
    estimatedLiability: number
    quarterlyPayment: number
    annualIncome: number
    equityPercentage: number
  }> {
    return this.fetchWithAuth(`/tax-payments/calculate/${memberId}?fiscalYear=${fiscalYear}`)
  }

  // Upload tax payments from Excel file
  async uploadTaxPayments(file: File, fiscalYear: number): Promise<TaxPaymentUploadResult> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('fiscalYear', fiscalYear.toString())

    const token = 'mock-token-for-development'
    
    const response = await fetch(`${API_BASE_URL}/tax-payments/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type - let browser set it with boundary for FormData
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Download tax payment upload template
  async downloadUploadTemplate(): Promise<Blob> {
    const token = 'mock-token-for-development'
    
    const response = await fetch(`${API_BASE_URL}/tax-payments/upload-template`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return response.blob()
  }
}

export const taxPaymentApi = new TaxPaymentApiService()