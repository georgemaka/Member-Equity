import { useState } from 'react'
import { useMockDistributionRequestById, useApproveDistributionRequest } from '@/hooks/useMockDistributionRequests'
import { useToast } from '@/contexts/ToastContext'
import { useMockAuth } from '@/contexts/MockAuthContext'
import PermissionGuard from './PermissionGuard'
import {
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  ArrowRightIcon,
  BanknotesIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline'

interface DistributionRequestDetailModalProps {
  requestId: string | null
  isOpen: boolean
  onClose: () => void
}

const statusLabels = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  edit_requested: 'Edit Requested',
  cancelled: 'Cancelled',
  payment_pending: 'Payment Pending',
  payment_processing: 'Payment Processing',
  paid: 'Paid',
  failed: 'Failed'
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  pending_approval: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  edit_requested: 'bg-orange-100 text-orange-800',
  cancelled: 'bg-gray-100 text-gray-800',
  payment_pending: 'bg-blue-100 text-blue-800',
  payment_processing: 'bg-indigo-100 text-indigo-800',
  paid: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-red-100 text-red-800'
}

const distributionTypeLabels = {
  quarterly: 'Quarterly Distribution',
  annual: 'Annual Distribution',
  special: 'Special Distribution',
  tax: 'Tax Distribution',
  emergency: 'Emergency Distribution',
  bonus: 'Performance Bonus',
  return_of_capital: 'Return of Capital'
}

const payoutMethodLabels = {
  wire_transfer: 'Wire Transfer',
  check: 'Check',
  ach: 'ACH Transfer',
  direct_deposit: 'Direct Deposit'
}

