import { useState, useEffect } from 'react'
import { 
  CompanyFinancials,
  MemberAllocation,
  AllocationPreview,
  AllocationSummary,
  YearEndProcess,
  BalanceSheetReconciliation
} from '@/types/financials'
import { Member } from '@/types/member'

// Mock data for company financials
const generateMockFinancials = (fiscalYear: number): CompanyFinancials => {
  const netIncome = Math.floor(Math.random() * 5000000) + 10000000 // $10M - $15M
  const accruals = Math.floor(Math.random() * 1000000) + 500000 // $500K - $1.5M
  const adjustments = Math.floor(Math.random() * 500000) - 250000 // -$250K to $250K
  const finalAllocableAmount = netIncome + accruals + adjustments
  
  return {
    id: `fin-${fiscalYear}`,
    companyId: 'sukut-construction',
    fiscalYear,
    netIncome,
    accruals,
    adjustments,
    finalAllocableAmount,
    sofrRate: Math.round((2.0 + Math.random() * 1.0) * 100) / 100, // 2.0% - 3.0% (more realistic range)
    sofrSource: 'Federal Reserve Bank of New York',
    sofrPeriod: `FY ${fiscalYear} Annual Average`,
    totalEquityBalanceSheet: finalAllocableAmount * 2.5, // Approximation
    totalMemberCapitalAccounts: finalAllocableAmount * 2.4,
    reconciliationDifference: Math.random() * 10000 - 5000, // ±$5K
    isReconciled: Math.random() > 0.3,
    isAllocated: Math.random() > 0.5,
    allocationDate: new Date(`${fiscalYear}-12-31`).toISOString(),
    allocatedBy: 'John Smith',
    notes: 'Year-end allocation processed successfully',
    createdAt: new Date(`${fiscalYear}-12-15`).toISOString(),
    updatedAt: new Date(`${fiscalYear}-12-31`).toISOString(),
    createdBy: 'CFO',
    lastModifiedBy: 'Controller'
  }
}

// Mock members for allocation preview
const mockMembers: Partial<Member>[] = [
  { id: '1', firstName: 'John', lastName: 'Smith', currentEquity: { estimatedPercentage: 15.5, finalPercentage: 15.5, capitalBalance: 2500000 } },
  { id: '2', firstName: 'Jane', lastName: 'Doe', currentEquity: { estimatedPercentage: 12.3, finalPercentage: 12.3, capitalBalance: 1950000 } },
  { id: '3', firstName: 'Robert', lastName: 'Johnson', currentEquity: { estimatedPercentage: 10.8, finalPercentage: 10.8, capitalBalance: 1750000 } },
  { id: '4', firstName: 'Mary', lastName: 'Williams', currentEquity: { estimatedPercentage: 8.5, finalPercentage: 8.5, capitalBalance: 1400000 } },
  { id: '5', firstName: 'David', lastName: 'Brown', currentEquity: { estimatedPercentage: 7.2, finalPercentage: 7.2, capitalBalance: 1200000 } },
  { id: '6', firstName: 'Lisa', lastName: 'Jones', currentEquity: { estimatedPercentage: 6.9, finalPercentage: 6.9, capitalBalance: 1100000 } },
  { id: '7', firstName: 'Michael', lastName: 'Davis', currentEquity: { estimatedPercentage: 5.4, finalPercentage: 5.4, capitalBalance: 875000 } },
  { id: '8', firstName: 'Sarah', lastName: 'Miller', currentEquity: { estimatedPercentage: 4.8, finalPercentage: 4.8, capitalBalance: 780000 } },
  { id: '9', firstName: 'James', lastName: 'Wilson', currentEquity: { estimatedPercentage: 4.2, finalPercentage: 4.2, capitalBalance: 680000 } },
  { id: '10', firstName: 'Patricia', lastName: 'Moore', currentEquity: { estimatedPercentage: 3.9, finalPercentage: 3.9, capitalBalance: 630000 } }
]

// Hook for company financials
export function useMockCompanyFinancials(fiscalYear: number) {
  const [data, setData] = useState<CompanyFinancials | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // 70% chance financials exist for the year
        if (Math.random() > 0.3) {
          setData(generateMockFinancials(fiscalYear))
        } else {
          setData(null)
        }
        setError(null)
      } catch (err) {
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [fiscalYear])

  return { data, isLoading, error }
}

