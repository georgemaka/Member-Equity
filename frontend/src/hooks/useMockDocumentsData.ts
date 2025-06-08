import { useQuery } from '@tanstack/react-query'
import { Document, PaginatedDocuments, DocumentCategory, DocumentStatus, AccessLevel } from '@/types/document'

// Mock documents data
const mockDocuments: Document[] = [
  {
    id: 'doc-1',
    title: 'K-1 Tax Statements - FY 2024',
    filename: 'k1-statements-fy2024.pdf',
    description: 'Individual K-1 tax statements for all members for fiscal year 2024',
    fileType: 'pdf',
    fileSize: 2485760, // 2.4 MB
    uploadedBy: 'admin@sukut.com',
    uploadedAt: '2024-03-15T10:30:00Z',
    updatedAt: '2024-03-15T10:30:00Z',
    category: 'k1_statements',
    tags: ['tax', 'k1', '2024', 'annual'],
    isPublic: false,
    fiscalYear: 2024,
    url: '/documents/k1-statements-fy2024.pdf',
    downloadUrl: '/api/documents/doc-1/download',
    version: 1,
    status: 'active',
    accessLevel: 'members_only'
  },
  {
    id: 'doc-2',
    title: 'Quarterly Distribution Notice - Q1 2024',
    filename: 'distribution-q1-2024.pdf',
    description: 'Quarterly distribution notice and payment details for Q1 2024',
    fileType: 'pdf',
    fileSize: 524288, // 512 KB
    uploadedBy: 'accountant@sukut.com',
    uploadedAt: '2024-04-01T09:00:00Z',
    updatedAt: '2024-04-01T09:00:00Z',
    category: 'distribution_notices',
    tags: ['distribution', 'quarterly', 'q1', '2024'],
    isPublic: false,
    fiscalYear: 2024,
    url: '/documents/distribution-q1-2024.pdf',
    downloadUrl: '/api/documents/doc-2/download',
    version: 1,
    status: 'active',
    accessLevel: 'members_only'
  },
  {
    id: 'doc-3',
    title: 'Board Meeting Minutes - March 2024',
    filename: 'board-minutes-march-2024.pdf',
    description: 'Board meeting minutes covering equity adjustments and strategic decisions',
    fileType: 'pdf',
    fileSize: 1048576, // 1 MB
    uploadedBy: 'board@sukut.com',
    uploadedAt: '2024-03-20T16:45:00Z',
    updatedAt: '2024-03-20T16:45:00Z',
    category: 'board_minutes',
    tags: ['board', 'minutes', 'march', '2024', 'equity'],
    isPublic: false,
    fiscalYear: 2024,
    url: '/documents/board-minutes-march-2024.pdf',
    downloadUrl: '/api/documents/doc-3/download',
    version: 1,
    status: 'active',
    accessLevel: 'board_only'
  },
  {
    id: 'doc-4',
    title: 'Annual Financial Report - FY 2023',
    filename: 'annual-financial-report-2023.pdf',
    description: 'Comprehensive financial report including profit & loss, balance sheet, and cash flow',
    fileType: 'pdf',
    fileSize: 3145728, // 3 MB
    uploadedBy: 'admin@sukut.com',
    uploadedAt: '2024-02-01T14:20:00Z',
    updatedAt: '2024-02-15T10:30:00Z',
    category: 'financial_reports',
    tags: ['financial', 'annual', '2023', 'report', 'audit'],
    isPublic: false,
    fiscalYear: 2023,
    url: '/documents/annual-financial-report-2023.pdf',
    downloadUrl: '/api/documents/doc-4/download',
    version: 2,
    status: 'active',
    accessLevel: 'members_only'
  },
  {
    id: 'doc-5',
    title: 'Member Equity Agreement Template',
    filename: 'member-equity-agreement-template.docx',
    description: 'Standard template for new member equity agreements',
    fileType: 'docx',
    fileSize: 65536, // 64 KB
    uploadedBy: 'legal@sukut.com',
    uploadedAt: '2024-01-15T11:00:00Z',
    updatedAt: '2024-01-15T11:00:00Z',
    category: 'member_agreements',
    tags: ['template', 'agreement', 'equity', 'legal'],
    isPublic: false,
    url: '/documents/member-equity-agreement-template.docx',
    downloadUrl: '/api/documents/doc-5/download',
    version: 1,
    status: 'active',
    accessLevel: 'admin_only'
  },
  {
    id: 'doc-6',
    title: 'Company Policies Handbook',
    filename: 'company-policies-handbook.pdf',
    description: 'Comprehensive handbook of company policies and procedures',
    fileType: 'pdf',
    fileSize: 2097152, // 2 MB
    uploadedBy: 'hr@sukut.com',
    uploadedAt: '2024-01-10T08:30:00Z',
    updatedAt: '2024-03-01T15:45:00Z',
    category: 'policies',
    tags: ['policies', 'handbook', 'procedures', 'hr'],
    isPublic: true,
    url: '/documents/company-policies-handbook.pdf',
    downloadUrl: '/api/documents/doc-6/download',
    version: 3,
    status: 'active',
    accessLevel: 'public'
  },
  {
    id: 'doc-7',
    title: 'Tax Preparation Guidelines - 2024',
    filename: 'tax-preparation-guidelines-2024.pdf',
    description: 'Guidelines for members on tax preparation and K-1 statement usage',
    fileType: 'pdf',
    fileSize: 786432, // 768 KB
    uploadedBy: 'accountant@sukut.com',
    uploadedAt: '2024-02-20T13:15:00Z',
    updatedAt: '2024-02-20T13:15:00Z',
    category: 'tax_documents',
    tags: ['tax', 'guidelines', '2024', 'preparation'],
    isPublic: false,
    fiscalYear: 2024,
    url: '/documents/tax-preparation-guidelines-2024.pdf',
    downloadUrl: '/api/documents/doc-7/download',
    version: 1,
    status: 'active',
    accessLevel: 'members_only'
  },
  {
    id: 'doc-8',
    title: 'Audit Report - FY 2023',
    filename: 'audit-report-fy2023.pdf',
    description: 'External audit report for fiscal year 2023',
    fileType: 'pdf',
    fileSize: 1572864, // 1.5 MB
    uploadedBy: 'admin@sukut.com',
    uploadedAt: '2024-01-25T12:00:00Z',
    updatedAt: '2024-01-25T12:00:00Z',
    category: 'financial_reports',
    tags: ['audit', '2023', 'external', 'financial'],
    isPublic: false,
    fiscalYear: 2023,
    url: '/documents/audit-report-fy2023.pdf',
    downloadUrl: '/api/documents/doc-8/download',
    version: 1,
    status: 'active',
    accessLevel: 'board_only'
  }
]

