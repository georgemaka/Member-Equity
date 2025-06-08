export type MemberStatus = 'active' | 'retired' | 'resigned' | 'terminated' | 'deceased' | 'suspended' | 'probationary'

export interface Member {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  jobTitle?: string
  // Unique identifiers for tax payment uploads
  socialSecurityNumber?: string
  taxId?: string
  employeeId?: string
  joinDate: string
  hireDate?: string
  companyId: string
  createdAt: string
  updatedAt: string
  // Current year data
  currentEquity?: MemberYearlyEquity
  currentStatus?: MemberYearlyStatus
  // Historical data
  equityHistory?: MemberYearlyEquity[]
  statusHistory?: MemberYearlyStatus[]
  // Legacy fields for backward compatibility
  isActive: boolean
  retirementDate?: string
  retirementReason?: string
}

export interface MemberYearlyStatus {
  id: string
  memberId: string
  fiscalYear: number
  status: MemberStatus
  effectiveDate: string
  reason?: string
  notes?: string
  changedBy?: string
  createdAt: string
  updatedAt: string
}

export interface MemberYearlyEquity {
  id: string
  memberId: string
  fiscalYear: number
  estimatedPercentage: number
  finalPercentage?: number
  capitalBalance: number
  isFinalized: boolean
  finalizedDate?: string
  finalizedBy?: string
  createdAt: string
  updatedAt: string
}

export interface CreateMemberDto {
  firstName: string
  lastName: string
  email: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  jobTitle?: string
  socialSecurityNumber?: string
  taxId?: string
  employeeId?: string
  joinDate: string
  hireDate?: string
  estimatedPercentage: number
}

export interface UpdateMemberDto {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  jobTitle?: string
  socialSecurityNumber?: string
  taxId?: string
  employeeId?: string
  hireDate?: string
}

export interface UpdateMemberStatusDto {
  fiscalYear: number
  status: MemberStatus
  effectiveDate: string
  reason: string
  notes?: string
}

export interface UpdateEquityDto {
  fiscalYear: number
  estimatedPercentage?: number
  finalPercentage?: number
  capitalBalance?: number
  reason: string
}

export interface BulkEquityUpdateDto {
  updates: Array<{
    memberId: string
    estimatedPercentage?: number
    finalPercentage?: number
    capitalBalance?: number
  }>
  fiscalYear: number
  reason: string
}

export interface BoardMeetingEquityView {
  member: Member
  currentEquity: MemberYearlyEquity
  canUpdate: boolean
}

export interface MemberEquityHistory {
  id: string
  eventType: string
  equityPercentage: number
  reason: string
  date: string
  createdBy: string
}

export interface MemberBalanceHistory {
  id: string
  eventType: string
  amount: number
  reason: string
  date: string
  createdBy: string
}

export interface PaginatedMembers {
  data: Member[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface UploadResult {
  success: boolean
  message: string
  processedCount: number
  errorCount: number
  errors: string[]
  warnings: string[]
}