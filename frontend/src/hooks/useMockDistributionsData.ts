import { useQuery } from '@tanstack/react-query'
import { useFiscalYear } from '@/contexts/FiscalYearContext'

export type DistributionType = 'quarterly' | 'annual' | 'special' | 'tax'
export type DistributionStatus = 'draft' | 'approved' | 'processing' | 'completed' | 'cancelled'

export interface Distribution {
  id: string
  fiscalYear: number
  distributionDate: string
  type: DistributionType
  status: DistributionStatus
  totalAmount: number
  description: string
  createdBy: string
  createdAt: string
  approvedBy?: string
  approvedAt?: string
  completedAt?: string
  memberDistributions: MemberDistribution[]
}

export interface MemberDistribution {
  memberId: string
  memberName: string
  equityPercentage: number
  distributionAmount: number
  paymentMethod: 'check' | 'ach' | 'wire'
  paymentStatus: 'pending' | 'sent' | 'completed' | 'failed'
  paymentDate?: string
  referenceNumber?: string
}

export const DISTRIBUTION_TYPE_LABELS: Record<DistributionType, string> = {
  quarterly: 'Quarterly',
  annual: 'Annual',
  special: 'Special',
  tax: 'Tax'
}

export const DISTRIBUTION_STATUS_LABELS: Record<DistributionStatus, string> = {
  draft: 'Draft',
  approved: 'Approved',
  processing: 'Processing',
  completed: 'Completed',
  cancelled: 'Cancelled'
}

