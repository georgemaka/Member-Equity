export interface Document {
  id: string
  title: string
  filename: string
  description?: string
  fileType: string
  fileSize: number
  uploadedBy: string
  uploadedAt: string
  updatedAt: string
  category: DocumentCategory
  tags: string[]
  isPublic: boolean
  memberId?: string // For member-specific documents
  fiscalYear?: number
  url: string
  downloadUrl: string
  thumbnailUrl?: string
  version: number
  status: DocumentStatus
  accessLevel: AccessLevel
}

export type DocumentCategory = 
  | 'k1_statements'
  | 'distribution_notices'
  | 'board_minutes'
  | 'financial_reports'
  | 'tax_documents'
  | 'legal_documents'
  | 'member_agreements'
  | 'policies'
  | 'other'

export type DocumentStatus = 'draft' | 'active' | 'archived' | 'expired'

export type AccessLevel = 'public' | 'members_only' | 'board_only' | 'admin_only'

export interface DocumentFilter {
  category?: DocumentCategory
  status?: DocumentStatus
  accessLevel?: AccessLevel
  uploadedBy?: string
  fiscalYear?: number
  tags?: string[]
  dateRange?: {
    start: string
    end: string
  }
}

export interface DocumentUpload {
  file: File
  title: string
  description?: string
  category: DocumentCategory
  tags: string[]
  isPublic: boolean
  memberId?: string
  fiscalYear?: number
  accessLevel: AccessLevel
}

export interface DocumentVersion {
  id: string
  documentId: string
  version: number
  filename: string
  fileSize: number
  uploadedBy: string
  uploadedAt: string
  changelog?: string
  url: string
}

export interface PaginatedDocuments {
  data: Document[]
  total: number
  page: number
  limit: number
  totalPages: number
}