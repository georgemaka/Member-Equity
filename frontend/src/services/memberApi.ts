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
  UploadResult
} from '@/types/member'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api/v1'

class MemberApiService {
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

  async getMembers(page = 1, limit = 10, fiscalYear?: number): Promise<PaginatedMembers> {
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

  async uploadMembers(file: File, skipValidation = false, dryRun = false): Promise<UploadResult> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('skipValidation', skipValidation.toString())
    formData.append('dryRun', dryRun.toString())

    const token = 'mock-token-for-development'
    
    const response = await fetch(`${API_BASE_URL}/members/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
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
    const token = 'mock-token-for-development'
    
    const response = await fetch(`${API_BASE_URL}/members/upload/template`, {
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

export const memberApi = new MemberApiService()