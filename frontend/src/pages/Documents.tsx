import { useState } from 'react'
import { useMockDocumentsData } from '@/hooks/useMockDocumentsData'
import { DocumentCategory, DocumentStatus, AccessLevel } from '@/types/document'
import { useToast } from '@/contexts/ToastContext'
import { useMockAuth } from '@/contexts/MockAuthContext'
import PermissionGuard from '@/components/PermissionGuard'
import {
  FolderIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  DocumentIcon,
  EyeIcon,
  TrashIcon,
  PencilIcon,
  CloudArrowUpIcon,
  TagIcon,
  CalendarDaysIcon,
  UserIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

const categoryLabels = {
  k1_statements: 'K-1 Statements',
  distribution_notices: 'Distribution Notices',
  board_minutes: 'Board Minutes',
  financial_reports: 'Financial Reports',
  tax_documents: 'Tax Documents',
  legal_documents: 'Legal Documents',
  member_agreements: 'Member Agreements',
  policies: 'Policies',
  other: 'Other'
}

const statusLabels = {
  draft: 'Draft',
  active: 'Active',
  archived: 'Archived',
  expired: 'Expired'
}

const accessLevelLabels = {
  public: 'Public',
  members_only: 'Members Only',
  board_only: 'Board Only',
  admin_only: 'Admin Only'
}

const categoryColors = {
  k1_statements: 'bg-blue-100 text-blue-800',
  distribution_notices: 'bg-green-100 text-green-800',
  board_minutes: 'bg-purple-100 text-purple-800',
  financial_reports: 'bg-indigo-100 text-indigo-800',
  tax_documents: 'bg-yellow-100 text-yellow-800',
  legal_documents: 'bg-red-100 text-red-800',
  member_agreements: 'bg-pink-100 text-pink-800',
  policies: 'bg-gray-100 text-gray-800',
  other: 'bg-orange-100 text-orange-800'
}

const accessLevelColors = {
  public: 'bg-green-100 text-green-800',
  members_only: 'bg-blue-100 text-blue-800',
  board_only: 'bg-purple-100 text-purple-800',
  admin_only: 'bg-red-100 text-red-800'
}

export default function Documents() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all')
  const [accessLevelFilter, setAccessLevelFilter] = useState<AccessLevel | 'all'>('all')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const { success } = useToast()
  const { hasPermission } = useMockAuth()

  // Build filter options
  const filterOptions = {
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    accessLevel: accessLevelFilter !== 'all' ? accessLevelFilter : undefined,
    search: searchTerm || undefined
  }

  const { data: documentsData, isLoading, error } = useMockDocumentsData(currentPage, pageSize, filterOptions)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return '📄'
      case 'doc':
      case 'docx':
        return '📝'
      case 'xls':
      case 'xlsx':
        return '📊'
      case 'ppt':
      case 'pptx':
        return '📈'
      default:
        return '📎'
    }
  }

  const handleDownload = (document: any) => {
    // Mock download functionality
    success('Download Started', `Downloading ${document.title}`)
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    setCategoryFilter('all')
    setStatusFilter('all')
    setAccessLevelFilter('all')
  }

  const hasActiveFilters = searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' || accessLevelFilter !== 'all'

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 px-6 py-8 mb-8">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:flex-auto">
              <h1 className="text-3xl font-bold text-white">Document Management</h1>
              <p className="mt-2 text-indigo-100">
                Manage company documents, member resources, and important files.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center px-3 py-2 border border-white/20 shadow-sm text-sm leading-4 font-medium rounded-lg text-white transition-all duration-200 ${
                  showFilters ? 'bg-white/20' : 'bg-white/10 hover:bg-white/20'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white`}
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filters
              </button>
              <PermissionGuard permission="documents:write" fallback={null}>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-lg text-indigo-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200 transform hover:scale-105"
                >
                  <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                  Upload Document
                </button>
              </PermissionGuard>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search documents..."
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all duration-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Quick Filters */}
          <div className="flex gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as DocumentCategory | 'all')}
              className="px-3 py-3 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
            >
              <option value="all">All Categories</option>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as DocumentStatus | 'all')}
              className="px-3 py-3 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
            >
              <option value="all">All Status</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-500">Active filters:</span>
            {searchTerm && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Search: "{searchTerm}"
                <button
                  onClick={() => setSearchTerm('')}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-600 hover:bg-blue-200 hover:text-blue-800"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            {categoryFilter !== 'all' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Category: {categoryLabels[categoryFilter]}
                <button
                  onClick={() => setCategoryFilter('all')}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-green-600 hover:bg-green-200 hover:text-green-800"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Status: {statusLabels[statusFilter]}
                <button
                  onClick={() => setStatusFilter('all')}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-purple-600 hover:bg-purple-200 hover:text-purple-800"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            <button
              onClick={clearAllFilters}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Documents Grid */}
      <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading documents...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-sm text-red-600">Failed to load documents</p>
          </div>
        ) : documentsData?.data.length === 0 ? (
          <div className="p-12 text-center">
            <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-sm text-gray-500 mb-4">
              {hasActiveFilters ? 'Try adjusting your filters' : 'Upload your first document to get started'}
            </p>
            <PermissionGuard permission="documents:write" fallback={null}>
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Upload Document
              </button>
            </PermissionGuard>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {documentsData.data.map((document) => (
                <div key={document.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{getFileIcon(document.fileType)}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">{document.title}</h3>
                        <p className="text-xs text-gray-500">{document.filename}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1 mb-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${categoryColors[document.category]}`}>
                        {categoryLabels[document.category]}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${accessLevelColors[document.accessLevel]}`}>
                        {accessLevelLabels[document.accessLevel]}
                      </span>
                    </div>
                    
                    {document.description && (
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">{document.description}</p>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{formatFileSize(document.fileSize)}</span>
                      <span>{new Date(document.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleDownload(document)}
                        className="p-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded transition-colors duration-200"
                        title="Download"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                      </button>
                      <button
                        className="p-1.5 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors duration-200"
                        title="View"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <PermissionGuard permission="documents:write" fallback={null}>
                        <button
                          className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors duration-200"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      </PermissionGuard>
                      <PermissionGuard permission="documents:delete" fallback={null}>
                        <button
                          className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors duration-200"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </PermissionGuard>
                    </div>
                    
                    {document.tags.length > 0 && (
                      <div className="flex items-center">
                        <TagIcon className="h-3 w-3 text-gray-400 mr-1" />
                        <span className="text-xs text-gray-500">{document.tags.length}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {documentsData && documentsData.totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(documentsData.totalPages, currentPage + 1))}
                    disabled={currentPage === documentsData.totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span>
                      {' '}to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * pageSize, documentsData.total)}
                      </span>
                      {' '}of{' '}
                      <span className="font-medium">{documentsData.total}</span>
                      {' '}results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200"
                      >
                        Previous
                      </button>
                      {[...Array(Math.min(documentsData.totalPages, 10))].map((_, index) => {
                        const pageNum = index + 1
                        const isCurrentPage = currentPage === pageNum
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors duration-200 ${
                              isCurrentPage
                                ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}
                      <button
                        onClick={() => setCurrentPage(Math.min(documentsData.totalPages, currentPage + 1))}
                        disabled={currentPage === documentsData.totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Upload Modal Placeholder */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Document</h3>
            <p className="text-sm text-gray-500 mb-4">Document upload functionality would be implemented here.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowUploadModal(false)
                  success('Upload Complete', 'Document uploaded successfully')
                }}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}