// Hook for allocation preview
export function useMockAllocationPreview(fiscalYear: number, enabled: boolean = true) {
  const [data, setData] = useState<AllocationPreview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false)
      return
    }

    const fetchData = async () => {
      setIsLoading(true)
      try {
        await new Promise(resolve => setTimeout(resolve, 800))
        
        const financials = generateMockFinancials(fiscalYear)
        
        // Calculate effective return rate: Min(SOFR + 5%, 10%)
        const effectiveReturnRate = Math.round(Math.min(financials.sofrRate + 5, 10) * 100) / 100
        
        // First pass: Calculate balance incentive returns for all members
        let totalBalanceIncentiveReturns = 0
        const memberBalanceReturns = mockMembers.map(member => {
          const currentCapital = member.currentEquity?.capitalBalance || 0
          const balanceIncentiveReturn = Math.floor((currentCapital * effectiveReturnRate) / 100)
          totalBalanceIncentiveReturns += balanceIncentiveReturn
          
          return {
            member,
            currentCapital,
            balanceIncentiveReturn
          }
        })
        
        // Calculate remaining net income after balance incentive returns
        const remainingNetIncome = financials.finalAllocableAmount - totalBalanceIncentiveReturns
        
        // Second pass: Calculate equity-based allocations
        const allocations = memberBalanceReturns.map(({ member, currentCapital, balanceIncentiveReturn }) => {
          const equityPercentage = member.currentEquity?.finalPercentage || 0
          const equityBasedAllocation = Math.floor((remainingNetIncome * equityPercentage) / 100)
          const totalAllocation = balanceIncentiveReturn + equityBasedAllocation
          
          return {
            member: {
              id: member.id!,
              firstName: member.firstName!,
              lastName: member.lastName!,
              equityPercentage,
              currentCapitalBalance: currentCapital
            },
            allocationAmount: totalAllocation,
            balanceIncentiveReturn,
            equityBasedAllocation,
            effectiveReturnRate,
            newCapitalBalance: currentCapital + totalAllocation,
            distributionsToDate: Math.floor(Math.random() * 500000) // Random distributions
          }
        })
        
        // Update financials with allocation breakdown
        financials.totalBalanceIncentiveReturns = totalBalanceIncentiveReturns
        financials.remainingNetIncome = remainingNetIncome
        financials.effectiveReturnRate = effectiveReturnRate
        
        setData(allocations)
        setError(null)
      } catch (err) {
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [fiscalYear, enabled])

  return { data, isLoading, error }
}

// Hook for balance sheet reconciliation
export function useMockBalanceSheetReconciliation(fiscalYear: number, enabled: boolean = true) {
  const [data, setData] = useState<BalanceSheetReconciliation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false)
      return
    }

    const fetchData = async () => {
      setIsLoading(true)
      try {
        await new Promise(resolve => setTimeout(resolve, 600))
        
        const totalEquity = 35000000 + Math.random() * 5000000
        const memberCapital = totalEquity * 0.7
        const retainedEarnings = totalEquity * 0.25
        const additionalCapital = totalEquity * 0.05
        
        const systemMemberCapital = memberCapital + (Math.random() * 10000 - 5000)
        const systemRetained = retainedEarnings + (Math.random() * 5000 - 2500)
        const systemAdditional = additionalCapital
        
        const reconciliation: BalanceSheetReconciliation = {
          fiscalYear,
          totalEquityPerBalanceSheet: totalEquity,
          retainedEarnings,
          additionalPaidInCapital: additionalCapital,
          memberCapitalAccounts: memberCapital,
          calculatedMemberCapitalTotal: systemMemberCapital,
          systemRetainedEarnings: systemRetained,
          systemAdditionalCapital: systemAdditional,
          capitalAccountsDifference: memberCapital - systemMemberCapital,
          retainedEarningsDifference: retainedEarnings - systemRetained,
          totalDifference: (memberCapital - systemMemberCapital) + (retainedEarnings - systemRetained),
          isReconciled: Math.abs((memberCapital - systemMemberCapital) + (retainedEarnings - systemRetained)) < 1,
          lastReconciledDate: new Date().toISOString(),
          reconciledBy: 'System Administrator',
          notes: 'Automatic reconciliation performed'
        }
        
        setData(reconciliation)
        setError(null)
      } catch (err) {
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [fiscalYear, enabled])

  return { data, isLoading, error }
}

