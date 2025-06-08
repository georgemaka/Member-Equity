import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DistributionRequest, RequestStatus, DistributionType, PayoutMethod, ApprovalStep } from '@/types/distributionRequest'

// Mock distribution requests data
const mockDistributionRequests: DistributionRequest[] = [
  {
    id: 'dr-001',
    requestNumber: 'DR-2024-001',
    memberId: 'member-1',
    memberName: 'John Smith',
    requestedBy: 'admin@sukut.com',
    requestedByEmail: 'admin@sukut.com',
    requestedDate: '2024-06-01T10:00:00Z',
    
    distributionType: 'quarterly',
    amount: 15000,
    reason: 'Q2 2024 Quarterly Distribution',
    description: 'Standard quarterly profit distribution based on equity percentage',
    payoutMethod: 'wire_transfer',
    accountCode: '7100-001',
    accountDescription: 'Member Distributions - Quarterly',
    requestedPaymentDate: '2024-06-15T00:00:00Z',
    
    currentApprover: 'cfo@sukut.com',
    currentApproverEmail: 'cfo@sukut.com',
    approvalChain: [
      {
        id: 'step-1',
        approverId: 'cfo@sukut.com',
        approverName: 'Chief Financial Officer',
        approverEmail: 'cfo@sukut.com',
        approverRole: 'CFO',
        order: 1,
        status: 'pending',
        requiredApproval: true
      }
    ],
    
    status: 'pending_approval',
    priority: 'normal',
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: '2024-06-01T10:00:00Z',
    
    attachments: [],
    comments: [
      {
        id: 'comment-1',
        userId: 'admin@sukut.com',
        userName: 'System Administrator',
        userRole: 'Admin',
        comment: 'Standard quarterly distribution request created automatically',
        isInternal: true,
        createdAt: '2024-06-01T10:00:00Z'
      }
    ]
  },
  {
    id: 'dr-002',
    requestNumber: 'DR-2024-002',
    memberId: 'member-2',
    memberName: 'Sarah Johnson',
    requestedBy: 'hr@sukut.com',
    requestedByEmail: 'hr@sukut.com',
    requestedDate: '2024-06-02T14:30:00Z',
    
    distributionType: 'special',
    amount: 25000,
    reason: 'Project Completion Bonus',
    description: 'Special distribution for successful completion of Highway 101 project ahead of schedule',
    payoutMethod: 'check',
    accountCode: '7200-002',
    accountDescription: 'Special Member Distributions',
    requestedPaymentDate: '2024-06-10T00:00:00Z',
    
    currentApprover: 'board@sukut.com',
    currentApproverEmail: 'board@sukut.com',
    approvalChain: [
      {
        id: 'step-1',
        approverId: 'cfo@sukut.com',
        approverName: 'Chief Financial Officer',
        approverEmail: 'cfo@sukut.com',
        approverRole: 'CFO',
        order: 1,
        status: 'approved',
        action: 'approve',
        comments: 'Approved - funds available and project completion verified',
        actionDate: '2024-06-02T16:00:00Z',
        requiredApproval: true
      },
      {
        id: 'step-2',
        approverId: 'board@sukut.com',
        approverName: 'Board of Directors',
        approverEmail: 'board@sukut.com',
        approverRole: 'Board',
        order: 2,
        status: 'pending',
        requiredApproval: true
      }
    ],
    
    status: 'pending_approval',
    priority: 'high',
    createdAt: '2024-06-02T14:30:00Z',
    updatedAt: '2024-06-02T16:00:00Z',
    
    attachments: [
      {
        id: 'att-1',
        filename: 'project-completion-report.pdf',
        fileSize: 1048576,
        fileType: 'pdf',
        uploadedBy: 'hr@sukut.com',
        uploadedAt: '2024-06-02T14:30:00Z',
        url: '/attachments/project-completion-report.pdf'
      }
    ],
    comments: [
      {
        id: 'comment-1',
        userId: 'hr@sukut.com',
        userName: 'HR Manager',
        userRole: 'HR',
        comment: 'Project completed 2 weeks ahead of schedule with excellent quality metrics',
        isInternal: false,
        createdAt: '2024-06-02T14:30:00Z'
      },
      {
        id: 'comment-2',
        userId: 'cfo@sukut.com',
        userName: 'Chief Financial Officer',
        userRole: 'CFO',
        comment: 'Financial review complete. Project profitability exceeded expectations.',
        isInternal: true,
        createdAt: '2024-06-02T16:00:00Z'
      }
    ]
  },
  {
    id: 'dr-003',
    requestNumber: 'DR-2024-003',
    memberId: 'member-3',
    memberName: 'Mike Chen',
    requestedBy: 'cfo@sukut.com',
    requestedByEmail: 'cfo@sukut.com',
    requestedDate: '2024-05-28T09:15:00Z',
    
    distributionType: 'emergency',
    amount: 8000,
    reason: 'Emergency Personal Distribution',
    description: 'Emergency distribution for medical expenses - family emergency',
    payoutMethod: 'wire_transfer',
    accountCode: '7300-001',
    accountDescription: 'Emergency Member Distributions',
    requestedPaymentDate: '2024-05-29T00:00:00Z',
    
    currentApprover: '',
    currentApproverEmail: '',
    approvalChain: [
      {
        id: 'step-1',
        approverId: 'ceo@sukut.com',
        approverName: 'Chief Executive Officer',
        approverEmail: 'ceo@sukut.com',
        approverRole: 'CEO',
        order: 1,
        status: 'approved',
        action: 'approve',
        comments: 'Approved for emergency medical expenses. Expedite payment.',
        actionDate: '2024-05-28T11:00:00Z',
        requiredApproval: true
      }
    ],
    
    status: 'approved',
    priority: 'urgent',
    createdAt: '2024-05-28T09:15:00Z',
    updatedAt: '2024-05-28T11:00:00Z',
    
    checkRequestId: 'cr-001',
    paymentStatus: 'completed',
    actualPaymentDate: '2024-05-29T14:30:00Z',
    transactionReference: 'WI240529-001',
    
    attachments: [],
    comments: [
      {
        id: 'comment-1',
        userId: 'member-3',
        userName: 'Mike Chen',
        userRole: 'Member',
        comment: 'Thank you for the quick approval. This helps immensely with the medical bills.',
        isInternal: false,
        createdAt: '2024-05-29T16:00:00Z'
      }
    ]
  }
]

