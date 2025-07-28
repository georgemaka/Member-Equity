import { 
  Member, 
  CreateMemberDto, 
  UpdateMemberDto, 
  UpdateEquityDto, 
  UpdateMemberStatusDto,
  BulkEquityUpdateDto,
  PaginatedMembers,
  MemberEquityHistory,
  MemberBalanceHistory,
  UploadResult,
  StatusHistory
} from '@/types/member'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api/v1'

class MemberApiService {
  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    // Get mock user from localStorage or use default
    const mockUser = JSON.parse(localStorage.getItem('mockUser') || JSON.stringify({
      id: 'dev-user-1',
      email: 'admin@example.com',
      companyId: 'cmbno3kq80000596mblh2id26',
      role: 'admin',
      permissions: ['*']
    }))
    
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer mock-token-for-development`,
        'X-Mock-Auth': JSON.stringify(mockUser),
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    return response.json()
  }

  async getMembers(params: { page?: number, limit?: number, fiscalYear?: number } = {}): Promise<PaginatedMembers> {
    const { page = 1, limit = 10, fiscalYear } = params
    const yearParam = fiscalYear ? `&fiscalYear=${fiscalYear}` : ''
    return this.fetchWithAuth(`/members?page=${page}&limit=${limit}${yearParam}`)
  }

  async getMembersForYear(fiscalYear: number): Promise<PaginatedMembers> {
    return this.fetchWithAuth(`/members?fiscalYear=${fiscalYear}&includeEquity=true`)
  }

  async getMember(id: string): Promise<Member> {
    return this.fetchWithAuth(`/members/${id}`)
  }

  async createMember(memberData: CreateMemberDto): Promise<Member> {
    return this.fetchWithAuth('/members', {
      method: 'POST',
      body: JSON.stringify(memberData),
    })
  }

  async updateMember(id: string, memberData: UpdateMemberDto): Promise<Member> {
    return this.fetchWithAuth(`/members/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(memberData),
    })
  }

  async updateEquity(id: string, equityData: UpdateEquityDto): Promise<Member> {
    return this.fetchWithAuth(`/members/${id}/equity`, {
      method: 'PATCH',
      body: JSON.stringify(equityData),
    })
  }

  async updateStatus(id: string, statusData: UpdateMemberStatusDto): Promise<Member> {
    return this.fetchWithAuth(`/members/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData),
    })
  }

  async bulkUpdateEquity(bulkData: BulkEquityUpdateDto): Promise<{ success: boolean, updatedCount: number }> {
    return this.fetchWithAuth('/members/bulk-equity-update', {
      method: 'POST',
      body: JSON.stringify(bulkData),
    })
  }

  async retireMember(id: string, retirementDate: string, reason: string): Promise<Member> {
    return this.fetchWithAuth(`/members/${id}/retire`, {
      method: 'POST',
      body: JSON.stringify({ retirementDate, reason }),
    })
  }

  async getEquityHistory(id: string, year?: number): Promise<MemberEquityHistory[]> {
    const yearParam = year ? `?year=${year}` : ''
    return this.fetchWithAuth(`/members/${id}/equity-history${yearParam}`)
  }

  async getBalanceHistory(id: string, year?: number): Promise<MemberBalanceHistory[]> {
    const yearParam = year ? `?year=${year}` : ''
    return this.fetchWithAuth(`/members/${id}/balance-history${yearParam}`)
  }

  async getStatusHistory(id: string, limit?: number): Promise<StatusHistory[]> {
    const limitParam = limit ? `?limit=${limit}` : ''
    return this.fetchWithAuth(`/members/${id}/status-history${limitParam}`)
  }

  async uploadMembers(file: File, skipValidation = false, dryRun = false): Promise<UploadResult> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('skipValidation', skipValidation.toString())
    formData.append('dryRun', dryRun.toString())

    const mockUser = JSON.parse(localStorage.getItem('mockUser') || JSON.stringify({
      id: 'dev-user-1',
      email: 'admin@example.com',
      companyId: 'cmbno3kq80000596mblh2id26',
      role: 'admin',
      permissions: ['*']
    }))
    
    const response = await fetch(`${API_BASE_URL}/members/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer mock-token-for-development`,
        'X-Mock-Auth': JSON.stringify(mockUser),
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    return response.json()
  }

  async downloadTemplate(): Promise<Blob> {
    const mockUser = JSON.parse(localStorage.getItem('mockUser') || JSON.stringify({
      id: 'dev-user-1',
      email: 'admin@example.com',
      companyId: 'cmbno3kq80000596mblh2id26',
      role: 'admin',
      permissions: ['*']
    }))
    
    const response = await fetch(`${API_BASE_URL}/members/upload/template`, {
      headers: {
        'Authorization': `Bearer mock-token-for-development`,
        'X-Mock-Auth': JSON.stringify(mockUser),
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return response.blob()
  }

  async exportEquityState(companyId: string): Promise<any> {
    const mockUser = JSON.parse(localStorage.getItem('mockUser') || JSON.stringify({
      id: 'dev-user-1',
      email: 'admin@example.com',
      companyId: 'cmbno3kq80000596mblh2id26',
      role: 'admin',
      permissions: ['*']
    }))
    
    const response = await fetch(`${API_BASE_URL}/members/equity/export`, {
      headers: {
        'Authorization': `Bearer mock-token-for-development`,
        'X-Mock-Auth': JSON.stringify(mockUser),
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return { data: await response.blob() }
  }

  async validateEquityImport(companyId: string, file: File): Promise<any> {
    const formData = new FormData()
    formData.append('file', file)

    const mockUser = JSON.parse(localStorage.getItem('mockUser') || JSON.stringify({
      id: 'dev-user-1',
      email: 'admin@example.com',
      companyId: 'cmbno3kq80000596mblh2id26',
      role: 'admin',
      permissions: ['*']
    }))
    
    const response = await fetch(`${API_BASE_URL}/members/equity/import/validate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer mock-token-for-development`,
        'X-Mock-Auth': JSON.stringify(mockUser),
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    return response.json()
  }

  async importEquityUpdates(companyId: string, formData: FormData): Promise<any> {
    const mockUser = JSON.parse(localStorage.getItem('mockUser') || JSON.stringify({
      id: 'dev-user-1',
      email: 'admin@example.com',
      companyId: 'cmbno3kq80000596mblh2id26',
      role: 'admin',
      permissions: ['*']
    }))
    
    const response = await fetch(`${API_BASE_URL}/members/equity/import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer mock-token-for-development`,
        'X-Mock-Auth': JSON.stringify(mockUser),
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    return response.json()
  }

  async createBoardApproval(companyId: string, data: any): Promise<any> {
    return this.fetchWithAuth('/members/equity/board-approval', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async approveBoardApproval(approvalId: string): Promise<any> {
    return this.fetchWithAuth(`/members/equity/board-approval/${approvalId}/approve`, {
      method: 'POST',
    })
  }

  async applyBoardApproval(approvalId: string): Promise<any> {
    return this.fetchWithAuth(`/members/equity/board-approval/${approvalId}/apply`, {
      method: 'POST',
    })
  }

  async calculateProRata(companyId: string, excludeIds?: string[]): Promise<any> {
    const params = excludeIds?.length ? `?excludeIds=${excludeIds.join(',')}` : ''
    return this.fetchWithAuth(`/members/equity/pro-rata-calculation${params}`)
  }

  async exportEquityTemplate(): Promise<Blob> {
    const response = await fetch(`${this.baseURL}/members/equity/export`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'X-Mock-Auth': JSON.stringify(this.mockAuth),
      },
    })
    
    if (!response.ok) {
      throw new Error('Failed to export equity template')
    }
    
    return response.blob()
  }

  async createBulkEquityUpdate(updates: any[], notes: string): Promise<any> {
    // Transform updates to match expected format
    const transformedUpdates = updates.map(u => ({
      memberId: u.memberId,
      newEquityPercentage: u.estimatedPercentage || u.newPercentage,
      changeReason: notes
    }))
    
    return this.fetchWithAuth('/members/equity/board-approval', {
      method: 'POST',
      body: JSON.stringify({
        updates: transformedUpdates,
        boardApprovalTitle: `Equity Update ${new Date().toISOString().split('T')[0]}`,
        boardApprovalDescription: notes,
        boardApprovalType: 'ANNUAL_EQUITY_UPDATE',
        boardApprovalDate: new Date().toISOString().split('T')[0],
        effectiveDate: new Date().toISOString().split('T')[0],
        notes,
      }),
    })
  }
}

export const memberApi = new MemberApiService()