// Generate mock distribution data
const generateMockDistributions = (fiscalYear: number): Distribution[] => {
  const distributions: Distribution[] = []
  
  // Generate quarterly distributions
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4']
  const baseAmount = 500000 // $500k per quarter
  
  quarters.forEach((quarter, index) => {
    const quarterDate = new Date(fiscalYear, index * 3 + 2, 15) // Middle of each quarter
    const isCurrentYear = fiscalYear === new Date().getFullYear()
    const isPastQuarter = quarterDate < new Date()
    
    let status: DistributionStatus = 'draft'
    if (isCurrentYear && !isPastQuarter) {
      status = 'draft'
    } else if (isPastQuarter) {
      status = 'completed'
    }
    
    const distribution: Distribution = {
      id: `dist-${fiscalYear}-${quarter}`,
      fiscalYear,
      distributionDate: quarterDate.toISOString().split('T')[0],
      type: 'quarterly',
      status,
      totalAmount: baseAmount + (Math.random() * 100000 - 50000), // Random variation
      description: `${quarter} ${fiscalYear} Quarterly Distribution`,
      createdBy: 'John Admin',
      createdAt: new Date(quarterDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      approvedBy: status !== 'draft' ? 'Jane CFO' : undefined,
      approvedAt: status !== 'draft' ? new Date(quarterDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      completedAt: status === 'completed' ? new Date(quarterDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      memberDistributions: generateMemberDistributions(baseAmount, status === 'completed')
    }
    
    distributions.push(distribution)
  })
  
  // Add annual distribution
  if (fiscalYear <= new Date().getFullYear()) {
    const annualDistribution: Distribution = {
      id: `dist-${fiscalYear}-annual`,
      fiscalYear,
      distributionDate: `${fiscalYear}-12-15`,
      type: 'annual',
      status: fiscalYear < new Date().getFullYear() ? 'completed' : 'approved',
      totalAmount: 1500000, // $1.5M annual bonus
      description: `FY ${fiscalYear} Annual Profit Distribution`,
      createdBy: 'John Admin',
      createdAt: `${fiscalYear}-12-01T10:00:00Z`,
      approvedBy: 'Jane CFO',
      approvedAt: `${fiscalYear}-12-10T14:00:00Z`,
      completedAt: fiscalYear < new Date().getFullYear() ? `${fiscalYear}-12-20T10:00:00Z` : undefined,
      memberDistributions: generateMemberDistributions(1500000, fiscalYear < new Date().getFullYear())
    }
    
    distributions.push(annualDistribution)
  }
  
  // Add a tax distribution
  if (fiscalYear === new Date().getFullYear()) {
    const taxDistribution: Distribution = {
      id: `dist-${fiscalYear}-tax`,
      fiscalYear,
      distributionDate: `${fiscalYear}-03-15`,
      type: 'tax',
      status: 'processing',
      totalAmount: 750000, // $750k for tax payments
      description: `FY ${fiscalYear} Tax Distribution for Estimated Payments`,
      createdBy: 'John Admin',
      createdAt: `${fiscalYear}-03-01T10:00:00Z`,
      approvedBy: 'Jane CFO',
      approvedAt: `${fiscalYear}-03-10T14:00:00Z`,
      memberDistributions: generateMemberDistributions(750000, false)
    }
    
    distributions.push(taxDistribution)
  }
  
  return distributions
}

const generateMemberDistributions = (totalAmount: number, isCompleted: boolean): MemberDistribution[] => {
  const members = [
    { id: '1', name: 'John Doe', equity: 0.15 },
    { id: '2', name: 'Jane Smith', equity: 0.12 },
    { id: '3', name: 'Robert Johnson', equity: 0.10 },
    { id: '4', name: 'Emily Davis', equity: 0.08 },
    { id: '5', name: 'Michael Chen', equity: 0.07 },
    { id: '6', name: 'Sarah Wilson', equity: 0.06 },
    { id: '7', name: 'David Brown', equity: 0.05 },
    { id: '8', name: 'Lisa Anderson', equity: 0.05 },
    { id: '9', name: 'James Taylor', equity: 0.04 },
    { id: '10', name: 'Maria Garcia', equity: 0.04 }
  ]
  
  // Ensure total adds up to less than 100%
  const remainingEquity = 1 - members.reduce((sum, m) => sum + m.equity, 0)
  const otherMembers = Array.from({ length: 15 }, (_, i) => ({
    id: `${i + 11}`,
    name: `Member ${i + 11}`,
    equity: remainingEquity / 15
  }))
  
  const allMembers = [...members, ...otherMembers]
  
  return allMembers.map(member => {
    const amount = totalAmount * member.equity
    const paymentMethods: Array<'check' | 'ach' | 'wire'> = ['check', 'ach', 'wire']
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)]
    
    let paymentStatus: MemberDistribution['paymentStatus'] = 'pending'
    let paymentDate: string | undefined
    let referenceNumber: string | undefined
    
    if (isCompleted) {
      paymentStatus = 'completed'
      paymentDate = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      referenceNumber = `REF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    } else if (Math.random() > 0.7) {
      paymentStatus = 'sent'
      paymentDate = new Date().toISOString().split('T')[0]
      referenceNumber = `REF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    }
    
    return {
      memberId: member.id,
      memberName: member.name,
      equityPercentage: member.equity * 100,
      distributionAmount: amount,
      paymentMethod,
      paymentStatus,
      paymentDate,
      referenceNumber
    }
  })
}

export function useMockDistributionsData() {
  const { currentFiscalYear } = useFiscalYear()
  
  return useQuery({
    queryKey: ['distributions', currentFiscalYear],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const distributions = generateMockDistributions(currentFiscalYear)
      
      // Calculate summary statistics
      const totalDistributed = distributions
        .filter(d => d.status === 'completed')
        .reduce((sum, d) => sum + d.totalAmount, 0)
      
      const pendingDistributions = distributions
        .filter(d => d.status === 'draft' || d.status === 'approved' || d.status === 'processing')
        .reduce((sum, d) => sum + d.totalAmount, 0)
      
      const averageDistribution = distributions.length > 0 
        ? distributions.reduce((sum, d) => sum + d.totalAmount, 0) / distributions.length
        : 0
        
      const upcomingDistributions = distributions
        .filter(d => d.status === 'draft' || d.status === 'approved')
        .length
      
      return {
        distributions,
        summary: {
          totalDistributed,
          pendingDistributions,
          averageDistribution,
          upcomingDistributions,
          totalDistributions: distributions.length,
          completedDistributions: distributions.filter(d => d.status === 'completed').length
        }
      }
    },
    refetchOnWindowFocus: false,
  })
}