interface UseMockDocumentsDataOptions {
  category?: DocumentCategory
  status?: DocumentStatus
  accessLevel?: AccessLevel
  fiscalYear?: number
  search?: string
}

export function useMockDocumentsData(
  page: number = 1, 
  limit: number = 10, 
  options: UseMockDocumentsDataOptions = {}
) {
  return useQuery({
    queryKey: ['documents', page, limit, options],
    queryFn: (): PaginatedDocuments => {
      let filteredDocuments = [...mockDocuments]

      // Apply filters
      if (options.category) {
        filteredDocuments = filteredDocuments.filter(doc => doc.category === options.category)
      }
      
      if (options.status) {
        filteredDocuments = filteredDocuments.filter(doc => doc.status === options.status)
      }
      
      if (options.accessLevel) {
        filteredDocuments = filteredDocuments.filter(doc => doc.accessLevel === options.accessLevel)
      }
      
      if (options.fiscalYear) {
        filteredDocuments = filteredDocuments.filter(doc => doc.fiscalYear === options.fiscalYear)
      }
      
      if (options.search) {
        const searchLower = options.search.toLowerCase()
        filteredDocuments = filteredDocuments.filter(doc => 
          doc.title.toLowerCase().includes(searchLower) ||
          doc.description?.toLowerCase().includes(searchLower) ||
          doc.tags.some(tag => tag.toLowerCase().includes(searchLower))
        )
      }

      // Sort by upload date (newest first)
      filteredDocuments.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

      // Paginate
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex)

      return {
        data: paginatedDocuments,
        total: filteredDocuments.length,
        page,
        limit,
        totalPages: Math.ceil(filteredDocuments.length / limit)
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to get a single document by ID
export function useMockDocumentById(documentId: string) {
  return useQuery({
    queryKey: ['document', documentId],
    queryFn: (): Document | undefined => {
      return mockDocuments.find(doc => doc.id === documentId)
    },
    staleTime: 5 * 60 * 1000,
  })
}