interface UseDistributionRequestsOptions {
  status?: RequestStatus[]
  memberId?: string
  requestedBy?: string
}

export function useMockDistributionRequests(options: UseDistributionRequestsOptions = {}) {
  return useQuery({
    queryKey: ['distributionRequests', options],
    queryFn: () => {
      let filtered = [...mockDistributionRequests]
      
      if (options.status && options.status.length > 0) {
        filtered = filtered.filter(req => options.status!.includes(req.status))
      }
      
      if (options.memberId) {
        filtered = filtered.filter(req => req.memberId === options.memberId)
      }
      
      if (options.requestedBy) {
        filtered = filtered.filter(req => req.requestedBy === options.requestedBy)
      }
      
      // Sort by created date (newest first)
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      
      return filtered
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useMockDistributionRequestById(requestId: string) {
  return useQuery({
    queryKey: ['distributionRequest', requestId],
    queryFn: () => {
      return mockDistributionRequests.find(req => req.id === requestId)
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateDistributionRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (requestData: Partial<DistributionRequest>) => {
      // Mock API call
      const newRequest: DistributionRequest = {
        id: `dr-${Date.now()}`,
        requestNumber: `DR-2024-${String(mockDistributionRequests.length + 1).padStart(3, '0')}`,
        ...requestData,
        status: 'pending_approval',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attachments: [],
        comments: [
          {
            id: `comment-${Date.now()}`,
            userId: requestData.requestedBy || '',
            userName: 'System',
            userRole: 'System',
            comment: 'Distribution request created',
            isInternal: true,
            createdAt: new Date().toISOString()
          }
        ]
      } as DistributionRequest
      
      mockDistributionRequests.unshift(newRequest)
      return newRequest
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distributionRequests'] })
    }
  })
}

export function useApproveDistributionRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      requestId, 
      action, 
      comments 
    }: { 
      requestId: string
      action: 'approve' | 'reject' | 'request_edit'
      comments?: string 
    }) => {
      // Mock approval logic
      const request = mockDistributionRequests.find(r => r.id === requestId)
      if (!request) throw new Error('Request not found')
      
      // Update current approval step
      const currentStep = request.approvalChain.find(step => step.status === 'pending')
      if (currentStep) {
        currentStep.status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'edit_requested'
        currentStep.action = action
        currentStep.comments = comments
        currentStep.actionDate = new Date().toISOString()
      }
      
      // Update request status
      if (action === 'reject') {
        request.status = 'rejected'
      } else if (action === 'request_edit') {
        request.status = 'edit_requested'
      } else if (action === 'approve') {
        const nextPendingStep = request.approvalChain.find(step => step.status === 'pending')
        if (nextPendingStep) {
          request.currentApprover = nextPendingStep.approverId
          request.currentApproverEmail = nextPendingStep.approverEmail
        } else {
          request.status = 'approved'
          request.currentApprover = ''
          request.currentApproverEmail = ''
        }
      }
      
      request.updatedAt = new Date().toISOString()
      
      // Add comment
      if (comments) {
        request.comments.push({
          id: `comment-${Date.now()}`,
          userId: currentStep?.approverId || '',
          userName: currentStep?.approverName || '',
          userRole: currentStep?.approverRole || '',
          comment: comments,
          isInternal: true,
          createdAt: new Date().toISOString()
        })
      }
      
      return request
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distributionRequests'] })
    }
  })
}

export function useMockDistributionRequestSummary() {
  return useQuery({
    queryKey: ['distributionRequestSummary'],
    queryFn: () => {
      const requests = mockDistributionRequests
      
      return {
        totalRequests: requests.length,
        pendingApproval: requests.filter(r => r.status === 'pending_approval').length,
        approved: requests.filter(r => r.status === 'approved').length,
        rejected: requests.filter(r => r.status === 'rejected').length,
        totalAmount: requests.reduce((sum, r) => sum + r.amount, 0),
        avgProcessingTime: 24, // Mock: 24 hours average
        upcomingPayments: requests.filter(r => r.status === 'approved' && !r.paymentStatus).length
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}