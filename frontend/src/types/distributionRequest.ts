export interface DistributionRequest {
  id: string
  requestNumber: string // Auto-generated: DR-2024-001
  memberId: string
  memberName: string
  requestedBy: string
  requestedByEmail: string
  requestedDate: string
  
  // Distribution Details
  distributionType: DistributionType
  amount: number
  reason: string
  description?: string
  payoutMethod: PayoutMethod
  accountCode: string
  accountDescription: string
  requestedPaymentDate: string
  
  // Approval Chain
  currentApprover: string
  currentApproverEmail: string
  approvalChain: ApprovalStep[]
  
  // Status & Tracking
  status: RequestStatus
  priority: RequestPriority
  createdAt: string
  updatedAt: string
  
  // Attachments & Comments
  attachments: RequestAttachment[]
  comments: RequestComment[]
  
  // Final Processing
  checkRequestId?: string
  paymentStatus?: PaymentStatus
  actualPaymentDate?: string
  transactionReference?: string
}

export type DistributionType = 
  | 'quarterly'
  | 'annual' 
  | 'special'
  | 'tax'
  | 'emergency'
  | 'bonus'
  | 'return_of_capital'

export type PayoutMethod = 
  | 'wire_transfer'
  | 'check'
  | 'ach'
  | 'direct_deposit'

export type RequestStatus = 
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'edit_requested'
  | 'cancelled'
  | 'payment_pending'
  | 'payment_processing'
  | 'paid'
  | 'failed'

export type RequestPriority = 'low' | 'normal' | 'high' | 'urgent'

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface ApprovalStep {
  id: string
  approverId: string
  approverName: string
  approverEmail: string
  approverRole: string
  order: number
  status: 'pending' | 'approved' | 'rejected' | 'edit_requested'
  action?: 'approve' | 'reject' | 'request_edit'
  comments?: string
  actionDate?: string
  requiredApproval: boolean
}

export interface RequestComment {
  id: string
  userId: string
  userName: string
  userRole: string
  comment: string
  isInternal: boolean
  createdAt: string
}

export interface RequestAttachment {
  id: string
  filename: string
  fileSize: number
  fileType: string
  uploadedBy: string
  uploadedAt: string
  url: string
}

export interface ApprovalRule {
  id: string
  name: string
  description: string
  conditions: ApprovalCondition[]
  approvers: ApprovalLevel[]
  isActive: boolean
}

export interface ApprovalCondition {
  field: 'amount' | 'distributionType' | 'memberId' | 'requestedBy'
  operator: 'equals' | 'greater_than' | 'less_than' | 'in' | 'not_in'
  value: any
}

export interface ApprovalLevel {
  level: number
  approverRole: string
  approverIds?: string[]
  requiresAll: boolean // true = all approvers must approve, false = any one can approve
}

export interface CheckRequest {
  id: string
  distributionRequestId: string
  checkNumber?: string
  payeeId: string
  payeeName: string
  amount: number
  paymentMethod: PayoutMethod
  accountCode: string
  description: string
  requestedDate: string
  approvedBy: string
  status: PaymentStatus
  createdAt: string
  
  // Banking Details (for wire transfers)
  bankName?: string
  routingNumber?: string
  accountNumber?: string
  
  // Mailing Details (for checks)
  mailingAddress?: {
    street: string
    city: string
    state: string
    zipCode: string
  }
}

export interface DistributionRequestFilter {
  status?: RequestStatus[]
  distributionType?: DistributionType[]
  requestedBy?: string
  memberId?: string
  amountRange?: {
    min: number
    max: number
  }
  dateRange?: {
    start: string
    end: string
  }
  priority?: RequestPriority[]
}

export interface DistributionRequestSummary {
  totalRequests: number
  pendingApproval: number
  approved: number
  rejected: number
  totalAmount: number
  avgProcessingTime: number // in hours
  upcomingPayments: number
}