export default function DistributionRequestDetailModal({
  requestId,
  isOpen,
  onClose
}: DistributionRequestDetailModalProps) {
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | 'request_edit'>('approve')
  const [approvalComments, setApprovalComments] = useState('')
  const [newComment, setNewComment] = useState('')

  const { data: request, isLoading } = useMockDistributionRequestById(requestId || '')
  const approveRequest = useApproveDistributionRequest()
  const { success, error } = useToast()
  const { user } = useMockAuth()

  const canApprove = request && user?.email === request.currentApproverEmail
  const isApprover = request?.approvalChain.some(step => step.approverEmail === user?.email)

  const handleApprovalSubmit = async () => {
    if (!request) return

    try {
      await approveRequest.mutateAsync({
        requestId: request.id,
        action: approvalAction,
        comments: approvalComments
      })

      const actionText = approvalAction === 'approve' ? 'approved' : approvalAction === 'reject' ? 'rejected' : 'requested edit for'
      success('Action Complete', `Request ${actionText} successfully`)
      
      setShowApprovalModal(false)
      setApprovalComments('')
    } catch (err) {
      error('Action Failed', 'Failed to process approval action')
    }
  }

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'edit_requested':
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'normal':
        return 'bg-blue-100 text-blue-800'
      case 'low':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  if (!isOpen || !requestId) return null

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500 text-center">Loading request...</p>
        </div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl p-6">
          <p className="text-sm text-red-600">Request not found</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center mr-4">
                <BanknotesIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{request.requestNumber}</h3>
                <p className="text-sm text-gray-500">{request.reason}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[request.status]}`}>
                {statusLabels[request.status]}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                {request.priority.toUpperCase()}
              </span>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Request Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Request Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Request Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Member</label>
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{request.memberName}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Amount</label>
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-semibold text-gray-900">${request.amount.toLocaleString()}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                      <span className="text-sm text-gray-900">{distributionTypeLabels[request.distributionType]}</span>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Payout Method</label>
                      <div className="flex items-center">
                        <CreditCardIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{payoutMethodLabels[request.payoutMethod]}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Payment Date</label>
                      <div className="flex items-center">
                        <CalendarDaysIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{new Date(request.requestedPaymentDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">GL Account</label>
                      <span className="text-sm text-gray-900">{request.accountCode} - {request.accountDescription}</span>
                    </div>
                  </div>
                  
                  {request.description && (
                    <div className="mt-4">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                      <p className="text-sm text-gray-900">{request.description}</p>
                    </div>
                  )}
                </div>

                {/* Approval Chain */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Approval Workflow</h4>
                  <div className="space-y-3">
                    {request.approvalChain.map((step, index) => (
                      <div key={step.id} className="flex items-center">
                        <div className="flex-shrink-0 mr-4">
                          {getStepStatusIcon(step.status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{step.approverName}</p>
                              <p className="text-xs text-gray-500">{step.approverRole}</p>
                            </div>
                            <div className="text-right">
                              {step.actionDate && (
                                <p className="text-xs text-gray-500">{new Date(step.actionDate).toLocaleDateString()}</p>
                              )}
                            </div>
                          </div>
                          {step.comments && (
                            <p className="text-xs text-gray-600 mt-1 italic">"{step.comments}"</p>
                          )}
                        </div>
                        {index < request.approvalChain.length - 1 && (
                          <ArrowRightIcon className="h-4 w-4 text-gray-400 ml-4" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comments Section */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Comments & History</h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {request.comments.map((comment) => (
                      <div key={comment.id} className="flex space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">
                              {comment.userName.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">{comment.userName}</p>
                            <p className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleDateString()}</p>
                          </div>
                          <p className="text-sm text-gray-600">{comment.comment}</p>
                          {comment.isInternal && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">Internal</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Comment */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex space-x-3">
                      <div className="flex-1">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Add a comment..."
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        />
                      </div>
                      <button
                        onClick={() => {
                          // Mock add comment functionality
                          setNewComment('')
                          success('Comment Added', 'Your comment has been added')
                        }}
                        disabled={!newComment.trim()}
                        className="px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Actions */}
              <div className="space-y-6">
                {/* Request Summary */}
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                  <h4 className="text-sm font-medium text-green-900 mb-3">Request Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700">Requested:</span>
                      <span className="font-medium text-green-900">{new Date(request.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Requested by:</span>
                      <span className="font-medium text-green-900">{request.requestedBy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Amount:</span>
                      <span className="font-semibold text-green-900">${request.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Status:</span>
                      <span className="font-medium text-green-900">{statusLabels[request.status]}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                {request.paymentStatus && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="text-sm font-medium text-blue-900 mb-3">Payment Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Payment Status:</span>
                        <span className="font-medium text-blue-900">{request.paymentStatus}</span>
                      </div>
                      {request.actualPaymentDate && (
                        <div className="flex justify-between">
                          <span className="text-blue-700">Paid Date:</span>
                          <span className="font-medium text-blue-900">{new Date(request.actualPaymentDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {request.transactionReference && (
                        <div className="flex justify-between">
                          <span className="text-blue-700">Reference:</span>
                          <span className="font-medium text-blue-900">{request.transactionReference}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {canApprove && request.status === 'pending_approval' && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-900">Approval Actions</h4>
                    
                    <button
                      onClick={() => {
                        setApprovalAction('approve')
                        setShowApprovalModal(true)
                      }}
                      className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Approve Request
                    </button>
                    
                    <button
                      onClick={() => {
                        setApprovalAction('request_edit')
                        setShowApprovalModal(true)
                      }}
                      className="w-full flex items-center justify-center px-4 py-2 border border-orange-300 text-sm font-medium rounded-lg text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors duration-200"
                    >
                      <PencilSquareIcon className="h-4 w-4 mr-2" />
                      Request Edit
                    </button>
                    
                    <button
                      onClick={() => {
                        setApprovalAction('reject')
                        setShowApprovalModal(true)
                      }}
                      className="w-full flex items-center justify-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                    >
                      <XCircleIcon className="h-4 w-4 mr-2" />
                      Reject Request
                    </button>
                  </div>
                )}

                {/* Additional Info */}
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Created: {new Date(request.createdAt).toLocaleString()}</p>
                  <p>Updated: {new Date(request.updatedAt).toLocaleString()}</p>
                  {request.checkRequestId && (
                    <p>Check Request: {request.checkRequestId}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {approvalAction === 'approve' ? 'Approve Request' : 
               approvalAction === 'reject' ? 'Reject Request' : 'Request Edit'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {approvalAction === 'approve' ? 'This will approve the distribution request and move it to the next step.' :
               approvalAction === 'reject' ? 'This will reject the distribution request.' :
               'This will request changes to the distribution request.'}
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments {approvalAction !== 'approve' && '(Required)'}
              </label>
              <textarea
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Add your comments..."
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowApprovalModal(false)
                  setApprovalComments('')
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApprovalSubmit}
                disabled={approveRequest.isPending || (approvalAction !== 'approve' && !approvalComments.trim())}
                className={`px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white transition-colors duration-200 disabled:opacity-50 ${
                  approvalAction === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                  approvalAction === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {approveRequest.isPending ? 'Processing...' : 
                 approvalAction === 'approve' ? 'Approve' :
                 approvalAction === 'reject' ? 'Reject' : 'Request Edit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}