// Hook for historical financials data
export function useMockHistoricalFinancials(years: number = 5) {
  const [data, setData] = useState<CompanyFinancials[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        await new Promise(resolve => setTimeout(resolve, 400))
        
        const currentYear = new Date().getFullYear()
        const historicalData = Array.from({ length: years }, (_, i) => {
          return generateMockFinancials(currentYear - i)
        })
        
        setData(historicalData)
        setError(null)
      } catch (err) {
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [years])

  return { data, isLoading, error }
}

// Hook for member allocations
export function useMockMemberAllocations(fiscalYear: number, memberId?: string) {
  const [data, setData] = useState<MemberAllocation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const financials = generateMockFinancials(fiscalYear)
        const members = memberId ? mockMembers.filter(m => m.id === memberId) : mockMembers
        
        // Calculate effective return rate: Min(SOFR + 5%, 10%)
        const effectiveReturnRate = Math.round(Math.min(financials.sofrRate + 5, 10) * 100) / 100
        
        // First calculate total balance incentive returns
        let totalBalanceIncentiveReturns = 0
        members.forEach(member => {
          const currentCapital = member.currentEquity?.capitalBalance || 0
          totalBalanceIncentiveReturns += Math.floor((currentCapital * effectiveReturnRate) / 100)
        })
        
        const remainingNetIncome = financials.finalAllocableAmount - totalBalanceIncentiveReturns
        
        const allocations = members.map(member => {
          const equityPercentage = member.currentEquity?.finalPercentage || 0
          const beginningBalance = member.currentEquity?.capitalBalance || 0
          
          // Calculate both types of allocation
          const balanceIncentiveReturn = Math.floor((beginningBalance * effectiveReturnRate) / 100)
          const equityBasedAllocation = Math.floor((remainingNetIncome * equityPercentage) / 100)
          const totalAllocation = balanceIncentiveReturn + equityBasedAllocation
          
          const distributions = Math.floor(Math.random() * 200000)
          
          return {
            id: `alloc-${member.id}-${fiscalYear}`,
            companyFinancialsId: financials.id,
            memberId: member.id!,
            fiscalYear,
            equityPercentage,
            allocationAmount: totalAllocation,
            balanceIncentiveReturn,
            equityBasedAllocation,
            effectiveReturnRate,
            beginningCapitalBalance: beginningBalance,
            allocationCredit: totalAllocation,
            distributions,
            endingCapitalBalance: beginningBalance + totalAllocation - distributions,
            sofrInterest: Math.floor(totalAllocation * financials.sofrRate / 100),
            sofrInterestRate: financials.sofrRate,
            allocationDate: financials.allocationDate!,
            notes: 'Year-end allocation',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        })
        
        setData(allocations)
        setError(null)
      } catch (err) {
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [fiscalYear, memberId])

  return { data, isLoading, error }
}

// Hook for allocation summary
export function useMockAllocationSummary(fiscalYear: number) {
  const [data, setData] = useState<AllocationSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        await new Promise(resolve => setTimeout(resolve, 300))
        
        const financials = generateMockFinancials(fiscalYear)
        const memberCount = mockMembers.length
        const allocations = mockMembers.map(m => {
          const percentage = m.currentEquity?.finalPercentage || 0
          return Math.floor((financials.finalAllocableAmount * percentage) / 100)
        })
        
        const summary: AllocationSummary = {
          fiscalYear,
          totalAllocableAmount: financials.finalAllocableAmount,
          totalAllocated: allocations.reduce((sum, a) => sum + a, 0),
          memberCount,
          averageAllocation: Math.floor(financials.finalAllocableAmount / memberCount),
          largestAllocation: Math.max(...allocations),
          smallestAllocation: Math.min(...allocations),
          reconciliationStatus: financials.isReconciled ? 'reconciled' : 'not_reconciled',
          sofrRate: financials.sofrRate
        }
        
        setData(summary)
        setError(null)
      } catch (err) {
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [fiscalYear])

  return { data, isLoading, error }
}